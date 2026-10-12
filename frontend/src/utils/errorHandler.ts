import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Extracts a clear, user-friendly error message from an unknown error,
 * with comprehensive support for Axios, NestJS response shapes, and network issues.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (!error) {
    return fallback || 'An unexpected error occurred. Please try again.';
  }

  // Handle Axios Errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Network / connectivity errors
    if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
      return 'Unable to reach the server. Please check your internet connection.';
    }

    if (axiosError.code === 'ECONNABORTED' || axiosError.message?.toLowerCase().includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    // Backend Response Message (NestJS / Express)
    const responseData = axiosError.response?.data;
    if (responseData) {
      if (Array.isArray(responseData.message) && responseData.message.length > 0) {
        return responseData.message.join(', ');
      }
      if (typeof responseData.message === 'string' && responseData.message.trim()) {
        return responseData.message;
      }
      if (typeof responseData.error === 'string' && responseData.error.trim()) {
        return responseData.error;
      }
    }

    // HTTP Status Fallbacks
    const status = axiosError.response?.status;
    switch (status) {
      case 400:
        return fallback || 'Invalid request. Please check the details you entered.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return fallback || 'The requested item or resource could not be found.';
      case 409:
        return fallback || 'A conflict occurred. This record may already exist.';
      case 422:
        return fallback || 'Unable to process data. Please verify the information entered.';
      case 429:
        return 'Too many requests. Please slow down and try again shortly.';
      case 500:
        return 'Internal server error. Our engineering team has been notified.';
      case 502:
      case 503:
      case 504:
        return 'The service is temporarily unavailable. Please try again in a moment.';
      default:
        break;
    }

    if (axiosError.message && !axiosError.message.includes('status code')) {
      return axiosError.message;
    }
  }

  // Handle Standard JavaScript Errors
  if (error instanceof Error) {
    if (error.message && !error.message.includes('[object Object]')) {
      return error.message;
    }
  }

  // Handle String Errors
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback || 'An unexpected error occurred. Please try again.';
}

/**
 * Centrally handles an API or runtime error:
 * 1. Resolves a user-friendly message.
 * 2. Displays a toast notification (optional, defaults to true).
 * 3. Logs technical details in development for debugging.
 * 4. Returns the friendly message string for local component state.
 */
export function handleApiError(
  error: unknown,
  fallbackMessage?: string,
  options: { showToast?: boolean; toastId?: string } = { showToast: true }
): string {
  const friendlyMessage = getErrorMessage(error, fallbackMessage);

  if (process.env.NODE_ENV !== 'production') {
    console.error('[API Error Caught]:', error);
  }

  if (options.showToast !== false) {
    toast.error(friendlyMessage, { id: options.toastId });
  }

  return friendlyMessage;
}

/**
 * Safe asynchronous execution wrapper with built-in try/catch, loading tracking,
 * and central error notification.
 */
export async function runWithHandler<T>(
  action: () => Promise<T>,
  options?: {
    fallbackMessage?: string;
    showToast?: boolean;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown, message: string) => void;
  }
): Promise<[T | null, string | null]> {
  try {
    const result = await action();
    if (options?.onSuccess) {
      options.onSuccess(result);
    }
    return [result, null];
  } catch (error) {
    const message = handleApiError(error, options?.fallbackMessage, {
      showToast: options?.showToast ?? true,
    });
    if (options?.onError) {
      options.onError(error, message);
    }
    return [null, message];
  }
}
