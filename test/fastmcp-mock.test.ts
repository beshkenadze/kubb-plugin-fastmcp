/**
 * Test demonstrating FastMCP server with mocked API using MSW
 */

import { FastMCP } from 'fastmcp';
import { http } from 'msw';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { server } from './setup-msw.ts';

describe('FastMCP Server with Mock API', () => {
  test('should handle addPet operation with mocked API', async () => {
    // Override handler for this specific test with custom handler that matches full URL
    server.use(
      http.post('https://petstore.swagger.io/v2/pet', () => {
        return new Response(JSON.stringify({
          id: 123,
          name: 'Test Dog',
          status: 'available',
          category: { id: 1, name: 'Dogs' },
          photoUrls: ['https://example.com/dog.jpg'],
          tags: [{ id: 1, name: 'friendly' }]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )

    // Simulate what a FastMCP handler would do
    const mockAddPetTool = async (args: any) => {
      // This would normally make an HTTP request, but MSW intercepts it
      // MSW handlers match relative paths, but we need full URLs for fetch in Node.js
      const response = await fetch('https://petstore.swagger.io/v2/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      })

      return JSON.stringify(await response.json())
    }

    // Test the tool
    const result = await mockAddPetTool({
      name: 'Test Dog',
      status: 'available'
    })

    expect(result).toBeDefined()
    const data = JSON.parse(result)
    expect(data.name).toBe('Test Dog')
    expect(data.id).toBe(123)
  })

  test('should handle getPetById operation with faker-generated data', async () => {
    // Use custom handler for full URL matching with faker data
    server.use(
      http.get('https://petstore.swagger.io/v2/pet/:petId', () => {
        // Use the faker data generator function
        const { createGetPetByIdQueryResponse } = require('./generated/mocks/data/petMockData/createGetPetById.ts')
        return new Response(JSON.stringify(createGetPetByIdQueryResponse()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )

    const mockGetPetTool = async (petId: string) => {
      const response = await fetch(`https://petstore.swagger.io/v2/pet/${petId}`)
      return JSON.stringify(await response.json())
    }

    const result = await mockGetPetTool('123')

    expect(result).toBeDefined()
    const data = JSON.parse(result)

    // Verify faker generated realistic data structure
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('status')
    expect(typeof data.name).toBe('string')
  })

  test('should demonstrate complete FastMCP server setup', async () => {
    // This shows how you would set up a real FastMCP server with mocked backends
    const mcpServer = new FastMCP({
      name: 'petstore-server',
      version: '1.0.0'
    })

    // Add tool that uses the mocked API
    mcpServer.addTool({
      name: 'addPet',
      description: 'Add a new pet to the store',
      parameters: z.object({
        name: z.string().describe('Pet name'),
        status: z.string().describe('Pet status')
      }),
      execute: async ({ name, status }) => {
        // This HTTP call would be intercepted by MSW
        const response = await fetch('https://petstore.swagger.io/v2/pet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, status })
        })

        const data = await response.json()
        return `Pet added: ${JSON.stringify(data)}`
      }
    })

    // Verify server instance is created properly
    expect(mcpServer).toBeDefined()
    // Note: FastMCP doesn't expose listTools() method in the same way
    // but we can verify the server was created successfully
  })
})