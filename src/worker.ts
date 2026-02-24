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
  if (!hasBody) {
    delete fetchHeaders['Content-Type']
  }

  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: hasBody ? JSON.stringify(bodyParams) : undefined,
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
