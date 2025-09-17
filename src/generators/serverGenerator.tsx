import { createReactGenerator } from '@kubb/plugin-oas';
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks';
import { getBanner, getFooter } from '@kubb/plugin-oas/utils';
import { pluginTsName } from '@kubb/plugin-ts';
import { pluginZodName } from '@kubb/plugin-zod';
import { File, useApp } from '@kubb/react';
import path from 'node:path';
import { Server } from '../components/Server';
import type { PluginFastMCP } from '../types';

export const serverGenerator = createReactGenerator<PluginFastMCP>({
  name: 'operations',
  Operations({ operations, options }) {
    const { pluginManager, plugin } = useApp<PluginFastMCP>()
    const oas = useOas()
    const { getFile, getName, getSchemas } = useOperationManager()

    const name = 'server'
    const file = pluginManager.getFile({ name, extname: '.ts', pluginKey: plugin.key })

    const jsonFile = pluginManager.getFile({ name: '.fastmcp', extname: '.json', pluginKey: plugin.key })

    const operationsMapped = operations.map((operation) => {
      return {
        tool: {
          name: operation.getOperationId() || operation.getSummary() || `${operation.method.toUpperCase()} ${operation.path}`,
          description: operation.getDescription() || `Make a ${operation.method.toUpperCase()} request to ${operation.path}`,
        },
        fastmcp: {
          name: getName(operation, {
            type: 'function',
            suffix: 'handler',
          }),
          file: getFile(operation),
        },
        zod: {
          name: getName(operation, {
            type: 'function',
            pluginKey: [pluginZodName],
          }),
          schemas: getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }),
          file: getFile(operation, { pluginKey: [pluginZodName] }),
        },
        type: {
          schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
        },
      }
    })

    const imports = operationsMapped.flatMap(({ fastmcp, zod }) => {
      // Build relative paths based on known structure
      // Server is at: fastmcp/server.ts
      // Handlers are at: fastmcp/[group]Handlers/[operation].ts
      // Schemas are at: zod/[operation]Schema.ts

      // Extract the group name from fastmcp file path (e.g., "petHandlers" from the path)
      const fastmcpPathParts = fastmcp.file.path.split('/')
      const handlerDir = fastmcpPathParts[fastmcpPathParts.length - 2] // e.g., "petHandlers"
      const handlerFile = fastmcp.file.baseName // e.g., "addPet.ts"
      const fastmcpPath = `./${handlerDir}/${handlerFile}`

      // For zod schemas, they're in ../zod/ relative to fastmcp/
      const zodFile = zod.file.baseName // e.g., "addPetSchema.ts"
      const zodPath = `../zod/${zodFile}`

      return [
        <File.Import key={fastmcp.name} name={[fastmcp.name]} path={fastmcpPath} />,
        <File.Import
          key={zod.name}
          name={[
            zod.schemas.request?.name,
            zod.schemas.pathParams?.name,
            zod.schemas.queryParams?.name,
            zod.schemas.headerParams?.name,
          ].filter((name): name is string => Boolean(name))}
          path={zodPath}
        />,
      ]
    })

    // Use 'fastmcp' directly as it's an npm package
    const resolvedFastmcpPath = 'fastmcp'

    return (
      <>
        <File
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
          footer={getFooter({ oas, output: options.output })}
        >
          <File.Import name={['FastMCP']} path={resolvedFastmcpPath} />

          {imports}
          <Server name={name} serverName={oas.api.info?.title} serverVersion={oas.getVersion()} operations={operationsMapped} />
        </File>

        <File baseName={jsonFile.baseName} path={jsonFile.path} meta={jsonFile.meta}>
          <File.Source name={name}>
            {(() => {
              const runtimeConfig = plugin.options.runtime === 'node'
                ? { command: 'npx', args: ['tsx', file.path] }
                : { command: 'bun', args: [file.path] }

              return `
          {
            "fastmcpServers": {
              "${oas.api.info?.title || 'server'}-stdio": {
                "type": "stdio",
                "command": "${runtimeConfig.command}",
                "args": [${runtimeConfig.args.map(arg => `"${arg}"`).join(', ')}, "--transport", "stdio"]
              },
              "${oas.api.info?.title || 'server'}-http": {
                "type": "httpStream",
                "command": "${runtimeConfig.command}",
                "args": [${runtimeConfig.args.map(arg => `"${arg}"`).join(', ')}, "--transport", "httpStream", "--port", "8080"]
              }
            }
          }
          `
            })()}
          </File.Source>
        </File>
      </>
    )
  },
})