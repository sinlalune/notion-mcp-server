/**
 * Cloudflare Worker entry point for Notion MCP Server.
 *
 * Implements the MCP JSON-RPC protocol over Streamable HTTP.
 * Uses native fetch (no axios/express) for Workers compatibility.
 * OAuth 2.0 Authorization Code flow (with PKCE) for Claude.ai authentication.
 *
 * Deploy:
 *   npx wrangler deploy
 *
 * Set secrets:
 *   npx wrangler secret put NOTION_TOKEN
 *   npx wrangler secret put OAUTH_CLIENT_ID
 *   npx wrangler secret put OAUTH_CLIENT_SECRET
 */

import { OpenAPIToMCPConverter } from './openapi-mcp-server/openapi/parser'
import { createGetMediaTool } from './custom-tools/get-media'
import type { OpenAPIV3 } from 'openapi-types'

// @ts-ignore — JSON import handled by wrangler's esbuild bundler
import notionSpec from '../scripts/notion-openapi.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  NOTION_TOKEN: string
  OAUTH_CLIENT_ID: string
  OAUTH_CLIENT_SECRET: string
}

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

interface ToolDef {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
  annotations?: Record<string, unknown>
}

type ToolHandler = (params: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>
  isError?: boolean
}>

interface ToolEntry {
  tool: ToolDef
  handler: ToolHandler
}

// ---------------------------------------------------------------------------
// OAuth 2.0 Authorization Code flow with PKCE
// ---------------------------------------------------------------------------

// Base64url encode bytes
function base64urlEncode(data: Uint8Array): string {
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Base64url encode string
function base64urlEncodeString(str: string): string {
  return base64urlEncode(new TextEncoder().encode(str))
}

// Base64url decode to string
function base64urlDecodeString(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

// HMAC-SHA256 sign
async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64urlEncode(new Uint8Array(sig))
}

// Generate a deterministic access token from client credentials
async function generateAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${clientId}:${clientSecret}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(hash)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Verify PKCE code_challenge against code_verifier
async function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
  method: string | null,
): Promise<boolean> {
  if (!method || method === 'plain') {
    return codeVerifier === codeChallenge
  }
  if (method === 'S256') {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
    const computed = base64urlEncode(new Uint8Array(hash))
    return computed === codeChallenge
  }
  return false
}

async function validateOAuthToken(request: Request, env: Env): Promise<boolean> {
  if (!env.OAUTH_CLIENT_ID || !env.OAUTH_CLIENT_SECRET) {
    return true // No OAuth configured → allow all
  }

  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return false

  const expected = await generateAccessToken(env.OAUTH_CLIENT_ID, env.OAUTH_CLIENT_SECRET)
  return token === expected
}

function handleOAuthMetadata(request: Request): Response {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return Response.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    grant_types_supported: ['authorization_code'],
    response_types_supported: ['code'],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: ['mcp'],
  })
}

function handleProtectedResourceMetadata(request: Request): Response {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return Response.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ['mcp'],
  })
}

// GET /authorize — auto-approves and redirects back with an authorization code
async function handleAuthorize(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const clientId = url.searchParams.get('client_id')
  const redirectUri = url.searchParams.get('redirect_uri')
  const state = url.searchParams.get('state')
  const codeChallenge = url.searchParams.get('code_challenge')
  const codeChallengeMethod = url.searchParams.get('code_challenge_method')
  const responseType = url.searchParams.get('response_type')

  if (responseType !== 'code') {
    return Response.json({ error: 'unsupported_response_type' }, { status: 400 })
  }

  if (clientId !== env.OAUTH_CLIENT_ID) {
    return Response.json({ error: 'invalid_client' }, { status: 401 })
  }

  if (!redirectUri) {
    return Response.json({ error: 'invalid_request', error_description: 'redirect_uri required' }, { status: 400 })
  }

  // Build a self-contained authorization code (signed, stateless)
  const payload = JSON.stringify({
    cid: clientId,
    uri: redirectUri,
    cc: codeChallenge || '',
    ccm: codeChallengeMethod || '',
    exp: Date.now() + 5 * 60 * 1000, // 5 min expiry
  })
  const payloadB64 = base64urlEncodeString(payload)
  const signature = await hmacSign(payload, env.OAUTH_CLIENT_SECRET)
  const code = `${payloadB64}.${signature}`

  // Redirect back to Claude.ai with the code
  const callbackUrl = new URL(redirectUri)
  callbackUrl.searchParams.set('code', code)
  if (state) callbackUrl.searchParams.set('state', state)

  return Response.redirect(callbackUrl.toString(), 302)
}

