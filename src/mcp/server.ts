import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { PACKAGE_NAME, PACKAGE_VERSION } from '../installer.js'
import { dispatchTool, toolSchemas, type ToolContext, type ToolName } from './tools.js'

export const SERVER_NAME = 'csd-mcp'

export function createCsdServer(pinnedRoot?: string): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: PACKAGE_VERSION },
    {
      instructions:
        'CSD MCP adapter: a transport and access boundary over the canonical CSD protocol in `.context/`. '
        + 'Use csd_inspect first. csd_context returns the canonical bootstrap; classification, routing and the human conversation stay with you per the .context/ contracts. '
        + 'Durable state lives in .context/work/<id>/; persist through csd_write_artifact and verify with csd_validate. '
        + 'Bootstrap is gated: csd_bootstrap_preview returns a token that csd_bootstrap_apply requires.',
    },
  )
  const context: ToolContext = pinnedRoot ? { pinnedRoot } : {}
  for (const [name, schema] of Object.entries(toolSchemas) as [ToolName, (typeof toolSchemas)[ToolName]][]) {
    server.registerTool(name, schema, async (args: Record<string, unknown>) => dispatchTool(name, args, context))
  }
  return server
}

export async function startCsdServer(pinnedRoot?: string): Promise<void> {
  const server = createCsdServer(pinnedRoot)
  await server.connect(new StdioServerTransport())
}

export { PACKAGE_NAME }
