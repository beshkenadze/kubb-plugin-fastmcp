import { describe, it, expect, beforeAll } from 'bun:test'
import { $ } from 'bun'
import fs from 'node:fs'
import path from 'node:path'

describe('FastMCP Generation', () => {
  beforeAll(async () => {
    // Clean any existing generated files
    await $`rm -rf test/generated`

    // Run generation using test config
    const result = await $`bun x kubb generate --config kubb.config.test.ts`

    if (result.exitCode !== 0) {
      console.error('Generation failed:', result.stderr.toString())
      throw new Error(`Generation failed with exit code ${result.exitCode}`)
    }
  })

  it('should generate FastMCP output directory', () => {
    const fastmcpDir = 'test/generated/fastmcp'
    expect(fs.existsSync(fastmcpDir)).toBe(true)
    expect(fs.statSync(fastmcpDir).isDirectory()).toBe(true)
  })

  it('should generate pet handler files', () => {
    const petHandlersDir = 'test/generated/fastmcp/petHandlers'
    expect(fs.existsSync(petHandlersDir)).toBe(true)

    // Check for expected handler files based on petstore.yaml operations
    const expectedHandlers = [
      'addPet.ts',
      'deletePet.ts',
      'findPetsByStatus.ts',
      'findPetsByTags.ts',
      'getPetById.ts',
      'updatePet.ts',
      'updatePetWithForm.ts',
      'uploadFile.ts'
    ]

    expectedHandlers.forEach(handler => {
      const handlerPath = path.join(petHandlersDir, handler)
      expect(fs.existsSync(handlerPath)).toBe(true)
    })
  })

  it('should generate store handler files', () => {
    const storeHandlersDir = 'test/generated/fastmcp/storeHandlers'
    expect(fs.existsSync(storeHandlersDir)).toBe(true)

    const expectedHandlers = [
      'deleteOrder.ts',
      'getInventory.ts',
      'getOrderById.ts',
      'placeOrder.ts'
    ]

    expectedHandlers.forEach(handler => {
      const handlerPath = path.join(storeHandlersDir, handler)
      expect(fs.existsSync(handlerPath)).toBe(true)
    })
  })

  it('should generate user handler files', () => {
    const userHandlersDir = 'test/generated/fastmcp/userHandlers'
    expect(fs.existsSync(userHandlersDir)).toBe(true)

    const expectedHandlers = [
      'createUser.ts',
      'createUsersWithArrayInput.ts',
      'createUsersWithListInput.ts',
      'deleteUser.ts',
      'getUserByName.ts',
      'loginUser.ts',
      'logoutUser.ts',
      'updateUser.ts'
    ]

    expectedHandlers.forEach(handler => {
      const handlerPath = path.join(userHandlersDir, handler)
      expect(fs.existsSync(handlerPath)).toBe(true)
    })
  })

  it('should generate server.ts file', () => {
    const serverPath = 'test/generated/fastmcp/server.ts'
    expect(fs.existsSync(serverPath)).toBe(true)

    const serverContent = fs.readFileSync(serverPath, 'utf-8')
    expect(serverContent).toContain('new FastMCP')
    expect(serverContent).toContain('addTool')
    expect(serverContent).toContain('start')
  })

  it('should generate .fastmcp.json config file', () => {
    const configPath = 'test/generated/fastmcp/.fastmcp.json'
    expect(fs.existsSync(configPath)).toBe(true)

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(config).toHaveProperty('fastmcpServers')
    expect(config.fastmcpServers).toHaveProperty('Swagger Petstore')
  })

  it('should generate barrel export files', () => {
    const indexPath = 'test/generated/fastmcp/index.ts'
    expect(fs.existsSync(indexPath)).toBe(true)

    const indexContent = fs.readFileSync(indexPath, 'utf-8')
    expect(indexContent).toContain('export')
  })

  it('should generate TypeScript files', () => {
    const typesDir = 'test/generated/types'
    expect(fs.existsSync(typesDir)).toBe(true)
  })

  it('should generate Zod schema files', () => {
    const zodDir = 'test/generated/zod'
    expect(fs.existsSync(zodDir)).toBe(true)
  })

  it('should contain valid FastMCP imports in handlers', () => {
    const handlerPath = 'test/generated/fastmcp/petHandlers/addPet.ts'
    const content = fs.readFileSync(handlerPath, 'utf-8')

    expect(content).toContain('import type { ContentResult } from \'fastmcp\'')
    expect(content).toContain('Promise<ContentResult>')
    expect(content).toContain('return {')
    expect(content).toContain('content: [')
    expect(content).toContain('type: \'text\'')
  })
})