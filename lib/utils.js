/**
 * ════════════════════════════════════════════════════════════════════════
 * SHAREABLE RESULTS - Storage & ID Generation Utilities
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Enable users to share their startup validation results via unique URLs.
 * Results persist server-side so anyone with the link can view them.
 * 
 * STORAGE STRATEGY: Vercel KV (Redis)
 * 
 * WHY Vercel KV:
 * 1. Simple key-value storage (perfect for our use case)
 * 2. Fast global edge network (low latency worldwide)
 * 3. Built-in TTL (automatic cleanup of old results)
 * 4. Free tier (256MB, enough for thousands of results)
 * 5. Zero config on Vercel (just add to project)
 * 
 * DATA MODEL:
 * Key: result:{id}
 * Value: {
 *   analysis: { score, verdict, promising, reality, competitors, ... },
 *   conversation: [...message history...],
 *   createdAt: "2025-12-07T10:30:00.000Z",
 *   metadata: { version: "1.0" }
 * }
 * 
 * TTL: 30 days (results auto-delete after 1 month)
 * 
 * ════════════════════════════════════════════════════════════════════════
 */

import { nanoid } from 'nanoid';
import { kv } from '@vercel/kv';

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Result retention period in seconds
 * 
 * WHY 30 DAYS:
 * - Long enough for users to reference results
 * - Short enough to manage storage costs
 * - Reasonable for startup validation context
 * 
 * ALTERNATIVES:
 * - 7 days: Good for quick feedback loops
 * - 90 days: Good for long-term planning
 * - Forever: Bad for storage and legal compliance
 */
const RESULT_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * ID length for result URLs
 * 
 * WHY 10 CHARACTERS:
 * - Collision probability: ~1 in 1 quadrillion (64^10)
 * - URL-friendly: Short enough to share easily
 * - Security: Unguessable (acts as authorization token)
 * 
 * COLLISION MATH:
 * At 1000 results/hour, would take ~1 million years for 1% collision chance
 */
const ID_LENGTH = 10;

// ═══════════════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate a unique, URL-safe ID for a result
 * 
 * USES nanoid INSTEAD OF UUID BECAUSE:
 * - Shorter: "V1StGXR8_Z" vs "550e8400-e29b-41d4-a716-446655440000"
 * - URL-safe: Only uses [A-Za-z0-9_-]
 * - Cryptographically strong: Uses Web Crypto API
 * - Collision-resistant: 64^10 = ~1 quadrillion possibilities
 * 
 * EXAMPLE OUTPUT: "V1StGXR8_Z"
 * 
 * @returns {string} 10-character unique ID
 */
export function generateResultId() {
  return nanoid(ID_LENGTH);
}

// ═══════════════════════════════════════════════════════════════════════
// STORAGE - Vercel KV (Redis)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Save analysis result to Vercel KV with unique ID
 * 
 * STORAGE FLOW:
 * 1. Generate unique 10-char ID
 * 2. Package analysis + conversation + metadata
 * 3. Store in Redis with key: result:{id}
 * 4. Set 30-day TTL (auto-delete old results)
 * 5. Return ID for URL generation
 * 
 * KEY STRUCTURE:
 * - Prefix "result:" groups all results together
 * - Makes it easy to scan/list all results
 * - Can query by prefix: kv.keys('result:*')
 * 
 * METADATA TRACKING:
 * - createdAt: When result was generated
 * - version: Schema version (for future migrations)
 * - Can add: viewCount, lastViewed, etc.
 * 
 * ERROR HANDLING:
 * - If KV fails, log error and throw
 * - Caller should catch and show user-friendly message
 * - Don't lose the analysis data (caller can retry)
 * 
 * @param {Object} analysis - The GPT-4 generated analysis
 * @param {Array} conversation - Full Q&A message history
 * @returns {Promise<string>} The unique ID for this result
 * @throws {Error} If storage fails
 */
export async function saveResult(analysis, conversation) {
  const id = generateResultId();
  
  /**
   * RESULT DATA STRUCTURE:
   * 
   * WHY store conversation:
   * - Provides context for the analysis
   * - User can review what they said
   * - Useful for follow-up questions
   * 
   * WHY store metadata:
   * - Track when result was created
   * - Version for future schema changes
   * - Can add analytics later (views, shares)
   */
  const resultData = {
    analysis,
    conversation,
    createdAt: new Date().toISOString(),
    metadata: {
      version: '1.0',
      // Future: Add viewCount, shareCount, etc.
    }
  };
  
  try {
    /**
     * VERCEL KV SET COMMAND:
     * 
     * kv.set(key, value, options)
     * - key: "result:{id}" - Prefixed for organization
     * - value: JSON object (KV auto-serializes)
     * - options: { ex: seconds } - TTL (expiration time)
     * 
     * WHY TTL:
     * Redis will automatically delete this key after 30 days
     * No manual cleanup needed, saves storage costs
     * 
     * PERFORMANCE:
     * - KV is globally distributed (fast reads worldwide)
     * - Write propagates to all regions (~50-100ms)
     * - Reads are cached at the edge (<10ms)
     */
    await kv.set(`result:${id}`, resultData, {
      ex: RESULT_TTL // Expire after 30 days
    });
    
    console.log(`[Storage] Saved result ${id} to Vercel KV (TTL: ${RESULT_TTL}s)`);
    
    return id;
    
  } catch (error) {
    console.error('[Storage] Failed to save result to Vercel KV:', error);
    throw new Error('Failed to save result. Please try again.');
  }
}

