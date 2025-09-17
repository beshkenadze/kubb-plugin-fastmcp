/**
 * Mock client for testing FastMCP servers
 * This client always returns mock data when imported
 */

import axios from 'axios'

export interface RequestConfig<TData = unknown> {
  baseURL?: string;
  url?: string;
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
  params?: unknown;
  data?: TData | FormData;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  headers?: Record<string, string>;
}

export interface ResponseConfig<TData = unknown> {
  data: TData;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export type ResponseErrorConfig<TError = unknown> = {
  response?: {
    data: TError;
    status: number;
    statusText: string;
  };
  message: string;
}

// Create axios instance for real requests
const axiosInstance = axios.create()

// Mock data generators (simple examples)
const createMockPet = () => ({
  id: Math.floor(Math.random() * 1000),
  name: 'MockPet',
  status: 'available',
  category: { id: 1, name: 'MockCategory' },
  photoUrls: ['https://example.com/mock-photo.jpg'],
  tags: [{ id: 1, name: 'mock' }]
})

const createMockInventory = () => ({
  available: 100,
  pending: 10,
  sold: 5
})

const createMockUser = () => ({
  id: Math.floor(Math.random() * 1000),
  username: 'mockuser',
  firstName: 'Mock',
  lastName: 'User',
  email: 'mock@example.com',
  phone: '123-456-7890',
  userStatus: 1
})

const createMockOrder = () => ({
  id: Math.floor(Math.random() * 1000),
  petId: 1,
  quantity: 1,
  shipDate: new Date().toISOString(),
  status: 'placed',
  complete: false
})

// Direct mock responses - always active when this client is imported
function getMockResponse<TData>(config: RequestConfig): ResponseConfig<TData> | null {

  const { method = 'GET', url = '', baseURL = '' } = config
  const fullUrl = baseURL ? `${baseURL}${url}` : url

  console.log(`[Mock Client] ${method} ${fullUrl}`)

  // Pet endpoints
  if (fullUrl.includes('/pet') && method === 'POST') {
    return {
      data: createMockPet() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  if (fullUrl.includes('/pet') && method === 'PUT') {
    return {
      data: createMockPet() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  if (fullUrl.includes('/pet/') && method === 'GET') {
    return {
      data: createMockPet() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  if (fullUrl.includes('/pet/findByStatus')) {
    return {
      data: [createMockPet(), createMockPet()] as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  // Store endpoints
  if (fullUrl.includes('/store/inventory')) {
    return {
      data: createMockInventory() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  if (fullUrl.includes('/store/order') && method === 'POST') {
    return {
      data: createMockOrder() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  if (fullUrl.includes('/store/order/') && method === 'GET') {
    return {
      data: createMockOrder() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  // User endpoints
  if (fullUrl.includes('/user/login')) {
    return {
      data: {
        code: 200,
        type: 'unknown',
        message: `Mock logged in user session:${Date.now()}`
      } as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  if (fullUrl.includes('/user') && method === 'POST') {
    return {
      data: createMockUser() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  if (fullUrl.includes('/user/') && method === 'GET') {
    return {
      data: createMockUser() as TData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' }
    }
  }

  // Default mock response
  return {
    data: { message: 'Mock response', endpoint: fullUrl } as TData,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' }
  }
}

// Main client function - always returns mock data when this client is imported
export async function client<TData, TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> {
  // Always try to return mock data first since this is the mock client
  const mockResponse = getMockResponse<TData>(config)
  if (mockResponse) {
    console.log(`[Mock Client] Returning mock data for ${config.method} ${config.url}`)
    return mockResponse
  }

  // Fallback to default mock response if no specific mock found
  const { method = 'GET', url = '', baseURL = '' } = config
  const fullUrl = baseURL ? `${baseURL}${url}` : url

  console.log(`[Mock Client] No specific mock found, returning default mock for ${method} ${fullUrl}`)
  return {
    data: { message: 'Default mock response', endpoint: fullUrl, method } as TData,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' }
  }
}

// Default export for flexibility
export default client