// POST /oauth/token — exchanges authorization code for access token
async function handleTokenRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let params: URLSearchParams

  const contentType = request.headers.get('Content-Type') || ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    params = new URLSearchParams(await request.text())
  } else if (contentType.includes('application/json')) {
    const body = (await request.json()) as Record<string, string>
    params = new URLSearchParams(body)
  } else {
    params = new URLSearchParams(await request.text())
  }

  const grantType = params.get('grant_type')
  const clientId = params.get('client_id')
  const clientSecret = params.get('client_secret')

  // Validate client credentials
  if (clientId !== env.OAUTH_CLIENT_ID || clientSecret !== env.OAUTH_CLIENT_SECRET) {
    return Response.json({ error: 'invalid_client' }, { status: 401 })
  }

  if (grantType === 'authorization_code') {
    const code = params.get('code')
    const codeVerifier = params.get('code_verifier')

    if (!code) {
      return Response.json({ error: 'invalid_request', error_description: 'code required' }, { status: 400 })
    }

    // Decode and verify the self-contained authorization code
    const dotIdx = code.lastIndexOf('.')
    if (dotIdx === -1) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 })
    }

    const payloadB64 = code.slice(0, dotIdx)
    const signature = code.slice(dotIdx + 1)
    let payload: string

    try {
      payload = base64urlDecodeString(payloadB64)
    } catch {
      return Response.json({ error: 'invalid_grant' }, { status: 400 })
    }

    // Verify HMAC signature
    const expectedSig = await hmacSign(payload, env.OAUTH_CLIENT_SECRET)
    if (signature !== expectedSig) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 })
    }

    const data = JSON.parse(payload) as {
      cid: string
      uri: string
      cc: string
      ccm: string
      exp: number
    }

    // Check expiry
    if (Date.now() > data.exp) {
      return Response.json({ error: 'invalid_grant', error_description: 'code expired' }, { status: 400 })
    }

    // Check client_id matches
    if (data.cid !== clientId) {
      return Response.json({ error: 'invalid_grant' }, { status: 400 })
    }

    // Verify PKCE if a code_challenge was provided
    if (data.cc && codeVerifier) {
      const pkceValid = await verifyPkce(codeVerifier, data.cc, data.ccm || 'plain')
      if (!pkceValid) {
        return Response.json({ error: 'invalid_grant', error_description: 'PKCE verification failed' }, { status: 400 })
      }
    }

    const accessToken = await generateAccessToken(clientId, env.OAUTH_CLIENT_SECRET)

    return Response.json({
      access_token: accessToken,
      token_type: 'bearer',
      scope: 'mcp',
    })
  }

  if (grantType === 'client_credentials') {
    const accessToken = await generateAccessToken(clientId, env.OAUTH_CLIENT_SECRET)

    return Response.json({
      access_token: accessToken,
      token_type: 'bearer',
      scope: 'mcp',
    })
  }

  return Response.json({ error: 'unsupported_grant_type' }, { status: 400 })
}

// ---------------------------------------------------------------------------
// Param deserialization (handles double-serialized JSON from MCP clients)
// ---------------------------------------------------------------------------

function deserializeParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          const parsed = JSON.parse(value)
          if (typeof parsed === 'object' && parsed !== null) {
            result[key] = Array.isArray(parsed)
              ? parsed
              : deserializeParams(parsed as Record<string, unknown>)
            continue
          }
        } catch {
          /* keep original */
        }
      }
    }
    result[key] = value
  }
  return result
}

// ---------------------------------------------------------------------------
// OpenAPI operation executor (native fetch, no axios)
// ---------------------------------------------------------------------------

// Check if an operation expects multipart/form-data
function isMultipartOperation(operation: OpenAPIV3.OperationObject): boolean {
  if (!operation.requestBody) return false
  const rb = operation.requestBody as OpenAPIV3.RequestBodyObject
  return !!rb.content?.['multipart/form-data']
}

