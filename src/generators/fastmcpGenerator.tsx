import { createReactGenerator } from '@kubb/plugin-oas';
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks';
import { getBanner, getFooter, getPathParams } from '@kubb/plugin-oas/utils';
import { pluginTsName } from '@kubb/plugin-ts';
import { File, useApp } from '@kubb/react';
import path from 'node:path';
import type { PluginFastMCP } from '../types';
import { resolveImportPath } from '../utils/pathResolver';

export const fastmcpGenerator = createReactGenerator<PluginFastMCP>({
  name: 'fastmcp',
  Operation({ operation }) {
    const { plugin } = useApp<PluginFastMCP>()
    const options = plugin.options
    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager()

    const fastmcp = {
      name: getName(operation, { type: 'function', suffix: 'handler' }),
      file: getFile(operation),
    }

    const type = {
      file: getFile(operation, { pluginKey: [pluginTsName] }),
      schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
    }

    const resolvedFastmcpPath = 'fastmcp'

    const isCustomClient = options.client.importPath &&
                          options.client.importPath !== '@kubb/plugin-client/clients/axios'

    let resolvedClientPath = '../client'
    if (isCustomClient) {
      if (options.client.importPath.startsWith('./')) {
        const handlerDir = path.dirname(fastmcp.file.path)
        const outputRoot = options.output.path
        const clientAbsolutePath = path.resolve(outputRoot, '..', options.client.importPath)
        const relativePath = path.relative(handlerDir, clientAbsolutePath)
        const normalizedPath = !relativePath.startsWith('.') ? './' + relativePath : relativePath
        resolvedClientPath = resolveImportPath(normalizedPath, options, handlerDir)
      } else {
        resolvedClientPath = options.client.importPath
      }
    }

    const typeFile = type.file.baseName
    const resolvedTypeFilePath = `../../types/${typeFile}`

    return (
      <File
        baseName={fastmcp.file.baseName}
        path={fastmcp.file.path}
        meta={fastmcp.file.meta}
        banner={getBanner({ oas, output: options.output })}
        footer={getFooter({ oas, output: options.output })}
      >
        <File.Import name={['ContentResult']} path={resolvedFastmcpPath} isTypeOnly />
        <File.Import name={'client'} path={resolvedClientPath} />
        {!isCustomClient && (
          <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={resolvedClientPath} isTypeOnly />
        )}
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response?.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
          ].filter((name): name is string => Boolean(name))}
          path={resolvedTypeFilePath}
          isTypeOnly
        />

        <File.Source name={fastmcp.name} isExportable isIndexable>
          {(() => {
            // Build parameter destructuring and types based on schemas
            const paramParts = []
            const typeParts = []

            if (type.schemas.request) {
              paramParts.push('data')
              typeParts.push(`data: ${type.schemas.request.name}`)
            }

            if (type.schemas.pathParams) {
              // Use the official Kubb utility for extracting path parameters
              const pathParams = getPathParams(type.schemas.pathParams, { typed: true, casing: 'camelcase' })
              const pathParamNames = Object.keys(pathParams)
              paramParts.push(...pathParamNames)
              // Use the existing path params type for proper typing
              pathParamNames.forEach(paramName => {
                typeParts.push(`${paramName}: ${type.schemas.pathParams!.name}['${paramName}']`)
              })
            }

            if (type.schemas.queryParams) {
              paramParts.push('queryParams')
              typeParts.push(`queryParams: ${type.schemas.queryParams.name}`)
            }

            const params = paramParts.length > 0 ? `{ ${paramParts.join(', ')} }` : '{}'
            const paramTypes = typeParts.join('; ')

            const configParts = [
              `method: "${operation.method.toUpperCase()}"`,
              `url: \`${operation.path.replace(/\{([^}]+)\}/g, '${$1}')}\``,
              options.client.baseURL ? `baseURL: "${options.client.baseURL}"` : '',
              type.schemas.request ? 'data: requestData' : '',
              type.schemas.queryParams ? 'params: queryParams' : '',
            ].filter(Boolean)

            const returnContent = options.client.dataReturnType === 'data'
              ? 'JSON.stringify(res.data)'
              : 'JSON.stringify(res)'

            return `export async function ${fastmcp.name}(${params}: { ${paramTypes} }): Promise<ContentResult> {
  ${type.schemas.request ? 'const requestData = data' : ''}

  const res = await client<${type.schemas.response?.name || 'unknown'}, ${type.schemas.errors?.[0]?.name || 'unknown'}, ${type.schemas.request?.name || 'unknown'}>({ ${configParts.join(', ')} })
  return {
    content: [
      {
        type: 'text',
        text: ${returnContent}
      }
    ]
  }
}`
          })()}
        </File.Source>
      </File>
    )
  },
})