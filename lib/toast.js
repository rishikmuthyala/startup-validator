/**
 * ════════════════════════════════════════════════════════════════════════
 * TOAST NOTIFICATIONS - Non-Blocking User Feedback
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHAT ARE TOASTS:
 * Small notification messages that appear temporarily, then auto-dismiss.
 * Named after toast popping out of a toaster (brief, noticeable, goes away).
 * 
 * WHY TOASTS OVER MODALS:
 * ✅ Non-blocking (user can keep working)
 * ✅ Auto-dismiss (no "OK" button needed)
 * ✅ Less intrusive (doesn't take over screen)
 * ✅ Better for quick feedback (copied, saved, error)
 * 
 * WHEN TO USE TOASTS:
 * ✅ Success confirmations (copied to clipboard, link shared)
 * ✅ Non-critical errors (API failed, try again)
 * ✅ Quick status updates (saving, syncing)
 * 
 * WHEN NOT TO USE TOASTS:
 * ❌ Critical errors (payment failed - use modal)
 * ❌ Complex messages (too much text - use modal)
 * ❌ Actions that need confirmation (delete account - use modal)
 * ❌ Multi-step processes (use progress bar)
 * 
 * POSITIONING STRATEGY:
 * - bottom-center: Mobile-friendly (thumb-accessible)
 * - Top notifications feel like interruptions
 * - Bottom feels like confirmations
 * 
 * AUTO-DISMISS TIMING:
 * - Success: 2-3 seconds (quick confirmation)
 * - Error: 4-5 seconds (more time to read)
 * - Info: 3 seconds (neutral)
 * 
 * react-hot-toast handles this automatically based on type
 */

import toast from 'react-hot-toast'

// ═══════════════════════════════════════════════════════════════════════
// SUCCESS TOAST - Positive Feedback
// ═══════════════════════════════════════════════════════════════════════

/**
 * Shows success message with green accent
 * 
 * USAGE EXAMPLES:
 * - showSuccess('Copied to clipboard!')
 * - showSuccess('Link shared successfully')
 * - showSuccess('Analysis saved')
 * 
 * DESIGN CHOICES:
 * - Dark background (#111): Matches app's dark theme
 * - White text: High contrast, readable
 * - Subtle border (#333): Defines edge without being loud
 * - Auto-dismiss: 2 seconds (default for success)
 * 
 * WHY NO GREEN BACKGROUND:
 * Using subtle styling instead of loud green backgrounds
 * The checkmark icon (from react-hot-toast) provides the visual cue
 * Keeps it elegant and matches your premium aesthetic
 * 
 * @param {string} message - Success message to display
 */