// Decode base64 (standard or URL-safe) to Uint8Array
function decodeBase64ToBytes(b64: string): Uint8Array {
  // Strip data URL prefix if present (e.g., "data:image/png;base64,iVBOR...")
  const raw = b64.includes(',') && b64.startsWith('data:') ? b64.split(',')[1] : b64
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (raw.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Detect MIME type from file magic bytes
function detectMimeType(bytes: Uint8Array): string {
  if (bytes.length < 4) return 'application/octet-stream'
  const h = (i: number) => bytes[i]

  // JPEG: FF D8 FF
  if (h(0) === 0xff && h(1) === 0xd8 && h(2) === 0xff) return 'image/jpeg'
  // PNG: 89 50 4E 47
  if (h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4e && h(3) === 0x47) return 'image/png'
  // GIF: 47 49 46 38
  if (h(0) === 0x47 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x38) return 'image/gif'
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46 && bytes.length > 11 && h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50) return 'image/webp'
  // PDF: 25 50 44 46
  if (h(0) === 0x25 && h(1) === 0x50 && h(2) === 0x44 && h(3) === 0x46) return 'application/pdf'
  // HEIC/HEIF: ... 66 74 79 70 (ftyp at offset 4)
  if (bytes.length > 11 && h(4) === 0x66 && h(5) === 0x74 && h(6) === 0x79 && h(7) === 0x70) return 'image/heic'

  return 'application/octet-stream'
}

// Resolve file value: could be base64 string, data URL, or a URL to fetch
async function resolveFileValue(
  value: string,
): Promise<{ bytes: Uint8Array; detectedType: string }> {
  // Data URL — extract mime type and decode base64 payload
  if (value.startsWith('data:')) {
    const match = value.match(/^data:([^;]+);base64,/)
    const detectedType = match?.[1] || 'application/octet-stream'
    return { bytes: decodeBase64ToBytes(value), detectedType }
  }

  // HTTP(S) URL — fetch the content
  if (value.startsWith('http://') || value.startsWith('https://')) {
    const resp = await fetch(value)
    if (!resp.ok) throw new Error(`Failed to fetch file from URL: ${resp.status}`)
    const detectedType = resp.headers.get('Content-Type') || 'application/octet-stream'
    const buf = await resp.arrayBuffer()
    return { bytes: new Uint8Array(buf), detectedType }
  }

  // Plain base64 string — decode then detect MIME from magic bytes
  const bytes = decodeBase64ToBytes(value)
  const detectedType = detectMimeType(bytes)
  return { bytes, detectedType }
}

async function executeOperation(
  baseUrl: string,
  headers: Record<string, string>,
  operation: OpenAPIV3.OperationObject & { method: string; path: string },
  params: Record<string, unknown>,
): Promise<unknown> {
  let path = operation.path
  const queryParams = new URLSearchParams()
  const bodyParams: Record<string, unknown> = { ...params }

  // Separate path / query / body parameters
  if (operation.parameters) {
    for (const p of operation.parameters) {
      const param = p as OpenAPIV3.ParameterObject
      if (param.name && params[param.name] !== undefined) {
        if (param.in === 'path') {
          path = path.replace(`{${param.name}}`, encodeURIComponent(String(params[param.name])))
          delete bodyParams[param.name]
        } else if (param.in === 'query') {
          queryParams.set(param.name, String(params[param.name]))
          delete bodyParams[param.name]
        }
      }
    }
  }

  // No requestBody in spec → remaining params become query params
  if (!operation.requestBody) {
    for (const [key, value] of Object.entries(bodyParams)) {
      if (value !== undefined) {
        queryParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
    }
    for (const key of Object.keys(bodyParams)) delete bodyParams[key]
  }

  const qs = queryParams.toString()
  const url = `${baseUrl}${path}${qs ? '?' + qs : ''}`
  const method = operation.method.toUpperCase()
  const hasBody =
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && Object.keys(bodyParams).length > 0

  const fetchHeaders: Record<string, string> = { ...headers }

  // Build request body — multipart/form-data for file uploads, JSON otherwise
  let body: BodyInit | undefined
  const isMultipart = isMultipartOperation(operation)

  if (hasBody && isMultipart) {
    // For multipart: build FormData with file as Blob
    // Accepts base64 string, data URL, or HTTP(S) URL for the "file" param
    const formData = new FormData()
    for (const [key, value] of Object.entries(bodyParams)) {
      if (key === 'file' && typeof value === 'string') {
        const filename = (bodyParams.filename as string) || 'upload'
        const explicitType = bodyParams.content_type as string | undefined
        const { bytes, detectedType } = await resolveFileValue(value)
        const contentType = explicitType || detectedType
        formData.append('file', new Blob([bytes], { type: contentType }), filename)
      } else if (key !== 'filename' && key !== 'content_type') {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
    }
    body = formData
    // Remove Content-Type so fetch sets the multipart boundary automatically
    delete fetchHeaders['Content-Type']
  } else if (hasBody) {
    body = JSON.stringify(bodyParams)
  } else {
    delete fetchHeaders['Content-Type']
  }

  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body,
  })

  const data: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    return {
      status: 'error',
      ...(typeof data === 'object' && data !== null ? (data as object) : { data }),
    }
  }

  return data
}

