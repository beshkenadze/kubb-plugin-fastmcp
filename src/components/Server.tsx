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
      const requestSchema = operation.zod.schemas.request?.name
      const pathParamsSchema = operation.zod.schemas.pathParams?.name
      const queryParamsSchema = operation.zod.schemas.queryParams?.name
      const headerParamsSchema = operation.zod.schemas.headerParams?.name

      // Check if the request schema is an array-type schema that needs wrapping for FastMCP
      const isArraySchema = requestSchema && (
        requestSchema.includes('ArrayInput') ||
        requestSchema.includes('ListInput')
      )

      let parametersExpression: string

      // Build schema based on what parameters exist
      const schemaParts: string[] = []

      if (requestSchema) {
        if (isArraySchema) {
          // Array schemas always need data wrapper
          schemaParts.push(`data: ${requestSchema}`)
        } else {
          // Regular request schemas need data wrapper to match handler signature
          schemaParts.push(`data: ${requestSchema}`)
        }
      }

      if (pathParamsSchema) {
        // Path params are destructured individually, so spread the schema shape
        schemaParts.push(`...${pathParamsSchema}.shape`)
      }

      if (queryParamsSchema) {
        // Query params are passed as object
        schemaParts.push(`queryParams: ${queryParamsSchema}`)
      }

      if (headerParamsSchema) {
        // Header params are passed as object
        schemaParts.push(`headerParams: ${headerParamsSchema}`)
      }

      if (schemaParts.length > 1) {
        // Multiple parameter types - combine into single object
        parametersExpression = `z.object({ ${schemaParts.join(', ')} })`
      } else if (schemaParts.length === 1) {
        // Single parameter type
        if (requestSchema && !pathParamsSchema && !queryParamsSchema && !headerParamsSchema) {
          // Only request data - wrap in object
          parametersExpression = `z.object({ ${schemaParts[0]} })`
        } else {
          // Only path/query/header params - use schema directly
          parametersExpression = schemaNames[0]
        }
      } else {
        // Fallback - shouldn't happen but handle gracefully
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