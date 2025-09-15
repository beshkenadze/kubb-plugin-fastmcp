import { createReactGenerator } from '@kubb/plugin-oas';
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks';
import { getBanner, getFooter } from '@kubb/plugin-oas/utils';
import { pluginTsName } from '@kubb/plugin-ts';
import { pluginZodName } from '@kubb/plugin-zod';
import { File, useApp } from '@kubb/react';
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
      return [
        <File.Import key={fastmcp.name} name={[fastmcp.name]} root={file.path} path={fastmcp.file.path} />,
        <File.Import
          key={zod.name}
          name={[
            zod.schemas.request?.name,
            zod.schemas.pathParams?.name,
            zod.schemas.queryParams?.name,
            zod.schemas.headerParams?.name,
          ].filter((name): name is string => Boolean(name))}
          root={file.path}
          path={zod.file.path}
        />,
      ]
    })

    return (
      <>
        <File
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
          footer={getFooter({ oas, output: options.output })}
        >
          <File.Import name={['FastMCPServer']} path={'fastmcp/server'} />
          <File.Import name={['HttpStreamTransport']} path={'fastmcp/server/transport'} />

          {imports}
          <Server name={name} serverName={oas.api.info?.title} serverVersion={oas.getVersion()} operations={operationsMapped} />
        </File>

        <File baseName={jsonFile.baseName} path={jsonFile.path} meta={jsonFile.meta}>
          <File.Source name={name}>
            {`
          {
            "fastmcpServers": {
              "${oas.api.info?.title || 'server'}": {
                "type": "httpStream",
                "command": "npx",
                "args": ["tsx", "${file.path}"]
              }
            }
          }
          `}
          </File.Source>
        </File>
      </>
    )
  },
})