// ---------------------------------------------------------------------------
// Tool registry builder
// ---------------------------------------------------------------------------

function operationIdToTitle(operationId: string): string {
  return operationId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Cache parsed tool definitions at module level (persists across requests in same isolate)
let cachedToolDefs: ReturnType<OpenAPIToMCPConverter['convertToMCPTools']> | null = null

function getToolDefs() {
  if (!cachedToolDefs) {
    const spec = notionSpec as unknown as OpenAPIV3.Document
    const converter = new OpenAPIToMCPConverter(spec)
    cachedToolDefs = converter.convertToMCPTools()
  }
  return cachedToolDefs
}

function buildToolRegistry(env: Env): Map<string, ToolEntry> {
  const registry = new Map<string, ToolEntry>()
  const spec = notionSpec as unknown as OpenAPIV3.Document
  const baseUrl = spec.servers?.[0]?.url || 'https://api.notion.com'

  const notionHeaders: Record<string, string> = {
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    'Notion-Version': '2025-09-03',
    'Content-Type': 'application/json',
    'User-Agent': 'notion-mcp-server/worker',
  }

  const { tools, openApiLookup } = getToolDefs()

  // Register auto-generated OpenAPI tools
  for (const [toolName, def] of Object.entries(tools)) {
    for (const method of def.methods) {
      const fullName = `${toolName}-${method.name}`
      const truncatedName = fullName.slice(0, 64)
      const operation = openApiLookup[fullName]
      const httpMethod = operation?.method?.toLowerCase()
      const isReadOnly = httpMethod === 'get'

      registry.set(truncatedName, {
        tool: {
          name: truncatedName,
          description: method.description,
          inputSchema: method.inputSchema as Record<string, unknown>,
          annotations: {
            title: operationIdToTitle(method.name),
            ...(isReadOnly ? { readOnlyHint: true } : { destructiveHint: true }),
          },
        },
        handler: async (params) => {
          try {
            const result = await executeOperation(baseUrl, notionHeaders, operation, params)
            return { content: [{ type: 'text', text: JSON.stringify(result) }] }
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    message: (error as Error).message,
                  }),
                },
              ],
              isError: true,
            }
          }
        },
      })
    }
  }

  // Register get-media custom tool
  const mediaHeaders: Record<string, string> = {
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    'Notion-Version': '2025-09-03',
  }
  const mediaDef = createGetMediaTool(mediaHeaders)
  registry.set(mediaDef.tool.name, {
    tool: {
      name: mediaDef.tool.name,
      description: mediaDef.tool.description,
      inputSchema: mediaDef.tool.inputSchema as Record<string, unknown>,
      annotations: mediaDef.tool.annotations,
    },
    handler: mediaDef.handler,
  })

  // Register describe-image-to-page custom tool (generates ASCII art description and appends to page)
  registry.set('describe-image-to-page', {
    tool: {
      name: 'describe-image-to-page',
      description:
        'When you see an image in the conversation (photo, screenshot, schema, diagram, wireframe, etc.), use this tool to describe it and append a visual representation to a Notion page. ' +
        'You MUST provide: a detailed text description, and an ASCII art representation of what you see. ' +
        'For SCHEMAS/DIAGRAMS/WIREFRAMES: reproduce the structure faithfully using box-drawing characters (┌─┐│└─┘├┤┬┴┼), arrows (→←↑↓↔), and Unicode blocks (░▒▓█). ' +
        'For PHOTOS: use shading characters (░▒▓█) and line art to represent the visual content. ' +
        'Use this instead of file upload when the user shares any visual content in the chat.',
      inputSchema: {
        type: 'object',
        required: ['page_id', 'description', 'ascii_art'],
        properties: {
          page_id: {
            type: 'string',
            description: 'The Notion page ID to append the content to',
          },
          description: {
            type: 'string',
            description: 'A detailed text description of the image (what you see, colors, objects, context)',
          },
          ascii_art: {
            type: 'string',
            description: 'An ASCII art representation of the image. Use characters like ░▒▓█ for shading, and line art for shapes. Make it as detailed as possible.',
          },
          caption: {
            type: 'string',
            description: 'Optional short caption for the image',
          },
        },
      },
      annotations: { title: 'Describe Image To Page' },
    },
    handler: async (params) => {
      try {
        const pageId = params.page_id as string
        const description = params.description as string
        const asciiArt = params.ascii_art as string
        const caption = (params.caption as string) || 'Image description'

        const notionHeaders: Record<string, string> = {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          'Notion-Version': '2025-09-03',
          'Content-Type': 'application/json',
        }

        const children = [
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: `📷 ${caption}` } }],
            },
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: description } }],
            },
          },
          {
            type: 'code',
            code: {
              rich_text: [{ type: 'text', text: { content: asciiArt } }],
              language: 'plain text',
            },
          },
        ]

        const appendResp = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ children }),
        })
        if (!appendResp.ok) {
          const err = await appendResp.text()
          return { content: [{ type: 'text', text: `Failed to append to page: ${err}` }], isError: true }
        }

        const result = await appendResp.json()
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                page_id: pageId,
                blocks_added: 3,
                ...result,
              }),
            },
          ],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed: ${(error as Error).message}` }],
          isError: true,
        }
      }
    },
  })

  return registry
}

// ---------------------------------------------------------------------------
// JSON-RPC handler
// ---------------------------------------------------------------------------

async function handleJsonRpc(
  request: JsonRpcRequest,
  registry: Map<string, ToolEntry>,
): Promise<JsonRpcResponse | null> {
  const { method, id, params } = request

  // Notifications (no id) don't get a JSON-RPC response
  if (id === undefined || id === null) return null

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'Notion API', version: '1.0.0' },
          instructions: [
            'RÈGLES OBLIGATOIRES pour la gestion des tickets Notion :',
            '',
            '1. CRÉATION / MISE À JOUR DE TICKETS :',
            '   - Avant tout traitement, remplir TOUS les champs disponibles du ticket (titre, statut, priorité, assigné, tags, dates, description, etc.).',
            '   - Si des informations manquent, demander à l\'utilisateur AVANT de créer le ticket.',
            '   - Ne jamais laisser de champs vides si une valeur peut être déduite du contexte.',
            '   - UTILISER les documents de connaissance du projet (architecture, stack technique, conventions, etc.) pour :',
            '     • Identifier les composants/modules concernés par le ticket',
            '     • Ajouter le contexte technique pertinent dans la description',
            '     • Suggérer les fichiers/dossiers probablement impactés',
            '     • Référencer les patterns et conventions du projet',
            '     • Estimer la complexité en fonction de l\'architecture connue',
            '',
            '2. IMAGES, SCHÉMAS ET DIAGRAMMES (OBLIGATOIRE) :',
            '   - Quand l\'utilisateur partage UNE OU PLUSIEURS IMAGES dans la conversation, tu DOIS appeler le tool describe-image-to-page pour CHAQUE image.',
            '   - C\'est NON NÉGOCIABLE : toute image visible dans le chat doit être transcrite sur la page Notion.',
            '   - Croquis/schémas sur cahier : reproduire FIDÈLEMENT la structure dessinée en ASCII avec box-drawing (┌─┐│└─┘├┤┬┴┼), flèches (→←↑↓↔).',
            '   - Wireframes/maquettes : reproduire la disposition des éléments UI en ASCII.',
            '   - Photos : décrire en détail + représentation ASCII avec ░▒▓█.',
            '   - Si le ticket contient une image, appeler describe-image-to-page AVANT de confirmer la création du ticket à l\'utilisateur.',
            '',
            '3. APRÈS TRAITEMENT (développement, fix, analyse, etc.) :',
            '   - Ajouter un COMMENTAIRE sur le ticket avec une synthèse claire du travail réalisé :',
            '     • Ce qui a été fait',
            '     • Les fichiers modifiés',
            '     • Les décisions techniques prises',
            '',
            '4. FIXES ET SUIVIS :',
            '   - Si des corrections (fixes) sont nécessaires après le traitement initial, ajouter un commentaire pour chaque fix avec :',
            '     • La description du problème trouvé',
            '     • La correction appliquée',
            '     • L\'impact sur le ticket',
            '   - Mettre à jour le statut du ticket en conséquence.',
          ].join('\n'),
        },
      }

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} }

    case 'tools/list': {
      const tools = Array.from(registry.values()).map((e) => e.tool)
      return { jsonrpc: '2.0', id, result: { tools } }
    }

    case 'tools/call': {
      const toolName = (params as Record<string, unknown>)?.name as string
      const toolArgs = ((params as Record<string, unknown>)?.arguments ?? {}) as Record<
        string,
        unknown
      >
      const entry = registry.get(toolName)

      if (!entry) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Tool not found: ${toolName}` },
        }
      }

      try {
        const deserializedArgs = deserializeParams(toolArgs)
        const result = await entry.handler(deserializedArgs)
        return { jsonrpc: '2.0', id, result }
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: (error as Error).message },
        }
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      }
  }
}

