/**
 * Client re-export to fix Bun import issues with @kubb/plugin-client wildcard exports
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

// Create axios instance
const axiosInstance = axios.create()

// Client function
export async function client<TData, TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> {
  try {
    const response = await axiosInstance.request(config)
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorResponse: ResponseErrorConfig<TError> = {
        response: error.response ? {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText
        } : undefined,
        message: error.message
      }
      throw errorResponse
    }
    throw error
  }
}

// Default export for flexibility
export default client