import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core';

export type ImportStyle = 'auto' | 'needs-js-extension' | 'no-extension-ok' | 'ts-extensions-allowed';

import type { Oas, contentType } from '@kubb/oas';
import type { PluginClient } from '@kubb/plugin-client';
import type { Exclude, Generator, Include, Override, ResolvePathOptions } from '@kubb/plugin-oas';


export type Options = {
  /**
   * Import style for generated code, determines whether to append .js/.ts extensions to imports.
   * 'auto' detects from tsconfig.json (module, moduleResolution, allowImportingTsExtensions).
   * @default 'auto'
   */
  importStyle?: ImportStyle
  /**
   * Runtime to use for generated server configuration
   * 'bun' uses bun directly, 'node' uses npx tsx
   * @default 'bun'
   */
  runtime?: 'bun' | 'node'
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'fastmcp', barrelType: 'named' }
   */
  output?: Output<Oas>
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType will be used
   */
  contentType?: contentType
  client?: Pick<PluginClient['options'], 'dataReturnType' | 'importPath' | 'baseURL'>

  /**
   * Group the fastmcp requests based on the provided name.
   */
  group?: Group
  /**
   * Array containing exclude parameters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>
  /**
   * Array containing include parameters to include tags/operations/methods/paths.
   */
  include?: Array<Include>
  /**
   * Array containing override parameters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  }
  /**
   * Define some generators next to the FastMCP generators.
   */
  generators?: Array<Generator<PluginFastMCP>>
}

export type ResolvedOptions = {
  importStyle: ImportStyle
  runtime: 'bun' | 'node'
  tsconfig: import('get-tsconfig').TsConfigJsonResolved | null
  pathsMatcher: ((request: string) => string[] | undefined) | null
  output: Output<Oas>
  group: Options['group']
  client: Required<Omit<NonNullable<PluginFastMCP['options']['client']>, 'baseURL'>> & { baseURL?: string }
}

export type PluginFastMCP = PluginFactoryOptions<'plugin-fastmcp', Options, ResolvedOptions, never, ResolvePathOptions>
