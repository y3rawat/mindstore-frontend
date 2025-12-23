/**
 * Auth-related API endpoints
 */

import { get, post, del } from './client';

/**
 * Fetch user usage stats
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - { success, usage }
 */
export async function fetchUserUsage(userId) {
    return get(`/auth/usage/${userId}`);
}

/**
 * Generate a new API key for external access
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - { success, apiKey }
 */
export async function generateApiKey(userId) {
    return post(`/auth/api-key/${userId}`);
}

/**
 * Get existing API key
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - { success, hasApiKey, apiKey }
 */
export async function getApiKey(userId) {
    return get(`/auth/api-key/${userId}`);
}

/**
 * Revoke API key
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - { success }
 */
export async function revokeApiKey(userId) {
    return del(`/auth/api-key/${userId}`);
}

export default {
    fetchUserUsage,
    generateApiKey,
    getApiKey,
    revokeApiKey,
};
