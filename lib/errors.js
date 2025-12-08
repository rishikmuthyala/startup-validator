/**
 * ════════════════════════════════════════════════════════════════════════
 * ERROR HANDLING UTILITIES - User-Friendly Error Management
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ERROR HANDLING PHILOSOPHY:
 * 
 * 1. CATEGORIZE ERRORS:
 *    Different errors need different handling
 *    Network errors → "Check your connection"
 *    API errors → "Our servers are having issues"
 *    Validation errors → "Please check your input"
 * 
 * 2. USER-FRIENDLY MESSAGES:
 *    Users don't need to know:
 *    ❌ "TypeError: Cannot read property 'data' of undefined"
 *    They need to know:
 *    ✅ "Something went wrong, please try again"
 * 
 * 3. ACTIONABLE FEEDBACK:
 *    Every error should suggest what to do:
 *    - "Check your internet connection"
 *    - "Please try again in a moment"
 *    - "Contact support if this persists"
 * 
 * 4. DEVELOPER DEBUGGING:
 *    Log technical details to console
 *    Show friendly messages to users
 *    Never expose internal system details
 * 
 * WHY CUSTOM ERROR CLASSES:
 * - Easy to catch specific error types
 * - Can add custom properties (statusCode, retry info)
 * - Better than checking error.message strings
 * - Type-safe (if using TypeScript)
 */

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM ERROR CLASSES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Network-related errors (connection issues, timeouts)
 * 
 * WHEN TO THROW:
 * - fetch() fails with network error
 * - Request times out
 * - Connection refused
 * - DNS lookup fails
 * 
 * EXAMPLE:
 * try {
 *   await fetch('/api/chat')
 * } catch (error) {
 *   if (error.message.includes('Failed to fetch')) {
 *     throw new NetworkError('Connection failed')
 *   }
 * }
 */
export class NetworkError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * API-specific errors (4xx, 5xx responses)
 * 
 * INCLUDES STATUS CODE:
 * Different status codes need different handling:
 * - 400: Bad request (validation error)
 * - 401: Unauthorized (auth issue)
 * - 429: Rate limited (too many requests)
 * - 500: Server error (retry possible)
 * - 503: Service unavailable (maintenance)
 * 
 * EXAMPLE:
 * const response = await fetch('/api/chat')
 * if (!response.ok) {
 *   throw new APIError('API request failed', response.status)
 * }
 */
export class APIError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'APIError'
    this.status = status
  }
}

/**
 * Validation errors (user input issues)
 * 
 * WHEN TO THROW:
 * - Empty required fields
 * - Invalid format (email, URL)
 * - Out of range values
 * - Too long/short input
 * 
 * EXAMPLE:
 * if (!problem || problem.trim().length < 20) {
 *   throw new ValidationError('Problem description too short')
 * }
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Rate limit errors (too many requests)
 * 
 * INCLUDES RETRY INFO:
 * - When user can retry
 * - How long to wait
 * 
 * EXAMPLE:
 * if (response.status === 429) {
 *   const retryAfter = response.headers.get('Retry-After')
 *   throw new RateLimitError('Too many requests', retryAfter)
 * }
 */
export class RateLimitError extends Error {
  constructor(message, retryAfter = null) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter // Seconds until can retry
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR MESSAGE TRANSLATOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Converts technical errors into user-friendly messages
 * 
 * DESIGN PRINCIPLE:
 * - Categorize by error type (not just generic message)
 * - Provide specific guidance for each type
 * - Always actionable (tell user what to do)
 * - Never blame user ("You entered invalid data" ❌)
 * - Empathetic tone ("We're having trouble" ✅)
 * 
 * USAGE:
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   const userMessage = handleError(error)
 *   showError(userMessage) // Toast notification
 * }
 * 
 * @param {Error} error - Any error object
 * @returns {string} User-friendly error message
 */
