import { createPluginManager } from '@kubb/core.js';
import { createOas } from '@kubb/oas';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { describe, expect, it } from 'vitest';
import { fastmcpGenerator, serverGenerator } from '../src/generators';

describe('FastMCP Generators', () => {
  const oas = createOas({
    api: {
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
    },
    paths: {
      '/test': {
        post: {
          operationId: 'createTest',
          summary: 'Create test',
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const operation = oas.getOperation('/test', 'post')!

  const pluginManager = createPluginManager({
    config: {
      root: '.',
      input: { path: 'test.yaml' },
      output: { path: './src/gen' },
    },
    plugins: [
      pluginOas({}),
      pluginTs({}),
    ],
  })

  it('fastmcpGenerator should generate handler', async () => {
    const files = await fastmcpGenerator.operations([operation], {
      pluginManager,
      plugin: { key: 'plugin-fastmcp', options: {} },
    })

    expect(files).toHaveLength(1)
    expect(files[0].path).toContain('createTestHandler')
    expect(files[0].sources[0].value).toMatchSnapshot()
  })

  it('serverGenerator should generate server setup', async () => {
    const files = await serverGenerator.operations([operation], {
      pluginManager,
      plugin: { key: 'plugin-fastmcp', options: {} },
    })

    expect(files).toHaveLength(2)
    expect(files[0].path).toContain('server.ts')
    expect(files[1].path).toContain('.fastmcp.json')
    expect(files[0].sources[0].value).toMatchSnapshot()
  })
})