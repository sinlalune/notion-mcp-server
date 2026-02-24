import { CustomToolDefinition } from '../openapi-mcp-server/mcp/proxy'

/**
 * Custom tool: get-media
 *
 * Fetches an image/file from a Notion block and returns it as base64.
 * This is needed because Notion returns temporary S3 URLs for hosted files,
 * and there's no single API endpoint to download media directly.
 *
 * Flow:
 * 1. GET /v1/blocks/{block_id} to get the block data
 * 2. Extract the temporary file URL from the block
 * 3. Fetch the binary data from the URL
 * 4. Return as base64 image content to Claude
 */
export function createGetMediaTool(notionHeaders: Record<string, string>): CustomToolDefinition {
  return {
    tool: {
      name: 'get-media',
      description: 'Download an image or file from a Notion block and return it as base64. Use this to view images attached to Notion pages. Provide either a block_id (for a specific image block) or a page_id (to get the first image found on the page).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          block_id: {
            type: 'string',
            description: 'The ID of a specific image/file block to download from'
          },
          page_id: {
            type: 'string',
            description: 'The ID of a page to scan for the first image block'
          }
        }
      },
      annotations: {
        title: 'Get Media',
        readOnlyHint: true,
      }
    },
    handler: async (params: Record<string, unknown>) => {
      const blockId = params.block_id as string | undefined
      const pageId = params.page_id as string | undefined

      if (!blockId && !pageId) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Provide either block_id or page_id' }) }]
        }
      }

      const baseUrl = 'https://api.notion.com'

      try {
        let imageUrl: string | null = null
        let mimeType = 'image/png'

        if (blockId) {
          // Fetch the specific block
          const blockRes = await fetch(`${baseUrl}/v1/blocks/${blockId}`, { headers: notionHeaders })
          if (!blockRes.ok) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: `Failed to fetch block: ${blockRes.status}` }) }]
            }
          }
          const block = await blockRes.json() as Record<string, any>
          imageUrl = extractImageUrl(block)
        } else if (pageId) {
          // Fetch page's block children and find first image
          const childrenRes = await fetch(`${baseUrl}/v1/blocks/${pageId}/children?page_size=100`, { headers: notionHeaders })
          if (!childrenRes.ok) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: `Failed to fetch page blocks: ${childrenRes.status}` }) }]
            }
          }
          const children = await childrenRes.json() as Record<string, any>
          const results = children.results as Record<string, any>[] || []

          for (const block of results) {
            imageUrl = extractImageUrl(block)
            if (imageUrl) break
          }
        }

        if (!imageUrl) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'No image found in the specified block or page' }) }]
          }
        }

        // Detect mime type from URL
        if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')) mimeType = 'image/jpeg'
        else if (imageUrl.includes('.gif')) mimeType = 'image/gif'
        else if (imageUrl.includes('.webp')) mimeType = 'image/webp'
        else if (imageUrl.includes('.svg')) mimeType = 'image/svg+xml'
        else if (imageUrl.includes('.pdf')) mimeType = 'application/pdf'

        // Download the image
        const imageRes = await fetch(imageUrl)
        if (!imageRes.ok) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Failed to download image: ${imageRes.status}` }) }]
          }
        }

        const arrayBuffer = await imageRes.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')

        return {
          content: [{
            type: 'image',
            data: base64,
            mimeType,
          }]
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `get-media failed: ${(error as Error).message}` }) }]
        }
      }
    }
  }
}

function extractImageUrl(block: Record<string, any>): string | null {
  const type = block.type as string

  if (type === 'image') {
    const image = block.image
    if (image?.type === 'file') return image.file?.url || null
    if (image?.type === 'external') return image.external?.url || null
    if (image?.type === 'file_upload') return image.file_upload?.url || null
  }

  if (type === 'file') {
    const file = block.file
    if (file?.type === 'file') return file.file?.url || null
    if (file?.type === 'external') return file.external?.url || null
    if (file?.type === 'file_upload') return file.file_upload?.url || null
  }

  if (type === 'pdf') {
    const pdf = block.pdf
    if (pdf?.type === 'file') return pdf.file?.url || null
    if (pdf?.type === 'external') return pdf.external?.url || null
  }

  if (type === 'video') {
    const video = block.video
    if (video?.type === 'file') return video.file?.url || null
    if (video?.type === 'external') return video.external?.url || null
  }

  return null
}
