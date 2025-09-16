import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedOptions } from '../types';

export function resolveImportPath(
  importPath: string,
  options: ResolvedOptions,
  baseDir: string = process.cwd()
): string {
  const { pathsMatcher, importStyle, tsconfig } = options;

  // Special handling for fastmcp package
  if (importPath === 'fastmcp') {
    return 'fastmcp' // No extension for npm packages
  }

  // Step 1: Resolve aliases using pathsMatcher if available
  let resolvedPath = importPath;
  if (pathsMatcher && tsconfig) {
    const tryPaths = pathsMatcher(importPath);
    if (tryPaths && tryPaths.length > 0) {
      // Take the first matching path and resolve it relative to baseDir
      const relativePath = tryPaths[0];
      if (relativePath) {
        resolvedPath = path.resolve(baseDir, relativePath);
      }
    }
  }

  // Step 2: Determine if it's a relative or absolute path
  const isRelative = resolvedPath.startsWith('.') || resolvedPath.startsWith('/');

  // Step 3: Append extension based on importStyle (only if file doesn't already have an extension)
  let extension = '';
  const hasExtension = path.extname(resolvedPath) !== '';

  if (isRelative && !hasExtension) {
    switch (importStyle) {
      case 'needs-js-extension':
        extension = '.js';
        break;
      case 'ts-extensions-allowed':
        extension = '.ts';
        break;
      case 'no-extension-ok':
      case 'auto':
        // For 'auto', it was already resolved to one of the above
        // But since it's relative and no alias, use no extension or default to .ts for TS projects
        if (tsconfig?.compilerOptions?.jsx === 'react-jsx') {
          extension = resolvedPath.endsWith('x') ? '.tsx' : '.ts';
        } else {
          extension = '.ts';
        }
        break;
      default:
        extension = '';
    }
  }

  // If no extension and it's a file path, check if it needs one based on file existence (optional)
  if (!extension && isRelative) {
    const fullPath = path.resolve(baseDir, resolvedPath);
    const tsPath = fullPath + '.ts';
    const jsPath = fullPath + '.js';
    const tsxPath = fullPath + '.tsx';
    if (fs.existsSync(tsPath)) {
      extension = '.ts';
    } else if (fs.existsSync(jsPath)) {
      extension = '.js';
    } else if (fs.existsSync(tsxPath)) {
      extension = '.tsx';
    }
  }

  return resolvedPath + extension;
}

// Helper to get baseDir from current file context (for use in generators)
export function getBaseDirFromContext(filePath: string): string {
  return path.dirname(filePath);
}