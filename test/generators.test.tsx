import { build } from '@kubb/core';
import { createPathsMatcher, getTsconfig } from 'get-tsconfig';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';
import type { ResolvedOptions } from '../src/types';
import { resolveImportPath } from '../src/utils/pathResolver';
import { pluginFastMCP } from '../src';

vi.mock('get-tsconfig');

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

    // Check that handler file was generated
    const handlerFile = fastmcpFiles.find(f => f.path.includes('createTestHandler'));
    expect(handlerFile).toBeTruthy();
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
    expect(serverSource).toContain('new FastMCP');
    expect(serverSource).toContain('addTool');
    expect(serverSource).toContain('start');
    expect(serverSource).toContain('httpStream');
  });
});

describe('Path Resolution Utility', () => {
  const mockBaseDir = '/project';
  const mockOptions: ResolvedOptions = {
    output: { path: 'fastmcp' },
    group: undefined,
    client: { importPath: './client', dataReturnType: 'data' },
    importStyle: 'auto',
    tsconfig: null,
    pathsMatcher: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves relative path with .ts extension for ts-extensions-allowed', () => {
    const mockTsconfig = {
      path: '/project/tsconfig.json',
      config: {
        compilerOptions: {
          moduleResolution: 'bundler' as const,
          allowImportingTsExtensions: true,
        },
      },
    } as any;
    vi.mocked(getTsconfig).mockReturnValue(mockTsconfig);
    mockOptions.tsconfig = mockTsconfig;
    mockOptions.pathsMatcher = createPathsMatcher(mockTsconfig);

    const result = resolveImportPath('./utils', mockOptions, mockBaseDir);
    expect(result).toBe('/project/utils.ts');
  });

  it('resolves alias path with .js extension for needs-js-extension', () => {
    const mockTsconfig = {
      path: '/project/tsconfig.json',
      config: {
        compilerOptions: {
          moduleResolution: 'node16' as const,
          module: 'node16' as const,
        },
      },
    } as any;
    vi.mocked(getTsconfig).mockReturnValue(mockTsconfig);
    mockOptions.tsconfig = mockTsconfig;
    const mockMatcher = vi.fn().mockReturnValue(['/project/src/utils']);
    mockOptions.pathsMatcher = mockMatcher as any;

    const result = resolveImportPath('@utils', mockOptions, mockBaseDir);
    expect(result).toBe('/project/src/utils.js');
    expect(mockMatcher).toHaveBeenCalledWith('@utils');
  });

  it('resolves relative path without extension for no-extension-ok', () => {
    const mockTsconfig = {
      path: '/project/tsconfig.json',
      config: {
        compilerOptions: {
          moduleResolution: 'bundler' as const,
          allowImportingTsExtensions: false,
        },
      },
    } as any;
    vi.mocked(getTsconfig).mockReturnValue(mockTsconfig);
    mockOptions.tsconfig = mockTsconfig;
    mockOptions.pathsMatcher = null;

    const result = resolveImportPath('./utils', mockOptions, mockBaseDir);
    expect(result).toBe('/project/./utils');
  });

  it('resolves with .tsx for React JSX files', () => {
    const mockTsconfig = {
      path: '/project/tsconfig.json',
      config: {
        compilerOptions: {
          jsx: 'react-jsx' as const,
          moduleResolution: 'bundler' as const,
          allowImportingTsExtensions: true,
        },
      },
    } as any;
    vi.mocked(getTsconfig).mockReturnValue(mockTsconfig);
    mockOptions.tsconfig = mockTsconfig;
    mockOptions.pathsMatcher = null;

    const result = resolveImportPath('./Componentx', mockOptions, mockBaseDir);
    expect(result).toBe('/project/./Componentx.tsx');
  });

  it('falls back to file existence check for extension detection', async () => {
    const fsModule = await import('node:fs');
    const mockFs = vi.spyOn(fsModule, 'existsSync').mockImplementation((p: string | Buffer) => (typeof p === 'string' && p.endsWith('.ts')));
    mockOptions.importStyle = 'no-extension-ok';
    mockOptions.tsconfig = null;
    mockOptions.pathsMatcher = null;

    const result = resolveImportPath('./utils', mockOptions, mockBaseDir);
    expect(result).toBe('/project/./utils.ts');
    mockFs.mockRestore();
  });
});
