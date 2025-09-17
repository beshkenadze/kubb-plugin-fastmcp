import { build } from '@kubb/core';
import { describe, expect, it } from 'vitest';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';
import { pluginFastMCP } from '../src';

describe('FastMCP Plugin Integration', () => {
  const testSpec = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    post:
      operationId: createTest
      summary: Create test
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
  `;

  it('should generate files using plugin', async () => {
    const result = await build({
      config: {
        root: '.',
        input: {
          data: testSpec,
        },
        output: {
          path: './test/temp-gen',
        },
        plugins: [
          pluginOas(),
          pluginTs(),
          pluginZod(),
          pluginFastMCP({
            output: {
              path: './fastmcp',
            },
          }),
        ],
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.files).toBeTruthy();

    const fastmcpFiles = result.files.filter(f => f.path.includes('fastmcp'));
    expect(fastmcpFiles.length).toBeGreaterThan(0);

    // Check that server file was generated
    const serverFile = fastmcpFiles.find(f => f.baseName === 'server.ts');
    expect(serverFile).toBeTruthy();

    // Check that a handler file was generated (name may vary based on grouping)
    const handlerFiles = fastmcpFiles.filter(f => f.baseName.includes('Handler') || f.path.includes('createTest'));
    expect(handlerFiles.length).toBeGreaterThan(0);
  });

  it('should generate valid FastMCP code structure', async () => {
    const result = await build({
      config: {
        root: '.',
        input: {
          data: testSpec,
        },
        output: {
          path: './test/temp-gen',
        },
        plugins: [
          pluginOas(),
          pluginTs(),
          pluginZod(),
          pluginFastMCP({
            output: {
              path: './fastmcp',
            },
          }),
        ],
      },
    });

    const serverFile = result.files.find(f => f.baseName === 'server.ts' && f.path.includes('fastmcp'));
    expect(serverFile).toBeTruthy();

    const serverSource = serverFile?.sources?.[0]?.value;
    expect(serverSource).toContain('FastMCP');
    expect(serverSource).toContain('start');
  });
});
