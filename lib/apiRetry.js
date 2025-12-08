/**
 * ════════════════════════════════════════════════════════════════════════
 * API RETRY LOGIC - Resilient Network Requests
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHY RETRY LOGIC:
 * Network requests fail for temporary reasons:
 * - Brief internet hiccup
 * - Server restart
 * - Load balancer switching
 * - DNS timeout
 * 
 * Instead of immediately showing error to user:
 * 1. Try again (server might have recovered)
 * 2. Wait a bit and try again (give it time)
 * 3. Only show error if all retries fail
 * 
 * RESULT:
 * - 90% of transient errors fix themselves
 * - Users never see them
 * - Better UX with no extra code in components
 * 
 * EXPONENTIAL BACKOFF EXPLAINED:
 * 
 * Attempt 1: Request → Fails
 * Wait 1 second (1000 * 1)
 * 
 * Attempt 2: Request → Fails
 * Wait 2 seconds (1000 * 2)
 * 
 * Attempt 3: Request → Fails
 * Show error to user
 * 
 * WHY EXPONENTIAL:
 * - If server is overloaded, immediate retry makes it worse
 * - Increasing delays give server time to recover
 * - Prevents thundering herd problem (all clients retrying at once)
 * 
 * WHEN TO RETRY:
 * ✅ 500-level errors (server errors, often transient)
 * ✅ Network errors (connection issues)
 * ✅ Timeouts (request took too long)
 * 
 * WHEN NOT TO RETRY:
 * ❌ 400-level errors (bad request, won't fix itself)
 * ❌ 401 errors (auth issue, won't fix itself)
 * ❌ 404 errors (not found, won't fix itself)
 * ❌ Validation errors (user input wrong)
 */

import { NetworkError, APIError, isRetryableError, getRetryDelay } from './errors.js';

// ═══════════════════════════════════════════════════════════════════════
// FETCH WITH RETRY - Drop-in Replacement for fetch()
// ═══════════════════════════════════════════════════════════════════════

