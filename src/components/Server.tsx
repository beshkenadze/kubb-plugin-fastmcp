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
    ].filter(Boolean).join(' || ')

    if (hasParams) {
      return `
${name}.addTool({
  name: "${operation.tool.name}",
  description: "${operation.tool.description}",
  parameters: ${schemaNames},
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
      {`export const ${name} = new FastMCP({
  name: "${serverName || 'FastMCP Server'}",
  version: "${serverVersion || '1.0.0'}",
})

${tools}

${name}.start({
  transportType: "httpStream",
  httpStream: { port: 8080 }
})`}
    </File.Source>
  )
}