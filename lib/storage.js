/**
 * ════════════════════════════════════════════════════════════════════════
 * STORAGE UTILITIES - Vercel KV Integration
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Provides utilities for saving and loading results to/from Vercel KV
 * 
 * WHY VERCEL KV:
 * - Fast Redis-based storage
 * - Serverless-friendly (no connection pooling needed)
 * - Built-in TTL (auto-delete old results)
 * - Free tier: 256MB, 10k commands/day
 * 
 * KEY STRUCTURE:
 * - result:{id} → Stores full analysis + conversation
 * - TTL: 30 days (2,592,000 seconds)
 * 
 * FALLBACK:
 * If KV is not configured, functions gracefully return null
 * App continues to work with localStorage only
 */

import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'

/**
 * Check if Vercel KV storage is available
 * 
 * WHY CHECK:
 * - Development: KV might not be configured yet
 * - Production: Should always be available
 * - Graceful degradation: App works without it
 * 
 * @returns {boolean} True if storage is configured and ready
 */
export function isStorageAvailable() {
  return !!(
    process.env.KV_REST_API_URL && 
    process.env.KV_REST_API_TOKEN
  )
}

/**
 * Save a result to Vercel KV
 * 
 * FLOW:
 * 1. Generate unique ID (nanoid: 10 chars, URL-safe)
 * 2. Create data object with analysis, conversation, metadata
 * 3. Store in KV with 30-day TTL
 * 4. Return ID for shareable URL
 * 
 * @param {Object} analysis - Full analysis object from API
 * @param {Array} conversation - Full conversation history
 * @returns {Promise<string|null>} Share ID or null if failed
 */
export async function saveResult(analysis, conversation) {
  if (!isStorageAvailable()) {
    console.warn('[Storage] Vercel KV not configured')
    return null
  }

  try {
    // Generate unique 10-character ID (URL-safe)
    const id = nanoid(10)
    
    // Create data object
    const data = {
      analysis,
      conversation,
      createdAt: Date.now(),
      metadata: {
        score: analysis.score,
        verdict: analysis.verdict,
        // Optional: Track sharing for analytics
      }
    }
    
    // Store in KV with 30-day TTL
    const TTL_30_DAYS = 30 * 24 * 60 * 60 // seconds
    await kv.set(`result:${id}`, data, { ex: TTL_30_DAYS })
    
    console.log(`[Storage] Result saved with ID: ${id}`)
    return id
    
  } catch (error) {
    console.error('[Storage] Failed to save result:', error)
    return null
  }
}

/**
 * Load a result from Vercel KV
 * 
 * FLOW:
 * 1. Query KV for result:{id}
 * 2. If found, return data
 * 3. If not found (expired or invalid), return null
 * 
 * @param {string} id - Share ID from URL
 * @returns {Promise<Object|null>} Result data or null if not found
 */
export async function loadResult(id) {
  if (!isStorageAvailable()) {
    console.warn('[Storage] Vercel KV not configured')
    return null
  }

  try {
    const data = await kv.get(`result:${id}`)
    
    if (!data) {
      console.log(`[Storage] Result not found: ${id}`)
      return null
    }
    
    console.log(`[Storage] Result loaded: ${id}`)
    return data
    
  } catch (error) {
    console.error('[Storage] Failed to load result:', error)
    return null
  }
}

/**
 * Delete a result from Vercel KV
 * 
 * WHY PROVIDE DELETE:
 * - User might want to remove shared result
 * - Privacy concerns
 * - Future: User accounts with result management
 * 
 * @param {string} id - Share ID to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteResult(id) {
  if (!isStorageAvailable()) {
    console.warn('[Storage] Vercel KV not configured')
    return false
  }

  try {
    await kv.del(`result:${id}`)
    console.log(`[Storage] Result deleted: ${id}`)
    return true
    
  } catch (error) {
    console.error('[Storage] Failed to delete result:', error)
    return false
  }
}
