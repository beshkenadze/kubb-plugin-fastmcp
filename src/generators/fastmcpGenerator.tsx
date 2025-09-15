import { Client } from '@kubb/plugin-client/components';
import { createReactGenerator } from '@kubb/plugin-oas';
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks';
import { getBanner, getFooter } from '@kubb/plugin-oas/utils';
import { pluginTsName } from '@kubb/plugin-ts';
import { File, useApp } from '@kubb/react';
import type { PluginFastMCP } from '../types';

export const fastmcpGenerator = createReactGenerator<PluginFastMCP>({
  name: 'fastmcp',
  Operation({ operation }) {
    const {
      plugin: { options },
    } = useApp<PluginFastMCP>()
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

    return (
      <File
        baseName={fastmcp.file.baseName}
        path={fastmcp.file.path}
        meta={fastmcp.file.meta}
        banner={getBanner({ oas, output: options.output })}
        footer={getFooter({ oas, output: options.output })}
      >
        <File.Import name={['FastMCPResult']} path={'fastmcp/types'} isTypeOnly />
        <File.Import name={'fetch'} path={options.client.importPath} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.client.importPath} isTypeOnly />
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
          path={type.file.path}
          isTypeOnly
        />

        <Client
          name={fastmcp.name}
          isConfigurable={false}
          returnType={'Promise<FastMCPResult>'}
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