/**
 * Load analysis result from Vercel KV by ID
 * 
 * LOADING FLOW:
 * 1. Query KV for key: result:{id}
 * 2. If not found, return null (expired or never existed)
 * 3. If found, validate structure and return
 * 
 * WHY RETURN NULL INSTEAD OF THROWING:
 * - Allows caller to show friendly "not found" UI
 * - Expected case (expired results, typos in URL)
 * - Not an error, just data not available
 * 
 * VALIDATION:
 * - Check required fields exist
 * - Gracefully handle corrupted data
 * - Return null if validation fails
 * 
 * EDGE CASE HANDLING:
 * - Result expired (TTL passed): null
 * - Invalid ID format: null
 * - Corrupted data: null
 * - Network error: throw (unexpected)
 * 
 * @param {string} id - The unique result ID from URL
 * @returns {Promise<Object|null>} Result data or null if not found
 */
export async function loadResult(id) {
  /**
   * INPUT VALIDATION:
   * Protect against malformed IDs before querying DB
   */
  if (!id || typeof id !== 'string' || id.length !== ID_LENGTH) {
    console.log('[Storage] Invalid ID format:', id);
    return null;
  }
  
  try {
    /**
     * VERCEL KV GET COMMAND:
     * 
     * kv.get(key)
     * - Returns parsed JSON object
     * - Returns null if key doesn't exist or expired
     * - Fast: Served from edge cache
     * 
     * TTL BEHAVIOR:
     * If result expired (>30 days old), Redis auto-deleted it
     * This will return null (expected behavior)
     */
    const data = await kv.get(`result:${id}`);
    
    if (!data) {
      console.log(`[Storage] Result ${id} not found (may have expired)`);
      return null;
    }
    
    /**
     * DATA VALIDATION:
     * Ensure the data has the expected structure
     * Protects against corrupted data or schema changes
     */
    if (!data.analysis || !data.createdAt) {
      console.error('[Storage] Invalid result data structure');
      return null;
    }
    
    console.log(`[Storage] Loaded result ${id} from Vercel KV`);
    
    return data;
    
  } catch (error) {
    console.error('[Storage] Failed to load result from Vercel KV:', error);
    
    /**
     * THROW ON NETWORK ERRORS:
     * These are unexpected and should be handled by caller
     * Allows retry logic or showing "service unavailable"
     */
    throw new Error('Failed to load result. Please try again.');
  }
}

/**
 * Check if Vercel KV is configured
 * 
 * WHY THIS IS USEFUL:
 * - During local development, KV might not be set up yet
 * - Can show warning in UI: "Sharing disabled (local dev)"
 * - Gracefully fall back to localStorage if needed
 * 
 * HOW TO CHECK:
 * Vercel KV requires env vars: KV_REST_API_URL, KV_REST_API_TOKEN
 * These are auto-set when KV is added to Vercel project
 * 
 * @returns {boolean} True if KV is configured
 */
export function isStorageAvailable() {
  /**
   * ENVIRONMENT VARIABLE CHECK:
   * Vercel KV needs these to connect to Redis
   * 
   * In production (Vercel): Auto-set when KV is added
   * In development: Must run `vercel env pull` to get local env
   */
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * SETUP INSTRUCTIONS FOR VERCEL KV
 * ════════════════════════════════════════════════════════════════════════
 * 
 * 1. IN VERCEL DASHBOARD:
 *    - Go to your project
 *    - Click "Storage" tab
 *    - Click "Create Database"
 *    - Select "KV" (Redis)
 *    - Name it (e.g., "startup-validator-kv")
 *    - Click "Create"
 * 
 * 2. CONNECT TO PROJECT:
 *    - KV dashboard → "Connect to Project"
 *    - Select your project
 *    - Click "Connect"
 *    - Env vars auto-added: KV_REST_API_URL, KV_REST_API_TOKEN
 * 
 * 3. FOR LOCAL DEVELOPMENT:
 *    - Install Vercel CLI: npm i -g vercel
 *    - Run: vercel env pull .env.local
 *    - This downloads KV credentials to .env.local
 *    - Restart dev server: npm run dev
 * 
 * 4. VERIFY SETUP:
 *    - Check isStorageAvailable() returns true
 *    - Try saving/loading a test result
 *    - Check Vercel KV dashboard for stored data
 * 
 * ════════════════════════════════════════════════════════════════════════
 * COST ESTIMATE (Free Tier)
 * ════════════════════════════════════════════════════════════════════════
 * 
 * Vercel KV Free Tier:
 * - Storage: 256 MB
 * - Bandwidth: 10 GB/month
 * - Commands: 10,000/day
 * 
 * Average Result Size:
 * - Analysis JSON: ~2-5 KB
 * - Conversation: ~2-3 KB
 * - Total per result: ~5-8 KB
 * 
 * Capacity:
 * - 256 MB / 8 KB = ~32,000 results
 * - With 30-day TTL, auto-cleanup keeps this manageable
 * 
 * When to Upgrade:
 * - If you hit 32k active results
 * - If you need longer retention (>30 days)
 * - Pro tier: $20/month for 1 GB storage
 * 
 * ════════════════════════════════════════════════════════════════════════
 * MIGRATION NOTES (If Moving from localStorage)
 * ════════════════════════════════════════════════════════════════════════
 * 
 * If you started with localStorage and want to migrate:
 * 
 * 1. Old results stay in localStorage (don't try to migrate)
 * 2. New results go to Vercel KV
 * 3. Update loadResult to check both:
 *    - First check KV (new results)
 *    - Fall back to localStorage (old results)
 * 4. Eventually localStorage results expire/clear naturally
 * 
 * ════════════════════════════════════════════════════════════════════════
 */

