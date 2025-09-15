import { File } from '@kubb/react';
import type { FC } from 'react';

interface Operation {
  tool: {
    name: string
    description: string
  }
  fastmcp: {
    name: string
    file: string
  }
}

interface ServerProps {
  name: string
  serverName?: string
  serverVersion?: string
  operations: Operation[]
}

export const Server: FC<ServerProps> = ({ name, serverName, serverVersion, operations }) => {
  const tools = operations.map((operation) => {
    return `{ name: "${operation.tool.name}", description: "${operation.tool.description}", handler: ${operation.fastmcp.name} },`
  }).join('\n')

  return (
    <File.Source>
      {`export const ${name}: FastMCPServer = new FastMCPServer({
  name: "${serverName || 'FastMCP Server'}",
  version: "${serverVersion || '1.0.0'}",
  tools: [
${tools}
  ],
})

${name}.start({ transportType: "httpStream", httpStream: { port: 8080 } })`}
    </File.Source>
  )
}