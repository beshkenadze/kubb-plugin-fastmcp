import path from 'node:path';

import { createPathsMatcher, getTsconfig } from 'get-tsconfig';

import { FileManager, type Group, PluginManager, createPlugin } from '@kubb/core';
import { camelCase } from '@kubb/core/transformers';
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas';
import { pluginTsName } from '@kubb/plugin-ts';

import type { Plugin } from '@kubb/core';
import type { PluginOas as OasPluginOptions } from '@kubb/plugin-oas';
import { pluginZodName } from '@kubb/plugin-zod';
import { clientGenerator, fastmcpGenerator, serverGenerator } from './generators';
import type { ImportStyle, PluginFastMCP, ResolvedOptions } from './types';

export const pluginFastMCPName = 'plugin-fastmcp' satisfies PluginFastMCP['name']

export const pluginFastMCP = createPlugin<PluginFastMCP>((options) => {
  const {
    output = { path: 'fastmcp', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    generators = [clientGenerator, fastmcpGenerator, serverGenerator].filter(Boolean),
    contentType,
    client,
    importStyle = 'auto',
    runtime = 'bun',
  } = options

  // Initial resolved options with type assertion to match expected structure
  const resolvedOptions = {
    output,
    group,
    client: {
      importPath: client?.importPath ?? '@kubb/plugin-client/clients/axios',
      dataReturnType: client?.dataReturnType ?? 'data',
      ...client,
    },
    importStyle,
    runtime,
    tsconfig: null as ResolvedOptions['tsconfig'],
    pathsMatcher: null as ResolvedOptions['pathsMatcher'],
  } as ResolvedOptions

  return {
    name: pluginFastMCPName,
    options: resolvedOptions,
    pre: [pluginOasName, pluginTsName, pluginZodName].filter(Boolean),
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = pathMode ?? FileManager.getMode(path.resolve(root, output.path))

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path)
      }

      if (group && (options?.group?.path || options?.group?.tag)) {
        const groupName: Group['name'] = group?.name ?? ((ctx) => {
              if (group?.type === 'path') {
                return `${ctx.group.split('/')[1]}`
              }
              return `${camelCase(ctx.group)}Requests`
            })

        return path.resolve(
          root,
          output.path,
          groupName({
            group: group.type === 'path' ? options.group.path! : options.group.tag!,
          }),
          baseName,
        )
      }

      return path.resolve(root, output.path, baseName)
    },
    resolveName(name, type) {
      const resolvedName = camelCase(name, {
        isFile: type === 'file',
      })

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName
      }

      return resolvedName
    },
    async buildStart() {
      const [oasPlugin]: [Plugin<OasPluginOptions>] = PluginManager.getDependedPlugins<OasPluginOptions>(this.plugins, [pluginOasName])

      const oas = await oasPlugin.context.getOas()
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output.path))

      // Load tsconfig and detect import style if 'auto'
      const tsconfig = getTsconfig(this.config.root)
      let resolvedImportStyle: ImportStyle = importStyle
      let pathsMatcher: ((request: string) => string[] | undefined) | null = null

      if (importStyle === 'auto' && tsconfig?.config.compilerOptions) {
        const { module, moduleResolution, allowImportingTsExtensions } = tsconfig.config.compilerOptions

        if ((moduleResolution === 'node16' || moduleResolution === 'nodenext') && (module === 'node16' || module === 'nodenext')) {
          resolvedImportStyle = 'needs-js-extension'
        } else if (allowImportingTsExtensions) {
          resolvedImportStyle = 'ts-extensions-allowed'
        } else {
          resolvedImportStyle = 'no-extension-ok'
        }
      }

      if (tsconfig) {
        pathsMatcher = createPathsMatcher(tsconfig)
      }

      // Update resolved options
      Object.assign(this.plugin.options, {
        importStyle: resolvedImportStyle,
        tsconfig,
        pathsMatcher,
      })

      const operationGenerator = new OperationGenerator({
        output,
        group,
        exclude,
        include,
        override,
        contentType,
        client: resolvedOptions.client,
        importStyle: resolvedOptions.importStyle,
        tsconfig: resolvedOptions.tsconfig,
        pathsMatcher: resolvedOptions.pathsMatcher,
      } as any, {
        oas,
        pluginManager: this.pluginManager as any,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      })

      // Filter generators based on client configuration
      const shouldGenerateClient = !resolvedOptions.client.importPath ||
                                   resolvedOptions.client.importPath === '@kubb/plugin-client/clients/axios'

      const filteredGenerators = generators.filter(generator => {
        // Skip clientGenerator if using custom import path
        if (generator === clientGenerator && !shouldGenerateClient) {
          return false
        }
        return true
      })

      const files = await operationGenerator.build(...filteredGenerators as any)
      await this.addFile(...files)

      const barrelFiles = await this.fileManager.getBarrelFiles({
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
        logger: this.logger,
      })

      await this.addFile(...barrelFiles)
    },
  }
})