/**
 * MSW server setup for testing with mock API
 */

import { setupServer } from 'msw/node';
import { handlers } from './generated/mocks/handlers/handlers.ts';
import { beforeAll, afterEach, afterAll } from 'vitest';

// This configures a request mocking server with the given request handlers
export const server = setupServer(...handlers)

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn'
  })
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
})

// Clean up after the tests are finished
afterAll(() => {
  server.close()
})