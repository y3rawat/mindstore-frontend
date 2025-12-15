/**
 * URL-related API endpoints
 */

import { get, post, del } from './client';

/**
 * Fetch user's saved content with pagination
 * @param {string} userId - Firebase user ID
 * @param {object} options - Pagination options
 * @returns {Promise<object>} - { success, items, total }
 */
export async function fetchUserContent(userId, { limit = 20, offset = 0 } = {}) {
    return get(`/urls?userId=${userId}&limit=${limit}&offset=${offset}`);
}

/**
 * Save a new URL
 * @param {string} url - URL to save
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - { success, platform, contentHash, ... }
 */
export async function saveUrl(url, userId) {
    return post('/urls', { url, userId });
}

/**
 * Delete a saved URL by content hash
 * @param {string} contentHash - Content hash of the item to delete
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - { success }
 */
export async function deleteUrl(contentHash, userId) {
    return del(`/urls/${contentHash}`, { userId });
}

/**
 * Delete multiple URLs
 * @param {string[]} contentHashes - Array of content hashes to delete
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object[]>} - Array of delete results
 */
export async function deleteMultipleUrls(contentHashes, userId) {
    return Promise.all(
        contentHashes.map(contentHash => deleteUrl(contentHash, userId))
    );
}

export default {
    fetchUserContent,
    saveUrl,
    deleteUrl,
    deleteMultipleUrls,
};
