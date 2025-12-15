/**
 * Auth-related API endpoints
 */

import { get, post } from './client';

/**
 * Fetch user usage stats
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - { success, usage }
 */
export async function fetchUserUsage(userId) {
    return get(`/auth/usage/${userId}`);
}

/**
 * Update user tier (upgrade/downgrade)
 * @param {string} userId - Firebase user ID
 * @param {string} tier - New tier ('free' or 'paid')
 * @returns {Promise<object>} - { success }
 */
export async function updateUserTier(userId, tier) {
    return post(`/auth/tier/${userId}`, { tier });
}

export default {
    fetchUserUsage,
    updateUserTier,
};