export function handleError(error) {
  /**
   * LOG FOR DEVELOPERS:
   * Always log full error details to console
   * Developers need stack traces, users don't
   */
  console.error('[Error Handler]', error);
  
  // ─────────────────────────────────────────────────────────────────────
  // NETWORK ERRORS
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * NETWORK ERROR HANDLING:
   * Usually caused by:
   * - Offline/disconnected
   * - VPN issues
   * - Firewall blocking
   * - DNS problems
   * 
   * USER ACTION:
   * Check connection and retry
   */
  if (error instanceof NetworkError) {
    return 'Connection issue. Check your internet and try again.'
  }
  
  // Catch fetch errors (before they become NetworkError)
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') ||
      error.message?.includes('fetch')) {
    return 'Connection issue. Check your internet and try again.'
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // RATE LIMIT ERRORS
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * RATE LIMIT HANDLING:
   * User is making too many requests
   * Could be:
   * - Clicking button repeatedly
   * - Automated script
   * - Genuinely hitting API limits
   * 
   * STRATEGY:
   * - Be polite (not accusatory)
   * - Tell them how long to wait
   * - Implement client-side throttling
   */
  if (error instanceof RateLimitError) {
    if (error.retryAfter) {
      return `Too many requests. Please wait ${error.retryAfter} seconds and try again.`
    }
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // API ERRORS (by Status Code)
  // ─────────────────────────────────────────────────────────────────────
  
  if (error instanceof APIError) {
    /**
     * 400-LEVEL ERRORS (Client Errors):
     * Something wrong with the request
     * Usually not transient (retry won't help)
     */
    if (error.status === 400) {
      return 'Invalid request. Please check your input and try again.'
    }
    
    if (error.status === 401) {
      return 'Authentication required. Please refresh the page.'
    }
    
    if (error.status === 403) {
      return 'Access denied. Please contact support.'
    }
    
    if (error.status === 404) {
      return 'Resource not found. Please try again.'
    }
    
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    
    /**
     * 500-LEVEL ERRORS (Server Errors):
     * Something wrong on our end
     * Often transient (retry might work)
     */
    if (error.status >= 500 && error.status < 600) {
      return 'Our servers are having issues. Please try again in a moment.'
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // VALIDATION ERRORS
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * VALIDATION ERROR HANDLING:
   * User input doesn't meet requirements
   * 
   * STRATEGY:
   * - Be specific about what's wrong
   * - Show the validation rule
   * - Suggest how to fix
   * 
   * BETTER APPROACH:
   * Prevent validation errors with:
   * - Real-time input validation
   * - Clear field requirements
   * - Helpful placeholder text
   */
  if (error instanceof ValidationError) {
    // Return the specific validation message
    return error.message || 'Please check your input and try again.'
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // OPENAI-SPECIFIC ERRORS
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * OPENAI ERROR CODES:
   * These are specific to OpenAI API
   * Handle them specially for better UX
   */
  if (error.code === 'insufficient_quota') {
    // Developer issue, but show user-friendly message
    return 'Service temporarily unavailable. Please try again later.'
  }
  
  if (error.code === 'invalid_api_key') {
    return 'Service configuration error. Please contact support.'
  }
  
  if (error.code === 'rate_limit_exceeded') {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  if (error.code === 'context_length_exceeded') {
    return 'Conversation too long. Please start a new conversation.'
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // TIMEOUT ERRORS
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * TIMEOUT HANDLING:
   * Request took too long
   * Could be:
   * - Slow network
   * - Server overloaded
   * - Large response
   * 
   * STRATEGY:
   * - Suggest retry
   * - Consider increasing timeout
   * - Check if request is too complex
   */
  if (error.message?.includes('timeout') || 
      error.message?.includes('timed out') ||
      error.name === 'TimeoutError') {
    return 'Request timed out. Please try again.'
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // GENERIC FALLBACK
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * CATCH-ALL ERROR MESSAGE:
   * For any error we didn't specifically handle
   * 
   * IMPORTANT:
   * - Never show error.message directly (could be technical)
   * - Never show stack traces
   * - Always provide action ("try again")
   * - Log full error for debugging
   * 
   * PRODUCTION IMPROVEMENT:
   * Track how often this fallback is hit
   * Add specific handlers for common errors
   */
  return 'Something went wrong. Please try again.'
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check if error is retryable
 * 
 * STRATEGY:
 * Some errors can be fixed by retrying:
 * ✅ Network errors (connection might recover)
 * ✅ 500-level errors (server might recover)
 * ✅ Timeout errors (next try might be faster)
 * 
 * Some errors won't be fixed by retrying:
 * ❌ 400-level errors (request is invalid)
 * ❌ Validation errors (input is wrong)
 * ❌ Auth errors (credentials are invalid)
 * 
 * USAGE:
 * if (isRetryableError(error)) {
 *   await retryWithBackoff(operation)
 * } else {
 *   showError(handleError(error))
 * }
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is worth retrying
 */
export function isRetryableError(error) {
  // Network errors: Always retry
  if (error instanceof NetworkError) {
    return true
  }
  
  // API errors: Only retry 500-level
  if (error instanceof APIError) {
    return error.status >= 500 && error.status < 600
  }
  
  // Validation errors: Never retry
  if (error instanceof ValidationError) {
    return false
  }
  
  // Rate limit: Don't retry (wait for cooldown)
  if (error instanceof RateLimitError) {
    return false
  }
  
  // Timeout: Retry
  if (error.message?.includes('timeout')) {
    return true
  }
  
  // Fetch errors: Retry
  if (error.message?.includes('fetch')) {
    return true
  }
  
  // Unknown errors: Don't retry (might make things worse)
  return false
}

/**
 * Get suggested retry delay based on error type
 * 
 * EXPONENTIAL BACKOFF:
 * - First retry: 1 second
 * - Second retry: 2 seconds
 * - Third retry: 4 seconds
 * 
 * RATE LIMIT:
 * - Use Retry-After header if provided
 * - Otherwise wait 60 seconds
 * 
 * @param {Error} error - Error object
 * @param {number} attempt - Retry attempt number (0-indexed)
 * @returns {number} Milliseconds to wait
 */
export function getRetryDelay(error, attempt = 0) {
  // Rate limit: Use provided delay or default 60s
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000 // Convert to ms
  }
  if (error instanceof RateLimitError) {
    return 60000 // 60 seconds
  }
  
  // Exponential backoff: 1s, 2s, 4s, 8s
  return Math.min(1000 * Math.pow(2, attempt), 8000)
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLES
 * ════════════════════════════════════════════════════════════════════════
 * 
 * EXAMPLE 1: Basic Error Handling
 * ────────────────────────────────────────────────────────────────────────
 * import { handleError, APIError } from '@/lib/errors';
 * import { showError } from '@/lib/toast';
 * 
 * try {
 *   const response = await fetch('/api/chat');
 *   if (!response.ok) {
 *     throw new APIError('API failed', response.status);
 *   }
 * } catch (error) {
 *   const message = handleError(error);
 *   showError(message);
 * }
 * 
 * 
 * EXAMPLE 2: With Retry Logic
 * ────────────────────────────────────────────────────────────────────────
 * import { handleError, isRetryableError, getRetryDelay } from '@/lib/errors';
 * 
 * async function fetchWithRetry(url, maxRetries = 3) {
 *   for (let i = 0; i < maxRetries; i++) {
 *     try {
 *       return await fetch(url);
 *     } catch (error) {
 *       if (i === maxRetries - 1 || !isRetryableError(error)) {
 *         throw error;
 *       }
 *       const delay = getRetryDelay(error, i);
 *       await new Promise(resolve => setTimeout(resolve, delay));
 *     }
 *   }
 * }
 * 
 * 
 * EXAMPLE 3: Validation
 * ────────────────────────────────────────────────────────────────────────
 * import { ValidationError, handleError } from '@/lib/errors';
 * 
 * function validateProblem(problem) {
 *   if (!problem || problem.trim().length < 20) {
 *     throw new ValidationError('Problem description must be at least 20 characters');
 *   }
 *   if (problem.length > 500) {
 *     throw new ValidationError('Problem description too long (max 500 characters)');
 *   }
 * }
 * 
 * try {
 *   validateProblem(userInput);
 * } catch (error) {
 *   showError(handleError(error)); // Shows specific validation message
 * }
 * 
 * ════════════════════════════════════════════════════════════════════════
 * PRODUCTION IMPROVEMENTS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * 1. ERROR TRACKING:
 *    - Integrate Sentry or similar
 *    - Track error frequency
 *    - Get notified of new errors
 * 
 * 2. USER REPORTING:
 *    - "Report a problem" button
 *    - Collect user context
 *    - Attach error ID for support
 * 
 * 3. SMART RETRY:
 *    - Track retry success rate
 *    - Adjust retry strategy based on error type
 *    - Limit total retries per session
 * 
 * 4. CONTEXTUAL HELP:
 *    - Show help docs for common errors
 *    - Link to status page for outages
 *    - Suggest alternative actions
 */

