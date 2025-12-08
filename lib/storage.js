/**
 * ════════════════════════════════════════════════════════════════════════
 * STORAGE UTILITIES - Redis/KV Integration
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Provides utilities for saving and loading results to/from Redis storage
 * 
 * WHY REDIS/KV:
 * - Fast Redis-based storage
 * - Serverless-friendly
 * - Built-in TTL (auto-delete old results)
 * - Free tier: 256MB, 10k commands/day
 * 
 * SUPPORTED CONFIGURATIONS:
 * - KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV REST API)
 * - REDIS_URL (Direct Redis connection via ioredis)
 * 
 * KEY STRUCTURE:
 * - result:{id} → Stores full analysis + conversation
 * - TTL: 30 days (2,592,000 seconds)
 * 
 * FALLBACK:
 * If storage is not configured, functions gracefully return null
 * App continues to work with localStorage only
 */

import { nanoid } from 'nanoid'

// Lazy-load Redis clients to avoid initialization errors
let redisClient = null
let kvClient = null

/**
 * Get or create Redis client based on available environment variables
 */
function getRedisClient() {
  // Return cached client if available
  if (redisClient !== null) return redisClient
  if (kvClient !== null) return kvClient
  
  // Check for KV REST API credentials (preferred)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = require('@vercel/kv')
      kvClient = kv
      return kvClient
    } catch (error) {
      console.error('[Storage] Failed to initialize Vercel KV:', error)
    }
  }
  
  // Check for Redis URL (fallback)
  if (process.env.REDIS_URL) {
    try {
      const Redis = require('ioredis')
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
      })
      
      // Connect to Redis
      redisClient.connect().catch(err => {
        console.error('[Storage] Redis connection error:', err)
        redisClient = false // Mark as failed
      })
      
      return redisClient
    } catch (error) {
      console.error('[Storage] Failed to initialize Redis client:', error)
      redisClient = false
    }
  }
  
  // No storage available
  redisClient = false
  return null
}

/**
 * Check if storage is available
 * 
 * @returns {boolean} True if storage is configured and ready
 */
export function isStorageAvailable() {
  return !!(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    process.env.REDIS_URL
  )
}

/**
 * Save a result to Redis/KV
 * 
 * @param {Object} analysis - Full analysis object from API
 * @param {Array} conversation - Full conversation history
 * @returns {Promise<string|null>} Share ID or null if failed
 */
export async function saveResult(analysis, conversation) {
  if (!isStorageAvailable()) {
    console.warn('[Storage] Redis/KV not configured')
    return null
  }

  const client = getRedisClient()
  if (!client) {
    console.warn('[Storage] Failed to get Redis client')
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
      }
    }
    
    const key = `result:${id}`
    const TTL_30_DAYS = 30 * 24 * 60 * 60 // seconds
    
    // Check if we're using KV (has .set with options) or ioredis (uses setex)
    if (client.constructor.name === 'Redis' || typeof client.setex === 'function') {
      // Using ioredis
      await client.setex(key, TTL_30_DAYS, JSON.stringify(data))
    } else {
      // Using @vercel/kv
      await client.set(key, data, { ex: TTL_30_DAYS })
    }
    
    console.log(`[Storage] Result saved with ID: ${id}`)
    return id
    
  } catch (error) {
    console.error('[Storage] Failed to save result:', error)
    return null
  }
}

/**
 * Load a result from Redis/KV
 * 
 * @param {string} id - Share ID from URL
 * @returns {Promise<Object|null>} Result data or null if not found
 */
export async function loadResult(id) {
  if (!isStorageAvailable()) {
    console.warn('[Storage] Redis/KV not configured')
    return null
  }

  const client = getRedisClient()
  if (!client) {
    console.warn('[Storage] Failed to get Redis client')
    return null
  }

  try {
    const key = `result:${id}`
    const data = await client.get(key)
    
    if (!data) {
      console.log(`[Storage] Result not found: ${id}`)
      return null
    }
    
    // If using ioredis, parse JSON string
    const result = typeof data === 'string' ? JSON.parse(data) : data
    
    console.log(`[Storage] Result loaded: ${id}`)
    return result
    
  } catch (error) {
    console.error('[Storage] Failed to load result:', error)
    return null
  }
}

/**
 * Delete a result from Redis/KV
 * 
 * @param {string} id - Share ID to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteResult(id) {
  if (!isStorageAvailable()) {
    console.warn('[Storage] Redis/KV not configured')
    return false
  }

  const client = getRedisClient()
  if (!client) {
    console.warn('[Storage] Failed to get Redis client')
    return false
  }

  try {
    const key = `result:${id}`
    await client.del(key)
    console.log(`[Storage] Result deleted: ${id}`)
    return true
    
  } catch (error) {
    console.error('[Storage] Failed to delete result:', error)
    return false
  }
}
