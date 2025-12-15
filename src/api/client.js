/**
 * Base API client with centralized error handling
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug: Log the API URL on startup
console.log('🔧 API Client initialized with base URL:', API_BASE);

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Make an API request with error handling
 * @param {string} endpoint - API endpoint (e.g., '/urls')
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    // Stringify body if it's an object
    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new ApiError(
                data.error || data.message || `Request failed with status ${response.status}`,
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        // Re-throw ApiErrors as-is
        if (error instanceof ApiError) {
            throw error;
        }

        // Network errors or other fetch failures
        throw new ApiError(
            error.message || 'Network error',
            0,
            null
        );
    }
}

/**
 * GET request helper
 */
export function get(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export function post(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request helper
 */
export function put(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE request helper
 */
export function del(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'DELETE', body });
}

export default {
    request: apiRequest,
    get,
    post,
    put,
    delete: del,
    ApiError,
};
