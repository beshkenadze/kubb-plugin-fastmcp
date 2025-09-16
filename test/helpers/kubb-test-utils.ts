import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFastMCP } from '../../src'
import type { PluginFastMCP } from '../../src/types'

/**
 * Generate test code using the FastMCP plugin with a given OpenAPI spec
 */
export async function generateTestCode(inputPath: string, outputPath = './test/generated') {
  return await build({
    config: {
      root: '.',
      input: { path: inputPath },
      output: { path: outputPath },
      plugins: [
        pluginOas(),
        pluginTs(),
        pluginZod(),
        pluginFastMCP({
          output: {
            path: './fastmcp',
            barrelType: 'named'
          },
          client: {
            baseURL: 'https://api.example.com',
          },
        }),
      ]
    }
  })
}

/**
 * Generate test code from inline OpenAPI YAML string
 */
export async function generateTestCodeFromSpec(yamlSpec: string, outputPath = './test/generated') {
  return await build({
    config: {
      root: '.',
      input: { data: yamlSpec },
      output: { path: outputPath },
      plugins: [
        pluginOas(),
        pluginTs(),
        pluginZod(),
        pluginFastMCP({
          output: {
            path: './fastmcp',
            barrelType: 'named'
          },
        }),
      ]
    }
  })
}

/**
 * Simple OpenAPI spec for testing
 */
export const simpleTestSpec = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /pets:
    get:
      operationId: listPets
      summary: List all pets
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
    post:
      operationId: createPet
      summary: Create a pet
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewPet'
      responses:
        '201':
          description: Pet created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
  /pets/{id}:
    get:
      operationId: getPetById
      summary: Get a pet by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: A pet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
        name:
          type: string
        tag:
          type: string
    NewPet:
      type: object
      required:
        - name
      properties:
        name:
          type: string
        tag:
          type: string
`

/**
 * Configuration for FastMCP plugin testing
 */
export const testPluginConfig: PluginFastMCP['options'] = {
  output: {
    path: './fastmcp',
    barrelType: 'named',
  },
  client: {
    baseURL: 'https://api.test.com',
    importPath: '@kubb/plugin-client/clients/axios',
    dataReturnType: 'data',
  },
  importStyle: 'auto',
}

/**
 * Wait for a given amount of time (useful for server startup)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/`)
    return false // If we got a response, port is in use
  } catch {
    return true // If fetch failed, port is available
  }
}

/**
 * Find an available port starting from the given port
 */
export async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort
  while (!(await isPortAvailable(port)) && port < startPort + 100) {
    port++
  }
  return port
}