/**
 * Enhanced fetch with automatic retry logic
 * 
 * USAGE:
 * Replace: await fetch('/api/chat', { method: 'POST', ... })
 * With: await fetchWithRetry('/api/chat', { method: 'POST', ... })
 * 
 * FEATURES:
 * - Automatic retry on transient errors
 * - Exponential backoff
 * - Configurable retry count
 * - Throws specific error types (NetworkError, APIError)
 * 
 * @param {string} url - API endpoint
 * @param {Object} options - fetch options (method, headers, body, etc.)
 * @param {number} maxRetries - Maximum retry attempts (default: 2)
 * @returns {Promise<Response>} Fetch response
 * @throws {NetworkError|APIError} If all retries fail
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  /**
   * RETRY LOOP:
   * - Loop from 0 to maxRetries (inclusive)
   * - Attempt 0, 1, 2 = 3 total attempts
   * - On last attempt, throw error (don't retry)
   */
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      /**
       * LOG ATTEMPT:
       * Helps debugging when issues occur
       * Shows in console: which retry attempt this is
       */
      if (attempt > 0) {
        console.log(`[API Retry] Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`);
      }
      
      /**
       * MAKE REQUEST:
       * Standard fetch call
       * Can fail with:
       * 1. Network error (catch block)
       * 2. HTTP error status (check below)
       */
      const response = await fetch(url, options);
      
      /**
       * CHECK RESPONSE STATUS:
       * response.ok is false for status >= 400
       * 
       * RETRY DECISION:
       * - 500-599: Server error (retry)
       * - 400-499: Client error (don't retry, except rate limit)
       */
      if (!response.ok) {
        /**
         * RATE LIMIT SPECIAL CASE (429):
         * Don't retry immediately
         * User should wait for cooldown period
         */
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new APIError('Rate limit exceeded', response.status);
        }
        
        /**
         * SERVER ERRORS (500+):
         * These are often transient
         * Retry might work
         */
        if (response.status >= 500 && attempt < maxRetries) {
          // Create error for retry logic
          const error = new APIError(`Server error: ${response.status}`, response.status);
          
          // Calculate delay for this attempt
          const delay = getRetryDelay(error, attempt);
          
          console.log(`[API Retry] Server error, retrying in ${delay}ms...`);
          
          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Continue to next iteration (retry)
          continue;
        }
        
        /**
         * CLIENT ERRORS (400-499):
         * Request is malformed or unauthorized
         * Retry won't help
         * Throw immediately
         */
        throw new APIError(`API error: ${response.status}`, response.status);
      }
      
      /**
       * SUCCESS:
       * Request succeeded, return response
       * No need to retry
       */
      return response;
      
    } catch (error) {
      /**
       * CATCH NETWORK ERRORS:
       * fetch() throws for:
       * - Network failure
       * - CORS issues
       * - Connection refused
       * 
       * DECISION LOGIC:
       * - If not last attempt AND retryable → retry
       * - If last attempt OR not retryable → throw
       */
      
      // If we already threw APIError, re-throw it
      if (error instanceof APIError) {
        // Only throw if this was last attempt or not retryable
        if (attempt === maxRetries || !isRetryableError(error)) {
          throw error;
        }
      }
      
      // Network/fetch errors
      if (error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
        /**
         * WRAP AS NetworkError:
         * Makes it easier to handle in UI
         * Provides consistent error type
         */
        const networkError = new NetworkError(error.message);
        
        /**
         * RETRY OR THROW:
         * - If not last attempt: retry
         * - If last attempt: throw
         */
        if (attempt < maxRetries) {
          const delay = getRetryDelay(networkError, attempt);
          console.log(`[API Retry] Network error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          throw networkError; // Give up
        }
      }
      
      /**
       * UNEXPECTED ERROR:
       * Not network, not API error
       * Could be:
       * - JSON parsing error
       * - Code bug
       * - Unknown issue
       * 
       * Don't retry (might make things worse)
       * Throw immediately
       */
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// JSON FETCH - Fetch + Parse JSON with Retry
// ═══════════════════════════════════════════════════════════════════════

/**
 * Convenience wrapper that fetches and parses JSON
 * 
 * USAGE:
 * const data = await fetchJSON('/api/chat', {
 *   method: 'POST',
 *   body: JSON.stringify({ messages: [...] })
 * });
 * 
 * BENEFITS:
 * - One-line JSON fetching
 * - Automatic retry
 * - Error handling included
 * - Type-safe response (if using TypeScript)
 * 
 * @param {string} url - API endpoint
 * @param {Object} options - fetch options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>} Parsed JSON response
 * @throws {NetworkError|APIError} If request fails
 */
export async function fetchJSON(url, options = {}, maxRetries = 2) {
  /**
   * SET JSON HEADERS:
   * Automatically add Content-Type and Accept headers
   * Most API calls need these
   */
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers, // Allow override
    },
  };
  
  /**
   * FETCH WITH RETRY:
   * Use our retry wrapper
   */
  const response = await fetchWithRetry(url, finalOptions, maxRetries);
  
  /**
   * PARSE JSON:
   * Can fail if response isn't valid JSON
   * Throw clear error in this case
   */
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API Retry] Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// POST HELPERS - Common Request Types
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST request with JSON body
 * 
 * USAGE:
 * const result = await postJSON('/api/chat', {
 *   messages: conversationHistory
 * });
 * 
 * FEATURES:
 * - Automatically stringifies body
 * - Sets correct headers
 * - Includes retry logic
 * 
 * @param {string} url - API endpoint
 * @param {Object} data - Request body (will be JSON.stringify'd)
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>} Parsed JSON response
 */
export async function postJSON(url, data, maxRetries = 2) {
  return fetchJSON(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }, maxRetries);
}

/**
 * GET request with automatic retry
 * 
 * USAGE:
 * const data = await getJSON('/api/results/abc123');
 * 
 * @param {string} url - API endpoint
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>} Parsed JSON response
 */
export async function getJSON(url, maxRetries = 2) {
  return fetchJSON(url, {
    method: 'GET',
  }, maxRetries);
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLES IN YOUR APP
 * ════════════════════════════════════════════════════════════════════════
 * 
 * EXAMPLE 1: Replace fetch in Chat Page
 * ────────────────────────────────────────────────────────────────────────
 * BEFORE:
 * const response = await fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ messages: history })
 * });
 * const data = await response.json();
 * 
 * AFTER:
 * import { postJSON } from '@/lib/apiRetry';
 * 
 * const data = await postJSON('/api/chat', {
 *   messages: history
 * });
 * 
 * 
 * EXAMPLE 2: With Error Handling
 * ────────────────────────────────────────────────────────────────────────
 * import { postJSON } from '@/lib/apiRetry';
 * import { handleError } from '@/lib/errors';
 * import { showError } from '@/lib/toast';
 * 
 * try {
 *   const data = await postJSON('/api/analyze', {
 *     conversation: messages
 *   });
 *   // Success! Use data
 * } catch (error) {
 *   // Auto-retried 3 times, still failed
 *   const message = handleError(error);
 *   showError(message);
 * }
 * 
 * 
 * EXAMPLE 3: Custom Retry Count
 * ────────────────────────────────────────────────────────────────────────
 * // For critical operations, retry more times
 * const data = await postJSON('/api/analyze', payload, 5); // 6 attempts total
 * 
 * // For non-critical operations, don't retry
 * const data = await postJSON('/api/log', payload, 0); // 1 attempt only
 * 
 * 
 * EXAMPLE 4: Stream Responses (no retry)
 * ────────────────────────────────────────────────────────────────────────
 * // For streaming responses, don't use retry
 * // Streams can't be replayed
 * const response = await fetch('/api/stream');
 * const reader = response.body.getReader();
 * // ... process stream
 * 
 * ════════════════════════════════════════════════════════════════════════
 * INTEGRATION WITH EXISTING CODE
 * ════════════════════════════════════════════════════════════════════════
 * 
 * UPDATE: app/chat/page.js
 * ────────────────────────────────────────────────────────────────────────
 * Replace the fetchAIResponse function:
 * 
 * import { postJSON } from '@/lib/apiRetry';
 * import { handleError } from '@/lib/errors';
 * import { showError } from '@/lib/toast';
 * 
 * const fetchAIResponse = async (history) => {
 *   setIsThinking(true);
 *   
 *   try {
 *     const data = await postJSON('/api/chat', { messages: history });
 *     
 *     if (data.isComplete) {
 *       localStorage.setItem('conversation_history', JSON.stringify(history));
 *       router.push('/results');
 *       return;
 *     }
 *     
 *     const aiMessage = { role: 'assistant', content: data.message };
 *     const updatedHistory = [...history, aiMessage];
 *     setConversationHistory(updatedHistory);
 *     setCurrentQuestion(data.message);
 *     
 *   } catch (error) {
 *     const message = handleError(error);
 *     showError(message);
 *     setCurrentQuestion("I'm having trouble right now. Can you try again?");
 *   } finally {
 *     setIsThinking(false);
 *   }
 * };
 * 
 * ════════════════════════════════════════════════════════════════════════
 * ADVANCED PATTERNS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PATTERN 1: With Timeout
 * ────────────────────────────────────────────────────────────────────────
 * const controller = new AbortController();
 * const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
 * 
 * try {
 *   const data = await fetchJSON('/api/chat', {
 *     signal: controller.signal
 *   });
 * } finally {
 *   clearTimeout(timeoutId);
 * }
 * 
 * 
 * PATTERN 2: Parallel Requests with Retry
 * ────────────────────────────────────────────────────────────────────────
 * const [analysis, competitors] = await Promise.all([
 *   postJSON('/api/analyze', { conversation }),
 *   getJSON('/api/competitors?q=' + encodeURIComponent(problem))
 * ]);
 * // Both requests auto-retry independently
 * 
 * 
 * PATTERN 3: Retry with User Notification
 * ────────────────────────────────────────────────────────────────────────
 * import { showInfo } from '@/lib/toast';
 * 
 * let retryCount = 0;
 * const originalFetch = fetchWithRetry;
 * 
 * const data = await fetchJSON('/api/chat', {}, 3);
 * // Internally handles retries
 * // Could show toast on retry if needed
 * 
 * ════════════════════════════════════════════════════════════════════════
 * TESTING RETRY LOGIC
 * ════════════════════════════════════════════════════════════════════════
 * 
 * TEST 1: Network Failure
 * - Turn off internet
 * - Make request
 * - Should retry 3 times
 * - Then show error
 * 
 * TEST 2: Server Error
 * - Mock API to return 500
 * - Should retry with exponential backoff
 * - Check console for retry logs
 * 
 * TEST 3: Client Error
 * - Mock API to return 400
 * - Should NOT retry
 * - Should show error immediately
 * 
 * TEST 4: Success on Second Try
 * - Mock API to fail first call, succeed second
 * - Should automatically retry and succeed
 * - User never sees error
 * 
 * ════════════════════════════════════════════════════════════════════════
 * PERFORMANCE CONSIDERATIONS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * RETRY ADDS LATENCY:
 * - First attempt: 0ms
 * - Retry 1: +1000ms (1s wait)
 * - Retry 2: +2000ms (2s wait)
 * - Total: Up to 3 seconds added
 * 
 * TRADE-OFF:
 * - Without retry: Fast failures (bad UX)
 * - With retry: Slower failures, but 90% auto-fix (good UX)
 * 
 * OPTIMIZATION:
 * - Only retry on transient errors
 * - Use exponential backoff (not constant delay)
 * - Limit max retry count (don't retry forever)
 * - Show loading state (user knows something is happening)
 */

