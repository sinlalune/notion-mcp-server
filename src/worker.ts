/**
 * Cloudflare Worker entry point for Notion MCP Server.
 *
 * Implements the MCP JSON-RPC protocol over Streamable HTTP.
 * Uses native fetch (no axios/express) for Workers compatibility.
 *
 * Deploy:
 *   npx wrangler deploy
 *
 * Set secrets:
 *   npx wrangler secret put NOTION_TOKEN
 *   npx wrangler secret put AUTH_TOKEN
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
  AUTH_TOKEN?: string
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

    // Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tools: 25,
      })
    }

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

    // Auth check (if AUTH_TOKEN secret is set)
    if (env.AUTH_TOKEN) {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (token !== env.AUTH_TOKEN) {
        return Response.json(
          { jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null },
          { status: 401 },
        )
      }
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
