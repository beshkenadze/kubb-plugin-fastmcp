# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun build` - Build the plugin using tsdown
- `bun start` - Build in watch mode for development
- `bun clean` - Clean the dist directory

### Code Quality
- `bun lint` - Run Biome linting
- `bun lint:fix` - Auto-fix lint issues with unsafe fixes
- `bun typecheck` - Run TypeScript type checking

### Testing
- `bun test` - Run Vitest tests
- Individual test: `bun test path/to/test.file.tsx`

### Publishing
- `bun release` - Publish to NPM
- `bun release:canary` - Publish canary version

## Architecture

This is a Kubb plugin (`@kubb/plugin-fastmcp`) that generates FastMCP servers and tool handlers from OpenAPI specifications. The plugin integrates with the Kubb ecosystem alongside other plugins for TypeScript types (`@kubb/plugin-ts`) and Zod schemas (`@kubb/plugin-zod`).

### Core Plugin Structure (`src/plugin.ts`)

The main plugin follows Kubb's plugin architecture:
- **Dependencies**: Requires `plugin-oas`, `plugin-ts`, and `plugin-zod` to run first
- **buildStart**: Loads tsconfig.json, detects import style, creates path matcher, then generates files using React components
- **Generators**: Two main generators - `fastmcpGenerator` for individual handlers and `serverGenerator` for server setup

### Import Style Detection System

The plugin automatically detects how to generate import statements based on your tsconfig.json:
- `needs-js-extension`: ESM with Node.js 16+ (module: "node16", moduleResolution: "node16") → appends `.js`
- `ts-extensions-allowed`: Bundler with TS extensions (allowImportingTsExtensions: true) → appends `.ts`
- `no-extension-ok`: Traditional bundler/CommonJS → no extensions
- `auto` (default): Automatically detects from tsconfig

### Path Resolution (`src/utils/pathResolver.ts`)

Handles TypeScript path alias resolution and import path generation:
- Uses `get-tsconfig` to load project tsconfig.json
- Creates `pathsMatcher` to resolve aliases like `@/*` to `./src/*`
- Appends appropriate file extensions based on detected import style
- Falls back to file existence checks when needed

### Code Generation Architecture

Uses React components to generate TypeScript code:

#### FastMCP Handler Generation (`src/generators/fastmcpGenerator.tsx`)
- Generates individual handler functions for each OpenAPI operation
- Imports types from plugin-ts output and FastMCP client
- Returns `FastMCPResult` with JSON-stringified response data
- Uses Kubb's `<Client>` component for HTTP client generation

#### Server Generation (`src/generators/serverGenerator.tsx`)
- Creates main server file that imports all handlers
- Generates FastMCPServer instance with tool definitions
- Maps OpenAPI operations to FastMCP tools with names/descriptions
- Also generates `.fastmcp.json` configuration for server discovery

#### Server Component (`src/components/Server.tsx`)
- React component that renders the FastMCP server setup code
- Takes operations array and generates tool definitions
- Outputs server instantiation and startup code

### Plugin Configuration Types (`src/types.ts`)

Key configuration options:
- `importStyle`: Controls import statement generation
- `output`: File output configuration with barrel exports
- `client`: FastMCP client configuration (baseURL, import paths)
- `group`: How to organize handlers (by tag, path, etc.)
- `exclude`/`include`: Filter operations to generate

### Testing Structure

Tests use Vitest with mocked `get-tsconfig`:
- Generator tests verify React component output matches snapshots
- Path resolution tests cover different tsconfig scenarios
- Uses Node.js environment for server-side code generation

## Development Patterns

### TypeScript Configuration
The project uses bundler mode with TS extensions allowed:
- `moduleResolution: "bundler"`
- `allowImportingTsExtensions: true`
- Path aliases: `@/*` maps to `./src/*`

### React-based Code Generation
All code generation uses React components with Kubb's `<File>` system:
- `<File.Import>` for import statements with path resolution
- `<File.Source>` for raw code output
- `<Client>` component from `@kubb/plugin-client` for HTTP client generation

### Dependency Integration
The plugin depends on other Kubb plugins running first:
- `@kubb/plugin-oas`: Parses OpenAPI spec, provides operation metadata
- `@kubb/plugin-ts`: Generates TypeScript types for request/response schemas
- `@kubb/plugin-zod`: Generates Zod validation schemas

When making changes, ensure compatibility with the Kubb plugin ecosystem and maintain the React-based generation approach.