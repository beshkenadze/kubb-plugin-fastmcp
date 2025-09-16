import { Client } from '@kubb/plugin-client/components';
import { createReactGenerator } from '@kubb/plugin-oas';
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks';
import { getBanner, getFooter } from '@kubb/plugin-oas/utils';
import { pluginTsName } from '@kubb/plugin-ts';
import { File, useApp } from '@kubb/react';
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

    const resolvedFastmcpPath = resolveImportPath('fastmcp', options, fastmcp.file.path)
    const resolvedClientPath = resolveImportPath('../client', options, fastmcp.file.path)
    const resolvedTypeFilePath = resolveImportPath(type.file.path, options, fastmcp.file.path)

    return (
      <File
        baseName={fastmcp.file.baseName}
        path={fastmcp.file.path}
        meta={fastmcp.file.meta}
        banner={getBanner({ oas, output: options.output })}
        footer={getFooter({ oas, output: options.output })}
      >
        <File.Import name={['ContentResult']} path={resolvedFastmcpPath} isTypeOnly />
        <File.Import name={'fetch'} path={resolvedClientPath} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={resolvedClientPath} isTypeOnly />
        <File.Import
          name={[
            type.schemas.request?.name,
            type.schemas.response?.name,
            type.schemas.pathParams?.name,
            type.schemas.queryParams?.name,
            type.schemas.headerParams?.name,
            ...(type.schemas.statusCodes?.map((item) => item.name) || []),
          ].filter((name): name is string => Boolean(name))}
          root={fastmcp.file.path}
          path={resolvedTypeFilePath}
          isTypeOnly
        />

        <Client
          name={fastmcp.name}
          isConfigurable={false}
          returnType={'Promise<ContentResult>'}
          baseURL={options.client.baseURL}
          operation={operation}
          typeSchemas={type.schemas}
          zodSchemas={undefined}
          dataReturnType={options.client.dataReturnType}
          paramsType={'object'}
          paramsCasing={'camelcase'}
          pathParamsType={'object'}
          parser={'client'}
        >
          {options.client.dataReturnType === 'data' &&
            `return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(res.data)
                }
              ]
            }`}
          {options.client.dataReturnType === 'full' &&
            `return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(res)
                }
              ]
            }`}
        </Client>
      </File>
    )
  },
})