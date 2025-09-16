# Testing FastMCP Server

## Quick Start

1. **Generate your FastMCP server**
   ```bash
   bun x kubb generate
   ```

2. **Test with MCP Inspector**
   ```bash
   # Using Bun (recommended)
   bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/list

   # Using Node.js
   npx @modelcontextprotocol/inspector --cli npx tsx ./test/generated/fastmcp/server.ts --transport stdio --method tools/list
   ```

## Testing with Bun (Recommended)

### List All Available Tools
```bash
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/list
```

### Test Simple Tools (No Parameters)
```bash
# Get store inventory
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name getInventory

# Logout user
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name logoutUser
```

### Test Tools with Parameters
```bash
# Get pet by ID
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name getPetById --tool-arg 'petId=1'

# Get user by name
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name getUserByName --tool-arg 'username=user1'

# Login user
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name loginUser --tool-arg 'username=testuser' --tool-arg 'password=testpass'
```

### Test Array Parameters
```bash
# Find pets by status
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name findPetsByStatus --tool-arg 'status=["available", "pending"]'

# Create multiple users (array wrapped in object)
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name createUsersWithArrayInput --tool-arg 'data=[{"username": "user1", "email": "user1@example.com"}, {"username": "user2", "email": "user2@example.com"}]'
```

## Testing with Node.js

### List All Available Tools
```bash
npx @modelcontextprotocol/inspector --cli npx tsx ./test/generated/fastmcp/server.ts --transport stdio --method tools/list
```

### Test Simple Tools
```bash
# Get store inventory
npx @modelcontextprotocol/inspector --cli npx tsx ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name getInventory

# Get pet by ID
npx @modelcontextprotocol/inspector --cli npx tsx ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name getPetById --tool-arg 'petId=1'
```

## Using Configuration File

Create `mcp.json` in your project root:

```json
{
  "mcpServers": {
    "petstore-bun": {
      "type": "stdio",
      "command": "bun",
      "args": ["./test/generated/fastmcp/server.ts", "--transport", "stdio"]
    },
    "petstore-node": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "./test/generated/fastmcp/server.ts", "--transport", "stdio"]
    }
  }
}
```

Then test with:
```bash
# Using Bun config
bunx @modelcontextprotocol/inspector --cli --config mcp.json --server petstore-bun --method tools/list

# Using Node.js config
npx @modelcontextprotocol/inspector --cli --config mcp.json --server petstore-node --method tools/list
```

## Runtime Configuration

Configure your FastMCP plugin in `kubb.config.ts`:

```typescript
pluginFastMCP({
  runtime: "bun", // or "node"
  // ... other options
})
```

- **`runtime: "bun"`** - Uses `bun` command directly (faster)
- **`runtime: "node"`** - Uses `npx tsx` command (compatible)

## Common Test Cases

### No Parameters
```bash
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name getInventory
```

### Simple Parameters
```bash
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name getPetById --tool-arg 'petId=1'
```

### Multiple Parameters
```bash
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name loginUser --tool-arg 'username=test' --tool-arg 'password=pass'
```

### Array Parameters
```bash
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name findPetsByStatus --tool-arg 'status=["available"]'
```

### Object with Arrays (Fixed Schema)
```bash
bunx @modelcontextprotocol/inspector --cli bun ./test/generated/fastmcp/server.ts --transport stdio --method tools/call --tool-name createUsersWithArrayInput --tool-arg 'data=[{"username": "test", "email": "test@example.com"}]'
```

## Troubleshooting

### Schema Validation Errors
If you see `MCP error -32602: Tool parameter validation failed`, check:
1. Required fields are provided
2. Array parameters are properly formatted as JSON arrays
3. Enum values match the schema exactly

### Array Schema Issues
Array request bodies are automatically wrapped in objects with a `data` property:
- ✅ `--tool-arg 'data=[...]'` (correct)
- ❌ `--tool-arg 'arrayParam=[...]'` (wrong)

### Connection Issues
- Ensure the server path is correct: `./test/generated/fastmcp/server.ts`
- Check that the generated server exists
- Verify Bun/Node.js is installed and accessible

### Command Not Found
- For Bun: Install with `npm install -g bun`
- For Node.js: Ensure tsx is available with `npm install -g tsx`
- MCP Inspector: Runs via `bunx` or `npx` automatically