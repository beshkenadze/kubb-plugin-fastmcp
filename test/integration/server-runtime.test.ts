import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { $ } from 'bun'
import fs from 'node:fs'
import type { Subprocess } from 'bun'

describe('FastMCP Server Runtime', () => {
  let serverProcess: Subprocess | null = null
  const serverPort = 8081 // Use different port to avoid conflicts

  beforeAll(async () => {
    // Ensure generated files exist
    if (!fs.existsSync('test/generated/fastmcp/server.ts')) {
      await $`bun run generate:test`
    }

    // Modify the generated server to use a different port for testing
    const serverPath = 'test/generated/fastmcp/server.ts'
    let serverContent = fs.readFileSync(serverPath, 'utf-8')

    // Replace port 8080 with test port
    serverContent = serverContent.replace(
      'httpStream: { port: 8080 }',
      `httpStream: { port: ${serverPort} }`
    )

    fs.writeFileSync(serverPath, serverContent)

    // Start the generated server
    try {
      serverProcess = Bun.spawn(['bun', 'run', serverPath], {
        stdout: 'pipe',
        stderr: 'pipe',
      })

      // Wait for server to start
      await Bun.sleep(2000)
    } catch (error) {
      console.error('Failed to start server:', error)
      throw error
    }
  })

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill()
      // Wait a bit for cleanup
      await Bun.sleep(500)
    }
  })

  it('should start server process without immediate exit', () => {
    expect(serverProcess).toBeTruthy()
    expect(serverProcess?.exitCode).toBeNull() // Should still be running
  })

  it('should be able to connect to server port', async () => {
    try {
      const response = await fetch(`http://localhost:${serverPort}/health`)
      // Even if health endpoint doesn't exist, connection should succeed
      // We're just testing that the server is listening
      expect(response).toBeDefined()
    } catch (error) {
      // If health endpoint doesn't exist, try a basic connection test
      const connectionTest = await fetch(`http://localhost:${serverPort}/`, {
        method: 'OPTIONS'
      }).catch(() => null)

      // The server should at least be listening, even if it returns an error
      expect(connectionTest).toBeTruthy()
    }
  })

  it('should handle server startup without crashing', async () => {
    // Wait a bit more and check if process is still alive
    await Bun.sleep(1000)
    expect(serverProcess?.exitCode).toBeNull()
  })

  it('should generate a runnable server file', () => {
    const serverPath = 'test/generated/fastmcp/server.ts'
    const content = fs.readFileSync(serverPath, 'utf-8')

    // Check that the server file contains the required FastMCP structure
    expect(content).toContain('new FastMCP')
    expect(content).toContain('start({')
    expect(content).toContain('transportType: "httpStream"')
  })

  it('should not have syntax errors in generated code', async () => {
    const serverPath = 'test/generated/fastmcp/server.ts'

    // Try to parse the file to check for syntax errors
    const result = await $`bun run --print ${serverPath}`.quiet()

    // If there are syntax errors, exit code will be non-zero
    expect(result.exitCode).toBe(0)
  })
})