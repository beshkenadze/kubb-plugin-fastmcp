/**
 * MSW server setup for testing FastMCP server with mocked APIs
 * This creates handlers that match full URLs used by the FastMCP handlers
 */

import { http } from 'msw'
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll } from 'vitest'

// Import the mock data generators
import { createAddPetMutationResponse } from './generated/mocks/data/petMockData/createAddPet.ts'
import { createUpdatePetMutationResponse } from './generated/mocks/data/petMockData/createUpdatePet.ts'
import { createFindPetsByStatusQueryResponse } from './generated/mocks/data/petMockData/createFindPetsByStatus.ts'
import { createGetPetByIdQueryResponse } from './generated/mocks/data/petMockData/createGetPetById.ts'
import { createGetInventoryQueryResponse } from './generated/mocks/data/storeMockData/createGetInventory.ts'
import { createPlaceOrderMutationResponse } from './generated/mocks/data/storeMockData/createPlaceOrder.ts'
import { createGetOrderByIdQueryResponse } from './generated/mocks/data/storeMockData/createGetOrderById.ts'
import { createCreateUserMutationResponse } from './generated/mocks/data/userMockData/createCreateUser.ts'
import { createLoginUserQueryResponse } from './generated/mocks/data/userMockData/createLoginUser.ts'
import { createGetUserByNameQueryResponse } from './generated/mocks/data/userMockData/createGetUserByName.ts'

const BASE_URL = 'https://petstore.swagger.io/v2'

// Create handlers that match the full URLs used by FastMCP handlers
export const serverHandlers = [
  // Pet handlers
  http.post(`${BASE_URL}/pet`, () => {
    return new Response(JSON.stringify(createAddPetMutationResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.put(`${BASE_URL}/pet`, () => {
    return new Response(JSON.stringify(createUpdatePetMutationResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get(`${BASE_URL}/pet/findByStatus`, () => {
    return new Response(JSON.stringify(createFindPetsByStatusQueryResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get(`${BASE_URL}/pet/findByTags`, () => {
    return new Response(JSON.stringify(createFindPetsByStatusQueryResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get(`${BASE_URL}/pet/:petId`, () => {
    return new Response(JSON.stringify(createGetPetByIdQueryResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post(`${BASE_URL}/pet/:petId`, () => {
    return new Response(JSON.stringify(createUpdatePetMutationResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.delete(`${BASE_URL}/pet/:petId`, () => {
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post(`${BASE_URL}/pet/:petId/uploadImage`, () => {
    return new Response(JSON.stringify({ message: 'File uploaded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  // Store handlers
  http.get(`${BASE_URL}/store/inventory`, () => {
    return new Response(JSON.stringify(createGetInventoryQueryResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post(`${BASE_URL}/store/order`, () => {
    return new Response(JSON.stringify(createPlaceOrderMutationResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get(`${BASE_URL}/store/order/:orderId`, () => {
    return new Response(JSON.stringify(createGetOrderByIdQueryResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.delete(`${BASE_URL}/store/order/:orderId`, () => {
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  // User handlers
  http.post(`${BASE_URL}/user`, () => {
    return new Response(JSON.stringify(createCreateUserMutationResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post(`${BASE_URL}/user/createWithArray`, () => {
    return new Response(JSON.stringify(createCreateUserMutationResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.post(`${BASE_URL}/user/createWithList`, () => {
    return new Response(JSON.stringify(createCreateUserMutationResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get(`${BASE_URL}/user/login`, () => {
    return new Response(JSON.stringify(createLoginUserQueryResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get(`${BASE_URL}/user/logout`, () => {
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get(`${BASE_URL}/user/:username`, () => {
    return new Response(JSON.stringify(createGetUserByNameQueryResponse()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.put(`${BASE_URL}/user/:username`, () => {
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.delete(`${BASE_URL}/user/:username`, () => {
    return new Response('', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  })
]

// This configures a request mocking server with the full URL handlers
export const mcpServer = setupServer(...serverHandlers)

// Test lifecycle hooks for server integration tests
export function setupMSWForServerTests() {
  beforeAll(() => {
    mcpServer.listen({
      onUnhandledRequest: 'warn'
    })
  })

  afterEach(() => {
    mcpServer.resetHandlers()
  })

  afterAll(() => {
    mcpServer.close()
  })
}