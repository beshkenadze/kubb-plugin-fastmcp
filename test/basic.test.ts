import { build } from '@kubb/core';
import { describe, expect, it } from 'vitest';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';
import { pluginFastMCP, pluginFastMCPName } from '../src';

describe('FastMCP Plugin', () => {
  it('should be defined', () => {
    expect(pluginFastMCP).toBeDefined()
  })

  it('should have correct name', () => {
    expect(pluginFastMCPName).toBe('plugin-fastmcp')
  })

  it('should accept options', () => {
    const plugin = pluginFastMCP({ output: { path: './test' } })
    expect(plugin.name).toBe('plugin-fastmcp')
    expect(plugin.options.output).toEqual({ path: './test' })
  })

  it('should generate handlers with proper path parameter handling', async () => {
    const pathParamSpec = `
openapi: 3.0.0
info:
  title: Path Param Test API
  version: 1.0.0
paths:
  /users/{userId}:
    get:
      operationId: getUserById
      summary: Get user by ID
      parameters:
        - in: path
          name: userId
          required: true
          schema:
            type: string
          description: The user ID
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  name:
                    type: string
    put:
      operationId: updateUser
      summary: Update user
      parameters:
        - in: path
          name: userId
          required: true
          schema:
            type: string
          description: The user ID
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  name:
                    type: string
  /orders/{orderId}/items/{itemId}:
    delete:
      operationId: deleteOrderItem
      summary: Delete order item
      parameters:
        - in: path
          name: orderId
          required: true
          schema:
            type: integer
        - in: path
          name: itemId
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Deleted
  /search:
    get:
      operationId: searchItems
      summary: Search items with query parameters
      parameters:
        - in: query
          name: q
          required: true
          schema:
            type: string
          description: Search query
        - in: query
          name: limit
          required: false
          schema:
            type: integer
          description: Maximum number of results
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    title:
                      type: string
    `;

    const result = await build({
      config: {
        root: '.',
        input: {
          data: pathParamSpec,
        },
        output: {
          path: './test/temp-path-params',
        },
        plugins: [
          pluginOas(),
          pluginTs(),
          pluginZod(),
          pluginFastMCP({
            output: {
              path: './fastmcp',
            },
          }),
        ],
      },
    });

    expect(result.error).toBeUndefined();
    expect(result.files).toBeTruthy();

    // Find handler files (named after operation IDs)
    const fastmcpFiles = result.files.filter(f => f.path.includes('fastmcp'));
    const handlerFiles = fastmcpFiles.filter(f =>
      f.baseName === 'getUserById.ts' ||
      f.baseName === 'updateUser.ts' ||
      f.baseName === 'deleteOrderItem.ts' ||
      f.baseName === 'searchItems.ts'
    );
    expect(handlerFiles.length).toBe(4);

    // Test GET /users/{userId} handler (path param only)
    const getUserHandler = handlerFiles.find(f => f.baseName === 'getUserById.ts');
    expect(getUserHandler).toBeTruthy();

    const getUserSource = getUserHandler?.sources?.[0]?.value;
    expect(getUserSource).toContain('{ userId }'); // Parameter destructuring
    expect(getUserSource).toContain('userId: GetUserByIdPathParams[\'userId\']'); // Type annotation
    expect(getUserSource).toContain('`/users/${userId}`'); // URL template

    // Test PUT /users/{userId} handler (path param + request body)
    const updateUserHandler = handlerFiles.find(f => f.baseName === 'updateUser.ts');
    expect(updateUserHandler).toBeTruthy();

    const updateUserSource = updateUserHandler?.sources?.[0]?.value;
    expect(updateUserSource).toContain('{ data, userId }'); // Both data and path param
    expect(updateUserSource).toContain('data: UpdateUserMutationRequest'); // Request body type
    expect(updateUserSource).toContain('userId: UpdateUserPathParams[\'userId\']'); // Path param type
    expect(updateUserSource).toContain('`/users/${userId}`'); // URL template
    expect(updateUserSource).toContain('data: requestData'); // Request data passed to client

    // Test DELETE /orders/{orderId}/items/{itemId} handler (multiple path params)
    const deleteOrderItemHandler = handlerFiles.find(f => f.baseName === 'deleteOrderItem.ts');
    expect(deleteOrderItemHandler).toBeTruthy();

    const deleteOrderItemSource = deleteOrderItemHandler?.sources?.[0]?.value;
    expect(deleteOrderItemSource).toContain('{ orderId, itemId }'); // Multiple path params
    expect(deleteOrderItemSource).toContain('orderId: DeleteOrderItemPathParams[\'orderId\']'); // First param type
    expect(deleteOrderItemSource).toContain('itemId: DeleteOrderItemPathParams[\'itemId\']'); // Second param type
    expect(deleteOrderItemSource).toContain('`/orders/${orderId}/items/${itemId}`'); // Multiple params in URL

    // Test GET /search handler (query params only)
    const searchItemsHandler = handlerFiles.find(f => f.baseName === 'searchItems.ts');
    expect(searchItemsHandler).toBeTruthy();

    const searchItemsSource = searchItemsHandler?.sources?.[0]?.value;
    expect(searchItemsSource).toContain('{ queryParams }'); // Query params destructuring
    expect(searchItemsSource).toContain('queryParams: SearchItemsQueryParams'); // Query params type annotation
    expect(searchItemsSource).toContain('params: queryParams'); // Query params passed to client
    // Should NOT contain the invalid syntax from before
    expect(searchItemsSource).not.toContain('...queryParams: SearchItemsQueryParams');
  });
})