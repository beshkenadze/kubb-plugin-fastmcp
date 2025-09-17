# Mock API Testing with MSW and Faker

This project now includes support for generating mock API services using Kubb's MSW (Mock Service Worker) and Faker plugins. This allows you to test your FastMCP servers against realistic mock APIs without needing a real backend.

## Overview

The setup includes:

- **@kubb/plugin-faker**: Generates realistic mock data functions using Faker.js
- **@kubb/plugin-msw**: Creates MSW request handlers that intercept HTTP calls
- **Mock data generation**: Consistent, seeded fake data for testing
- **Complete test environment**: Ready-to-use test setup with MSW server

## Generated Files

After running `bun run kubb`, you'll find:

```
test/generated/
├── mocks/
│   ├── data/          # Faker-generated data factories
│   │   ├── petMockData/
│   │   ├── storeMockData/
│   │   └── userMockData/
│   └── handlers/      # MSW request handlers
│       ├── handlers.ts    # All handlers exported
│       ├── petHandlers/
│       ├── storeHandlers/
│       └── userHandlers/
```

## Usage

### 1. Basic Mock Testing

```typescript
import { server } from './test/setup-msw.ts'
import { addPetHandler } from './test/generated/mocks/handlers/index.ts'

// Override handler for specific test data
server.use(
  addPetHandler({
    id: 123,
    name: 'Test Dog',
    status: 'available'
  })
)

// Your FastMCP tool makes HTTP request - MSW intercepts it
const response = await fetch('http://petstore.swagger.io/v2/pet', {
  method: 'POST',
  body: JSON.stringify({ name: 'Test Dog' })
})
```

### 2. Using Faker-Generated Data

```typescript
import { getPetByIdHandler } from './test/generated/mocks/handlers/index.ts'

// Use default faker-generated response (seeded for consistency)
server.use(getPetByIdHandler())

// Makes request - returns realistic fake pet data
const response = await fetch('http://petstore.swagger.io/v2/pet/123')
```

### 3. Testing FastMCP Server with Mocks

```typescript
const server = new FastMCPServer({ name: 'petstore-server' })

server.tool('addPet', 'Add a new pet', {
  name: { type: 'string' },
  status: { type: 'string' }
}, async ({ name, status }) => {
  // This HTTP call is intercepted by MSW
  const response = await fetch('http://petstore.swagger.io/v2/pet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, status })
  })

  return {
    content: [{
      type: 'text',
      text: `Pet added: ${JSON.stringify(await response.json())}`
    }]
  }
})
```

## Running Tests

```bash
# Run mock API tests
bun run test:mock

# Run all tests
bun run test:all

# Generate new mocks after OpenAPI changes
bun run kubb
```

## Configuration

The mock setup is configured in `kubb.config.ts`:

```typescript
pluginFaker({
  output: { path: "./mocks/data" },
  seed: [100],  // Consistent test data
}),
pluginMsw({
  output: { path: "./mocks/handlers" },
  parser: "faker",  // Use Faker for responses
  handlers: true,   // Generate handlers.ts
})
```

## Benefits

1. **No Backend Required**: Test FastMCP servers without real APIs
2. **Realistic Data**: Faker generates believable test data
3. **Consistent Results**: Seeded data ensures reproducible tests
4. **Type Safety**: Generated handlers are fully typed
5. **Fast Tests**: No network calls, instant responses
6. **Easy Debugging**: Predictable mock responses

## Integration with FastMCP Plugin

This mock testing setup works seamlessly with the generated FastMCP handlers:

1. Generate both FastMCP tools and mock handlers from same OpenAPI spec
2. Test FastMCP tools against mocked versions of the same APIs
3. Ensure your MCP server works correctly before deploying to production
4. Validate error handling and edge cases with controlled mock responses

The combination of FastMCP code generation and MSW mocking provides a complete development and testing workflow for API-driven MCP servers.