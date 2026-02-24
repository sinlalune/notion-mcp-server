import fs from 'node:fs'
import path from 'node:path'

import { OpenAPIV3 } from 'openapi-types'
import OpenAPISchemaValidator from 'openapi-schema-validator'

import { MCPProxy } from './openapi-mcp-server/mcp/proxy'
import { createGetMediaTool } from './custom-tools/get-media'

export class ValidationError extends Error {
  constructor(public errors: any[]) {
    super('OpenAPI validation failed')
    this.name = 'ValidationError'
  }
}

async function loadOpenApiSpec(specPath: string, baseUrl: string | undefined): Promise<OpenAPIV3.Document> {
  let rawSpec: string

  try {
    rawSpec = fs.readFileSync(path.resolve(process.cwd(), specPath), 'utf-8')
  } catch (error) {
    console.error('Failed to read OpenAPI specification file:', (error as Error).message)
    process.exit(1)
  }

  // Parse and validate the OpenApi Spec
  try {
    const parsed = JSON.parse(rawSpec)

    // Override baseUrl if specified.
    if (baseUrl) {
      parsed.servers[0].url = baseUrl
    }

    return parsed as OpenAPIV3.Document
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    console.error('Failed to parse OpenAPI spec:', (error as Error).message)
    process.exit(1)
  }
}

export async function initProxy(specPath: string, baseUrl: string |undefined) {
  const openApiSpec = await loadOpenApiSpec(specPath, baseUrl)
  const proxy = new MCPProxy('Notion API', openApiSpec)

  // Register custom tools
  const notionToken = process.env.NOTION_TOKEN
  const headersJson = process.env.OPENAPI_MCP_HEADERS
  let notionHeaders: Record<string, string> = {
    'Notion-Version': '2025-09-03'
  }

  if (headersJson) {
    try {
      const parsed = JSON.parse(headersJson)
      if (typeof parsed === 'object' && parsed !== null) {
        notionHeaders = { ...notionHeaders, ...parsed }
      }
    } catch { /* fall through */ }
  } else if (notionToken) {
    notionHeaders['Authorization'] = `Bearer ${notionToken}`
  }

  proxy.registerCustomTool(createGetMediaTool(notionHeaders))

  return proxy
}
