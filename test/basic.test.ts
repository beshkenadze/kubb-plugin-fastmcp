import { describe, expect, it } from 'vitest';
import { pluginFastMCP, pluginFastMCPName } from '../src';

describe('FastMCP Plugin', () => {
  it('should be defined', () => {
    expect(pluginFastMCP).toBeDefined()
  })

  it('should have correct name', () => {
    expect(pluginFastMCPName).toBe('plugin-fastmcp')
  })

  it('should accept options', () => {
    const plugin = pluginFastMCP({ output: { path: './test' } })
    expect(plugin.name).toBe('plugin-fastmcp')
    expect(plugin.options.output).toEqual({ path: './test' })
  })
})