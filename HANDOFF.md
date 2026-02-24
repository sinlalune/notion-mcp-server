# Notion MCP Server — Custom Fork

## What is this?
A fork of the [official Notion MCP server](https://github.com/makenotion/notion-mcp-server) with custom tools added for file upload and media download. The goal is to replace the dumb built-in Notion connector in Claude.ai/Claude Code with a smarter self-hosted one.

## Why?
The built-in Notion MCP connector in Claude.ai:
- Has NO filtered database queries (forces fetching every page individually)
- Has NO file upload/download support
- Costs ~10x more context tokens for simple operations

This fork keeps all 22 original tools (including `query-data-source` with proper filters/sorts) and adds 3 new ones.

## What was added

### 1. File Upload endpoints (auto-generated from OpenAPI spec)
**File:** `scripts/notion-openapi.json` — added 2 new paths at the end:
- `POST /v1/file_uploads` → `create-file-upload` tool
- `POST /v1/file_uploads/{id}/send` → `send-file-upload` tool (multipart)

These follow the existing pattern — the codebase auto-generates MCP tools from the OpenAPI spec. No code changes needed for these.

Step 3 of file upload (attaching to a page/block) already works via existing `post-page` and `patch-block-children` tools.

### 2. Custom tool framework (code change)
**File:** `src/openapi-mcp-server/mcp/proxy.ts`
- Added `CustomToolHandler` and `CustomToolDefinition` types
- Added `customTools` Map to `MCPProxy` class
- Added `registerCustomTool()` and `getHttpClient()` methods
- Modified `ListToolsRequestSchema` handler to include custom tools
- Modified `CallToolRequestSchema` handler to check custom tools first before OpenAPI lookup

### 3. `get-media` custom tool
**File:** `src/custom-tools/get-media.ts`
- Accepts `block_id` (specific image block) or `page_id` (finds first image on page)
- Fetches block data from Notion API
- Extracts temporary S3 URL (handles file, external, file_upload types)
- Downloads the image binary
- Returns base64 directly to Claude (Claude sees the image natively — no Vision API needed)
- Supports image, PDF, video, file blocks

### 4. Registration
**File:** `src/init-server.ts`
- Imports `createGetMediaTool`
- Builds Notion headers from env vars (`NOTION_TOKEN` or `OPENAPI_MCP_HEADERS`)
- Registers the custom tool on the proxy after creation

### 5. Exports
**File:** `src/openapi-mcp-server/index.ts`
- Added exports for `MCPProxy`, `CustomToolHandler`, `CustomToolDefinition`

## Current status
- TypeScript compiles clean (`npx tsc --noEmit` → 0 errors)
- All 66 existing tests pass (`npx vitest run`)
- **NOT YET TESTED** with a real Notion token
- **NOT YET DEPLOYED** to Cloudflare Workers

## Total tools: 25
- 22 original (pages, blocks, data sources, comments, search, users)
- 2 file upload (create + send — auto-generated from OpenAPI spec)
- 1 get-media (custom — downloads images from Notion blocks)

## Next steps

### 1. Test locally with stdio
```bash
# Set your Notion token
export NOTION_TOKEN=ntn_xxxxx

# Run the server
npx tsx scripts/start-server.ts --transport stdio
```

Or add to Claude Code settings (`.claude/settings.json`):
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["tsx", "C:/Users/toure/Projects/notion-mcp/scripts/start-server.ts"],
      "env": {
        "NOTION_TOKEN": "ntn_xxxxx"
      }
    }
  }
}
```

### 2. Get a Notion integration token
1. Go to https://www.notion.so/profile/integrations
2. Create a new integration (or use existing)
3. Copy the token (starts with `ntn_`)
4. Share your Command Center database with the integration

### 3. Deploy to Cloudflare Workers (remote)
This enables use from Claude.ai mobile/web too:
```bash
npx tsx scripts/start-server.ts --transport http --port 3000
```
Deploy as a Cloudflare Worker with Streamable HTTP transport. Config for Claude.ai:
```json
{
  "mcpServers": {
    "notion": {
      "url": "https://your-notion-mcp.workers.dev/mcp",
      "headers": { "Authorization": "Bearer YOUR_AUTH_TOKEN" }
    }
  }
}
```

## The bigger picture (user workflow)
```
Phone: take photo → Claude.ai app (with project context) → custom MCP → Notion ticket
Desktop: Claude Code → "do my TO DO tasks" → custom MCP → filtered query → gets tasks + images
```

## Architecture note
The codebase is declarative — tools are auto-generated from `scripts/notion-openapi.json`. To add more Notion API endpoints, just add them to the OpenAPI spec. Custom tools (like `get-media`) that need multi-step logic use the `registerCustomTool()` API.

## Origin
Forked from: https://github.com/makenotion/notion-mcp-server (v2.2.0)
