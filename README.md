# @kubb/plugin-fastmcp

Swagger/OpenAPI integration to create FastMCP servers and tools.

[![npm version](https://img.shields.io/npm/v/@kubb/plugin-fastmcp?flat&colorA=18181B&colorB=f58517)](https://npmjs.com/package/@kubb/plugin-fastmcp)
[![npm downloads](https://img.shields.io/npm/dm/@kubb/plugin-fastmcp?flat&colorA=18181B&colorB=f58517)](https://npmjs.com/package/@kubb/plugin-fastmcp)
[![License](https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517)](https://github.com/kubb-labs/kubb/blob/main/LICENSE)

## Features

- Generate FastMCP tool handlers from OpenAPI operations
- Create FastMCP server setup with automatic tool registration
- Group handlers by OpenAPI tags
- TypeScript and Zod schema integration
- Customizable output paths and client configuration

## Installation

```bash
bun add -D @kubb/plugin-fastmcp
```

## Quick Start

### 1. Configure Kubb

Create `kubb.config.ts`:

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFastMCP } from '@kubb/plugin-fastmcp'

export default defineConfig({
  input: {
    path: './petstore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginZod(),
    pluginFastMCP({
      output: {
        path: './fastmcp',
        barrelType: 'named',
      },
      client: {
        baseURL: 'https://petstore.swagger.io/v2',
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Handlers`,
      },
    }),
  ],
})
```

### 2. Generate Code

```bash
kubb generate
```

This will generate:
- TypeScript types and Zod schemas
- FastMCP handler functions for each API operation
- FastMCP server setup with all tools registered
- Grouped handler files by OpenAPI tags

### 3. Generated Output

The plugin generates:

**src/gen/fastmcp/server.ts**
```typescript
export const server: FastMCPServer = new FastMCPServer({
  name: "OpenAPI Petstore",
  version: "3.0.0",
  tools: [
    { name: "addPet", description: "Add a new pet to the store", handler: addPetHandler },
    { name: "getPetById", description: "Find pet by ID", handler: getPetByIdHandler },
    // ... more operations
  ],
})

server.start({ transportType: "httpStream", httpStream: { port: 8080 } })
```

**src/gen/fastmcp/petHandlers/addPet.ts**
```typescript
import { CallToolResult } from 'fastmcp/types'
import fetch from 'fastmcp/client'

export const addPetHandler = async (params: AddPetRequest): Promise<CallToolResult> => {
  const res = await fetch<AddPet200Response>('/pet', {
    method: 'POST',
    params,
    // ... generated client code
  })
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data)
      }
    ]
  }
}
```

## Configuration Options

### Basic Configuration

```typescript
pluginFastMCP({
  output: {
    path: './fastmcp', // Output directory
    barrelType: 'named', // 'named', 'all', or false
  },
})
```

### Advanced Configuration

```typescript
pluginFastMCP({
  output: {
    path: './fastmcp',
    barrelType: 'named',
    banner: '/* Generated FastMCP Server */',
  },
  client: {
    baseURL: 'https://api.example.com',
    dataReturnType: 'data', // 'data' or 'full'
    importPath: 'fastmcp/client',
  },
  group: {
    type: 'tag',
    name: ({ group }) => `${group}Service`,
  },
  exclude: [
    { type: 'tag', pattern: 'internal' },
  ],
  include: [
    { type: 'operationId', pattern: 'public*' },
  ],
  transformers: {
    name: (name, type) => `${name}FastMCP`,
  },
})
```

### Grouping Options

- **By Tag** (default): Groups handlers by OpenAPI tags
- **By Path**: Groups by path segments
- **Custom**: Use custom grouping logic

```typescript
group: {
  type: 'tag',
  output: './handlers/{{tag}}', // For file grouping
  name: ({ group }) => `${group}API`, // For service names
}
```

## Demo

### 1. Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/your-org/kubb-plugin-fastmcp
cd kubb-plugin-fastmcp
bun install
```

### 2. Download Petstore API

```bash
curl -o petstore.yaml https://raw.githubusercontent.com/openapitools/openapi-generator/master/modules/openapi-generator/src/test/resources/3_0/petstore.yaml
```

### 3. Generate FastMCP Server

```bash
kubb generate --config kubb.config.ts
```

### 4. Run the Server

The generated `src/gen/fastmcp/server.ts` can be run directly:

```bash
cd src/gen/fastmcp
npx tsx server.ts
```

This starts a FastMCP server on port 8080 with tools for all Petstore API operations.

## Integration with FastMCP Clients

The generated handlers use the FastMCP client pattern:

```typescript
import { FastMCPClient } from 'fastmcp/client'
import { server } from './server'

const client = new FastMCPClient({
  server: server,
  tools: ['addPet', 'getPetById', 'placeOrder']
})

const result = await client.callTool('addPet', {
  // pet data
})
```

## Troubleshooting

### Module Resolution Errors

Ensure all Kubb packages are compatible versions:

```bash
bun add -D @kubb/core@3.18.3 @kubb/plugin-oas@3.18.3 @kubb/plugin-ts@3.18.3 @kubb/plugin-zod@3.18.3
```

### Testing with Path Mappings

For advanced testing with tsconfig path mappings, add `jonaskello/tsconfig-paths`:

```bash
bun add -D jonaskello/tsconfig-paths
```

Update `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    extension: ['.ts', '.tsx'],
  },
})
```

This enables automatic .js/.ts extension resolution based on your tsconfig.json settings.

### Generation Errors

- Check OpenAPI spec validity with `kubb validate`
- Ensure all required plugins are included (OAS, TS, Zod)
- Verify output paths exist and are writable

### Custom FastMCP SDK

If using a custom FastMCP implementation, update the import paths:

```typescript
pluginFastMCP({
  client: {
    importPath: 'your-fastmcp/client',
  },
})
```

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT
