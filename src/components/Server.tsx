import { File } from '@kubb/react'
import type { FC } from 'react'
import type { KubbFile } from '@kubb/core/fs'
import type { OperationSchemas } from '@kubb/plugin-oas'

interface Operation {
  tool: {
    name: string
    description: string
  }
  fastmcp: {
    name: string
    file: KubbFile.File
  }
  zod: {
    name: string
    file: KubbFile.File
    schemas: OperationSchemas
  }
  type: {
    schemas: OperationSchemas
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
    const hasParams = operation.zod.schemas.request?.name ||
                     operation.zod.schemas.pathParams?.name ||
                     operation.zod.schemas.queryParams?.name ||
                     operation.zod.schemas.headerParams?.name

    const schemaNames = [
      operation.zod.schemas.request?.name,
      operation.zod.schemas.pathParams?.name,
      operation.zod.schemas.queryParams?.name,
      operation.zod.schemas.headerParams?.name
    ].filter(Boolean)

    if (hasParams) {
      // Check if the request schema is an array-type schema that needs wrapping for FastMCP
      const requestSchema = operation.zod.schemas.request?.name
      const isArraySchema = requestSchema && (
        requestSchema.includes('ArrayInput') ||
        requestSchema.includes('ListInput')
      )

      let parametersExpression: string
      if (isArraySchema && schemaNames.length === 1) {
        // Wrap array schema in object for FastMCP compatibility
        parametersExpression = `z.object({ data: ${requestSchema} })`
      } else {
        // Use existing logic for multiple schemas or non-array schemas
        parametersExpression = schemaNames.join(' || ')
      }

      return `
${name}.addTool({
  name: "${operation.tool.name}",
  description: "${operation.tool.description}",
  parameters: ${parametersExpression},
  execute: async (args) => {
    return await ${operation.fastmcp.name}(args)
  }
})`
    }

    return `
${name}.addTool({
  name: "${operation.tool.name}",
  description: "${operation.tool.description}",
  execute: async () => {
    return await ${operation.fastmcp.name}({})
  }
})`
  }).join('')

  return (
    <File.Source name={name} isExportable isIndexable>
      {`import { z } from "zod";

export const ${name} = new FastMCP({
  name: "${serverName || 'FastMCP Server'}",
  version: "${serverVersion || '1.0.0'}",
})

${tools}

// Parse command-line arguments
const args = process.argv.slice(2)
const transportIndex = args.indexOf('--transport')
const transportType = transportIndex > -1 ? args[transportIndex + 1] : 'stdio'
const portIndex = args.indexOf('--port')
const port = portIndex > -1 ? parseInt(args[portIndex + 1]) : 8080

// Start server with dynamic transport
if (transportType === 'httpStream') {
  ${name}.start({
    transportType: "httpStream",
    httpStream: { port }
  })
} else {
  ${name}.start({
    transportType: "stdio"
  })
}

console.log(\`[FastMCP info] Starting server with transport: \${transportType}\${transportType === 'httpStream' ? \` on port \${port}\` : ''}\`)`}
    </File.Source>
  )
}