export const showSuccess = (message) => {
  toast.success(message, {
    style: {
      background: '#111',
      color: '#fff',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '16px',
    },
    // Checkmark icon style
    iconTheme: {
      primary: '#10b981', // Green-500
      secondary: '#fff',
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR TOAST - Problem Notification
// ═══════════════════════════════════════════════════════════════════════

/**
 * Shows error message with red accent
 * 
 * USAGE EXAMPLES:
 * - showError('Failed to load conversation')
 * - showError('Something went wrong, try again')
 * - showError('Connection lost')
 * 
 * DESIGN CHOICES:
 * - Red border (#f87171): Signals error clearly
 * - Same dark theme: Consistency
 * - Auto-dismiss: 4 seconds (more time to read)
 * 
 * USER MESSAGE PHILOSOPHY:
 * Never show technical error messages in toasts:
 * ❌ "Failed to fetch: TypeError at line 42"
 * ✅ "Something went wrong, please try again"
 * 
 * Save technical details for console logs (developers only)
 * 
 * @param {string} message - User-friendly error message
 */
export const showError = (message) => {
  toast.error(message, {
    style: {
      background: '#111',
      color: '#fff',
      border: '1px solid #f87171', // Red-400
      borderRadius: '12px',
      padding: '16px',
    },
    // X icon style
    iconTheme: {
      primary: '#f87171', // Red-400
      secondary: '#fff',
    },
    // Errors stay longer (more critical)
    duration: 4000,
  })
}

// ═══════════════════════════════════════════════════════════════════════
// INFO TOAST - Neutral Information
// ═══════════════════════════════════════════════════════════════════════

/**
 * Shows informational message with blue accent
 * 
 * USAGE EXAMPLES:
 * - showInfo('Analysis will take about 10 seconds')
 * - showInfo('Your conversation has been saved')
 * - showInfo('Refreshing competitor data...')
 * 
 * DESIGN CHOICES:
 * - Blue border: Neutral, informative
 * - Standard duration: 3 seconds
 * 
 * @param {string} message - Information to display
 */
export const showInfo = (message) => {
  toast(message, {
    style: {
      background: '#111',
      color: '#fff',
      border: '1px solid #60a5fa', // Blue-400
      borderRadius: '12px',
      padding: '16px',
    },
    icon: 'ℹ️',
    duration: 3000,
  })
}

// ═══════════════════════════════════════════════════════════════════════
// LOADING TOAST - Persistent Until Dismissed
// ═══════════════════════════════════════════════════════════════════════

/**
 * Shows loading toast that stays until manually dismissed
 * 
 * USAGE PATTERN:
 * const toastId = showLoading('Analyzing your idea...')
 * // ... do async work ...
 * toast.dismiss(toastId)
 * showSuccess('Analysis complete!')
 * 
 * WHY MANUAL DISMISS:
 * Loading operations have unknown duration
 * Toast should stay until operation completes
 * Then dismiss and show result (success/error)
 * 
 * WHEN TO USE:
 * - Long API calls (analysis generation)
 * - File uploads
 * - Background processing
 * 
 * @param {string} message - Loading message
 * @returns {string} Toast ID (use to dismiss later)
 */
export const showLoading = (message) => {
  return toast.loading(message, {
    style: {
      background: '#111',
      color: '#fff',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '16px',
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════
// PROMISE TOAST - Auto-Handles Async Operations
// ═══════════════════════════════════════════════════════════════════════

/**
 * Shows loading → success/error based on promise result
 * 
 * USAGE EXAMPLE:
 * showPromise(
 *   fetch('/api/analyze'),
 *   {
 *     loading: 'Analyzing your idea...',
 *     success: 'Analysis complete!',
 *     error: 'Analysis failed, try again'
 *   }
 * )
 * 
 * WHY THIS IS POWERFUL:
 * - Automatically handles all three states
 * - Less code (no manual dismiss)
 * - Consistent UX (always shows result)
 * 
 * WHEN TO USE:
 * - API calls with clear outcomes
 * - Operations that can succeed or fail
 * - When you want automatic state management
 * 
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for each state
 * @returns {Promise} Original promise (chainable)
 */
export const showPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      style: {
        background: '#111',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '16px',
      },
    }
  )
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLES IN YOUR APP
 * ════════════════════════════════════════════════════════════════════════
 * 
 * EXAMPLE 1: Copy to Clipboard (Results Page)
 * ────────────────────────────────────────────────────────────────────────
 * import { showSuccess, showError } from '@/lib/toast';
 * 
 * const handleCopyLink = () => {
 *   try {
 *     navigator.clipboard.writeText(shareUrl);
 *     showSuccess('Link copied to clipboard!');
 *   } catch (error) {
 *     showError('Failed to copy link');
 *   }
 * };
 * 
 * 
 * EXAMPLE 2: API Error Handling (Chat Page)
 * ────────────────────────────────────────────────────────────────────────
 * import { showError } from '@/lib/toast';
 * 
 * try {
 *   const response = await fetch('/api/chat', {...});
 *   if (!response.ok) throw new Error();
 * } catch (error) {
 *   showError('Failed to get AI response, please try again');
 * }
 * 
 * 
 * EXAMPLE 3: Promise-Based Analysis
 * ────────────────────────────────────────────────────────────────────────
 * import { showPromise } from '@/lib/toast';
 * 
 * showPromise(
 *   fetch('/api/analyze', { method: 'POST', body: ... }),
 *   {
 *     loading: 'Generating analysis...',
 *     success: 'Analysis ready!',
 *     error: 'Analysis failed, try again'
 *   }
 * );
 * 
 * 
 * EXAMPLE 4: Manual Loading Control
 * ────────────────────────────────────────────────────────────────────────
 * import { showLoading, showSuccess, showError } from '@/lib/toast';
 * import toast from 'react-hot-toast';
 * 
 * const toastId = showLoading('Searching for competitors...');
 * 
 * try {
 *   const competitors = await searchBrave(query);
 *   toast.dismiss(toastId);
 *   showSuccess(`Found ${competitors.length} competitors`);
 * } catch (error) {
 *   toast.dismiss(toastId);
 *   showError('Failed to search competitors');
 * }
 * 
 * ════════════════════════════════════════════════════════════════════════
 * ADVANCED PATTERNS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PATTERN 1: Chained Operations
 * ────────────────────────────────────────────────────────────────────────
 * const toastId = showLoading('Step 1: Searching...');
 * await step1();
 * 
 * toast.loading('Step 2: Analyzing...', { id: toastId }); // Update same toast
 * await step2();
 * 
 * toast.success('Complete!', { id: toastId }); // Final update
 * 
 * 
 * PATTERN 2: Conditional Messages
 * ────────────────────────────────────────────────────────────────────────
 * showPromise(
 *   saveAnalysis(),
 *   {
 *     loading: 'Saving...',
 *     success: (data) => `Saved with ID: ${data.id}`,
 *     error: (err) => `Error: ${err.message}`
 *   }
 * );
 * 
 * 
 * PATTERN 3: Dismiss All Toasts (on Navigation)
 * ────────────────────────────────────────────────────────────────────────
 * import toast from 'react-hot-toast';
 * 
 * // When leaving page
 * router.push('/results');
 * toast.dismiss(); // Clear all toasts
 * 
 * ════════════════════════════════════════════════════════════════════════
 * ACCESSIBILITY NOTES
 * ════════════════════════════════════════════════════════════════════════
 * 
 * react-hot-toast includes:
 * ✅ aria-live="polite" (screen readers announce)
 * ✅ role="status" (semantic meaning)
 * ✅ Keyboard navigation (Tab to focus, Esc to dismiss)
 * ✅ Reduced motion support (respects prefers-reduced-motion)
 * 
 * NO ADDITIONAL SETUP NEEDED - Works out of the box!
 * 
 * ════════════════════════════════════════════════════════════════════════
 * BEST PRACTICES
 * ════════════════════════════════════════════════════════════════════════
 * 
 * DO:
 * ✅ Keep messages short (< 50 characters ideal)
 * ✅ Use action words ("Copied!", "Saved!", "Failed")
 * ✅ Match your app's tone (casual vs formal)
 * ✅ Test on mobile (toasts should be thumb-accessible)
 * 
 * DON'T:
 * ❌ Show multiple toasts at once (overwhelming)
 * ❌ Use for critical information (use modal)
 * ❌ Include buttons (toasts aren't interactive)
 * ❌ Show technical error messages (user-friendly only)
 * 
 * ════════════════════════════════════════════════════════════════════════
 * TESTING TOASTS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * Create a test page to preview all toast types:
 * 
 * import * as toasts from '@/lib/toast';
 * 
 * <button onClick={() => toasts.showSuccess('Test success!')}>
 *   Success
 * </button>
 * <button onClick={() => toasts.showError('Test error!')}>
 *   Error
 * </button>
 * <button onClick={() => toasts.showInfo('Test info!')}>
 *   Info
 * </button>
 */

