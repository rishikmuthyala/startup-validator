'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * GLOBAL ERROR BOUNDARY - Last Line of Defense
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHAT IS AN ERROR BOUNDARY:
 * React component that catches JavaScript errors anywhere in the component tree,
 * logs them, and displays a fallback UI instead of crashing the entire app.
 * 
 * WHEN THIS CATCHES ERRORS:
 * ✅ Rendering errors (component fails to render)
 * ✅ Lifecycle method errors (useEffect crashes)
 * ✅ Constructor errors (component initialization fails)
 * ✅ Child component errors (any component in the tree fails)
 * 
 * WHEN THIS DOESN'T CATCH:
 * ❌ Event handlers (use try/catch there)
 * ❌ Async code (use try/catch there)
 * ❌ Server-side rendering errors
 * ❌ Errors in the error boundary itself
 * 
 * WHY NEXT.JS FILE-BASED:
 * Next.js automatically creates error boundaries based on file location:
 * - app/error.js → Catches errors in entire app
 * - app/chat/error.js → Catches errors only in /chat route
 * - This file catches EVERYTHING not caught by route-specific boundaries
 * 
 * RESET FUNCTIONALITY:
 * The reset() function attempts to re-render the component tree that errored.
 * It's like a "try again" button without full page refresh.
 * React will attempt to render the component again from scratch.
 * 
 * USER EXPERIENCE PHILOSOPHY:
 * - Never show stack traces (confusing for non-developers)
 * - Never blame the user ("You caused an error")
 * - Always provide action (Try Again button)
 * - Always provide escape route (Back to Home link)
 * - Match app's aesthetic (dark mode, same styling)
 */

export default function Error({ error, reset }) {
  /**
   * ERROR LOGGING STRATEGY:
   * In development: Console logs are helpful
   * In production: Send to error tracking service (Sentry, LogRocket, etc.)
   * 
   * The digest is a hash of the error that Next.js generates
   * Useful for tracking the same error across multiple users
   */
  console.error('[Error Boundary] Caught error:', error);
  console.error('[Error Boundary] Error digest:', error.digest);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 
          ERROR HEADING:
          - Generic enough not to expose technical details
          - Empathetic tone (something went wrong, not you broke something)
          - Clear and direct
        */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Something went wrong
        </h2>
        
        {/* 
          ERROR MESSAGE:
          - Show error.message if available (often helpful)
          - Fallback to generic message if not
          - WHY show message: Helps users report issues ("it said...")
          - WHY fallback: Some errors have cryptic messages
          
          SECURITY NOTE:
          In production, you might want to hide error.message entirely
          to avoid exposing internal system details
        */}
        <p className="text-gray-400 mb-6">
          {error.message || "We encountered an unexpected error."}
        </p>
        
        {/* 
          PRIMARY ACTION: Try Again
          - Calls reset() to attempt re-render
          - Most errors are transient (network hiccup, race condition)
          - Users expect a "try again" option
          - Styled to match app's primary button
        */}
        <button
          onClick={reset}
          className="bg-white text-black px-6 py-3 rounded-xl hover:scale-105 transition font-medium"
        >
          Try Again
        </button>
        
        {/* 
          SECONDARY ACTION: Back to Home
          - Escape route if retry doesn't work
          - Lets user start over without browser back button
          - Less prominent than primary action (text link vs button)
          
          WHY <a> not <Link>:
          During error state, Next.js routing might be compromised
          Plain <a> tag guarantees navigation works
        */}
        <a
          href="/"
          className="block mt-4 text-gray-500 hover:text-gray-300 transition"
        >
          ← Back to Home
        </a>
        
        {/* 
          DEVELOPMENT-ONLY DEBUG INFO:
          In production, you might want to add:
          - Error ID/digest (for support tickets)
          - Timestamp
          - Contact support link
          
          Example:
          <p className="text-xs text-gray-600 mt-8">
            Error ID: {error.digest}
          </p>
        */}
      </div>
    </div>
  )
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * TESTING THIS ERROR BOUNDARY
 * ════════════════════════════════════════════════════════════════════════
 * 
 * TEST 1: Throw error in component
 * Add this to any component:
 * useEffect(() => { throw new Error('Test error') }, [])
 * 
 * Expected: See this error screen, not white screen of death
 * 
 * TEST 2: Reset functionality
 * Click "Try Again" button
 * Expected: Component attempts to re-render
 * 
 * TEST 3: Navigation
 * Click "Back to Home"
 * Expected: Navigate to landing page (even if routing is broken)
 * 
 * ════════════════════════════════════════════════════════════════════════
 * PRODUCTION IMPROVEMENTS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * 1. Add error tracking:
 *    - Integrate Sentry: Sentry.captureException(error)
 *    - Log to analytics: analytics.track('Error Occurred', { ... })
 * 
 * 2. Add user feedback:
 *    - "Report a problem" button
 *    - Collect user's description of what they were doing
 *    - Email support team
 * 
 * 3. Smart retry:
 *    - Track retry count (don't let user retry infinitely)
 *    - After 3 retries, suggest different action
 * 
 * 4. Contextual help:
 *    - If network error: "Check your internet connection"
 *    - If API error: "Our servers are having issues"
 *    - Detect error type and show specific guidance
 */

