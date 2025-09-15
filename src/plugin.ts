import path from 'node:path';

import { FileManager, type Group, PluginManager, createPlugin } from '@kubb/core';
import { camelCase } from '@kubb/core/transformers';
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas';
import { pluginTsName } from '@kubb/plugin-ts';

import type { Plugin } from '@kubb/core';
import type { PluginOas as OasPluginOptions } from '@kubb/plugin-oas';
import { pluginZodName } from '@kubb/plugin-zod';
import { fastmcpGenerator, serverGenerator } from './generators';
import type { PluginFastMCP } from './types.ts';

export const pluginFastMCPName = 'plugin-fastmcp' satisfies PluginFastMCP['name']

export const pluginFastMCP = createPlugin<PluginFastMCP>((options) => {
  const {
    output = { path: 'fastmcp', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    generators = [fastmcpGenerator, serverGenerator].filter(Boolean),
    contentType,
    client,
  } = options

  return {
    name: pluginFastMCPName,
    options: {
      output,
      group,
      client: {
        importPath: client?.importPath ?? 'fastmcp/client',
        dataReturnType: client?.dataReturnType ?? 'data',
        ...client,
      },
    },
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

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        oas,
        pluginManager: this.pluginManager,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      })

      const files = await operationGenerator.build(...generators)
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