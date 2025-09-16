import { describe, it, expect, beforeAll } from 'bun:test'
import { $ } from 'bun'
import fs from 'node:fs'

describe('Generated FastMCP Code Validation', () => {
  beforeAll(async () => {
    // Ensure generated files exist
    if (!fs.existsSync('test/generated/fastmcp/server.ts')) {
      await $`bun run generate:test`
    }
  })

  it('should compile generated TypeScript without errors', async () => {
    const result = await $`bun run tsc test/generated/fastmcp/server.ts --noEmit --skipLibCheck`.quiet()
    expect(result.exitCode).toBe(0)
  })

  it('should compile individual handler files', async () => {
    const handlerFiles = [
      'test/generated/fastmcp/petHandlers/addPet.ts',
      'test/generated/fastmcp/storeHandlers/getInventory.ts',
      'test/generated/fastmcp/userHandlers/createUser.ts'
    ]

    for (const file of handlerFiles) {
      if (fs.existsSync(file)) {
        const result = await $`bun run tsc ${file} --noEmit --skipLibCheck`.quiet()
        expect(result.exitCode).toBe(0)
      }
    }
  })

  it('should generate valid FastMCP server structure', () => {
    const serverPath = 'test/generated/fastmcp/server.ts'
    const serverContent = fs.readFileSync(serverPath, 'utf-8')

    // Check server instantiation
    expect(serverContent).toContain('new FastMCP({')
    expect(serverContent).toContain('name: "Swagger Petstore"')
    expect(serverContent).toContain('version: "1.0.6"')

    // Check tool registration
    expect(serverContent).toContain('.addTool({')
    expect(serverContent).toContain('name: ')
    expect(serverContent).toContain('description: ')
    expect(serverContent).toContain('execute: ')

    // Check server startup
    expect(serverContent).toContain('.start({')
    expect(serverContent).toContain('transportType: "httpStream"')
    expect(serverContent).toContain('httpStream: { port: 8080 }')
  })

  it('should import FastMCP correctly in server file', () => {
    const serverPath = 'test/generated/fastmcp/server.ts'
    const serverContent = fs.readFileSync(serverPath, 'utf-8')

    expect(serverContent).toContain('import { FastMCP } from \'fastmcp\'')
  })

  it('should import handlers correctly in server file', () => {
    const serverPath = 'test/generated/fastmcp/server.ts'
    const serverContent = fs.readFileSync(serverPath, 'utf-8')

    // Check handler imports
    expect(serverContent).toMatch(/import.*Handler.*from/g)
  })

  it('should generate valid handler function signatures', () => {
    const handlerPath = 'test/generated/fastmcp/petHandlers/addPet.ts'
    const content = fs.readFileSync(handlerPath, 'utf-8')

    // Check function signature
    expect(content).toMatch(/export\s+async\s+function\s+\w+Handler/)
    expect(content).toMatch(/Promise<ContentResult>/)
    expect(content).toContain('return {')
    expect(content).toContain('content: [')
  })

  it('should generate proper Zod schema imports', () => {
    const handlerPath = 'test/generated/fastmcp/petHandlers/addPet.ts'
    const content = fs.readFileSync(handlerPath, 'utf-8')

    // Check for Zod schema imports
    expect(content).toMatch(/import.*from.*zod/)
  })

  it('should generate proper TypeScript type imports', () => {
    const handlerPath = 'test/generated/fastmcp/petHandlers/addPet.ts'
    const content = fs.readFileSync(handlerPath, 'utf-8')

    // Check for type imports
    expect(content).toMatch(/import.*from.*types/)
  })

  it('should have valid JSON config file', () => {
    const configPath = 'test/generated/fastmcp/.fastmcp.json'
    const configContent = fs.readFileSync(configPath, 'utf-8')

    // Should be valid JSON
    const config = JSON.parse(configContent)

    expect(config).toHaveProperty('fastmcpServers')
    expect(config.fastmcpServers).toHaveProperty('Swagger Petstore')
    expect(config.fastmcpServers['Swagger Petstore']).toHaveProperty('type', 'httpStream')
    expect(config.fastmcpServers['Swagger Petstore']).toHaveProperty('command', 'npx')
    expect(config.fastmcpServers['Swagger Petstore']).toHaveProperty('args')
  })

  it('should generate handlers with proper parameter handling', () => {
    // Check a handler that has parameters
    const handlerPath = 'test/generated/fastmcp/petHandlers/getPetById.ts'
    const content = fs.readFileSync(handlerPath, 'utf-8')

    // Should have parameter destructuring
    expect(content).toMatch(/\{\s*[^}]*\s*\}/)
  })

  it('should generate barrel exports', () => {
    const indexPath = 'test/generated/fastmcp/index.ts'
    const content = fs.readFileSync(indexPath, 'utf-8')

    expect(content).toContain('export')
    expect(content).toMatch(/export.*from/g)
  })
})