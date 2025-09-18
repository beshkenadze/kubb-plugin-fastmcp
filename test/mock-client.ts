/**
 * MSW-integrated mock client for FastMCP testing
 * This client uses MSW to intercept requests and return mocked data
 */

import { setupServer } from 'msw/node';
import { handlers } from './mocks-generated/mocks/handlers/handlers';

// Create MSW server with the generated handlers
const server = setupServer(...handlers)

// Start the server when the module is loaded
server.listen({
  onUnhandledRequest: 'warn'
})

// Create a mock client function that uses fetch with MSW interception
async function client<TData = any, TError = any, TRequest = any>(config: {
  method: string
  url: string
  baseURL?: string
  data?: TRequest
  headers?: Record<string, string>
}): Promise<{ data: TData; status: number; statusText: string }> {
  const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url

  console.info(`[MOCK] ${config.method} request to:`, fullUrl, 'with data:', config.data)

  const response = await fetch(fullUrl, {
    method: config.method,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    },
    body: config.data ? JSON.stringify(config.data) : undefined,
  })

  return {
    data: response.status === 204 ? null : await response.json(),
    status: response.status,
    statusText: response.statusText
  }
}

// Clean up function for tests
export function closeMockClient() {
  server.close()
}

// Export client as default
export default client