// ---------------------------------------------------------------------------
// Worker fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
        },
      })
    }

    // Health check (no auth required)
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tools: 25,
        version: 'oauth-v2',
      })
    }

    // OAuth discovery endpoints (no auth required)
    if (url.pathname === '/.well-known/oauth-authorization-server') {
      return handleOAuthMetadata(request)
    }
    if (url.pathname === '/.well-known/oauth-protected-resource') {
      return handleProtectedResourceMetadata(request)
    }

    // OAuth authorize endpoint (auto-approves, redirects back with code)
    if (url.pathname === '/authorize') {
      return handleAuthorize(request, env)
    }

    // OAuth token endpoint
    if (url.pathname === '/oauth/token') {
      return handleTokenRequest(request, env)
    }

    // --- Everything below requires auth ---

    // Only handle /mcp
    if (url.pathname !== '/mcp') {
      return new Response('Not found', { status: 404 })
    }

    // DELETE = session termination (no-op for stateless server)
    if (request.method === 'DELETE') {
      return new Response('', { status: 200 })
    }

    // GET = SSE stream (not supported in stateless mode)
    if (request.method === 'GET') {
      return new Response('SSE not supported', { status: 405 })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // OAuth validation
    const isAuthorized = await validateOAuthToken(request, env)
    if (!isAuthorized) {
      return Response.json(
        { jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': `Bearer resource_metadata="${url.protocol}//${url.host}/.well-known/oauth-protected-resource"`,
          },
        },
      )
    }

    // Parse JSON-RPC body
    let body: JsonRpcRequest | JsonRpcRequest[]
    try {
      body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]
    } catch {
      return Response.json(
        { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
        { status: 400 },
      )
    }

    // Build tool registry
    const registry = buildToolRegistry(env)

    // Handle batch or single request
    const isBatch = Array.isArray(body)
    const requests = isBatch ? body : [body]
    const responses: JsonRpcResponse[] = []

    for (const req of requests) {
      const res = await handleJsonRpc(req, registry)
      if (res !== null) responses.push(res)
    }

    // No responses (all notifications) → 202 Accepted
    if (responses.length === 0) {
      return new Response('', { status: 202 })
    }

    return Response.json(isBatch ? responses : responses[0])
  },
}
