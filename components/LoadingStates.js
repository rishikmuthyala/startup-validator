/**
 * ════════════════════════════════════════════════════════════════════════
 * LOADING STATES - User Feedback During Async Operations
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHY LOADING STATES MATTER:
 * Research shows users tolerate waits better when:
 * 1. They know something is happening (not frozen)
 * 2. They have an estimate of duration
 * 3. The loading state matches the wait time
 * 
 * LOADING STATE PSYCHOLOGY:
 * - < 1s: No loader needed (feels instant)
 * - 1-3s: Small loader (button spinner, typing dots)
 * - 3-10s: Full loader with message
 * - > 10s: Progress bar or percentage
 * 
 * PATTERN GUIDE:
 * - TypingIndicator: Chat waiting for AI response (2-5s)
 * - AnalyzingLoader: Generating final analysis (10-15s)
 * - ButtonLoader: Form submission feedback (< 2s)
 * 
 * ANIMATION TIMING:
 * - Staggered dots: 150ms delay (creates wave effect)
 * - Spin duration: 1s (smooth, not dizzy)
 * - Pulse duration: 2s (gentle, not jarring)
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPING INDICATOR - For Chat Conversation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Shows animated dots to indicate AI is "thinking" about response
 * 
 * WHEN TO USE:
 * - Waiting for API response in chat
 * - User sent message, AI hasn't responded yet
 * - Short-to-medium waits (2-5 seconds)
 * 
 * WHY THREE DOTS:
 * - Universal "typing" indicator (iMessage, WhatsApp, Slack)
 * - Users immediately understand what it means
 * - Three is optimal (two looks incomplete, four is cluttered)
 * 
 * ANIMATION STRATEGY:
 * - Each dot bounces at different times (0ms, 150ms, 300ms)
 * - Creates wave effect that draws eye
 * - Shows system is actively working, not frozen
 * 
 * COLOR CHOICE:
 * - Purple-400: Matches your app's accent color
 * - Keeps brand consistency even in loading states
 */
export function TypingIndicator() {
  return (
    <div className="flex space-x-2 p-4">
      {/* 
        WHY inline style for animationDelay:
        Tailwind doesn't support custom animation delays
        Inline style is cleanest solution for one-off timing
      */}
      <div 
        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" 
        style={{ animationDelay: '0ms' }} 
      />
      <div 
        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" 
        style={{ animationDelay: '150ms' }} 
      />
      <div 
        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" 
        style={{ animationDelay: '300ms' }} 
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// FULL PAGE ANALYZING LOADER - For Long Operations
// ═══════════════════════════════════════════════════════════════════════

/**
 * Shows full-screen loader during analysis generation
 * 
 * WHEN TO USE:
 * - Generating final startup analysis (10-15s)
 * - Processing large amounts of data
 * - Operations where user must wait (no partial results)
 * 
 * WHY FULL SCREEN:
 * - Signals "big work happening"
 * - Prevents interaction during processing
 * - Centers user's attention
 * 
 * USER EXPECTATION MANAGEMENT:
 * "This takes about 10 seconds" - Critical addition!
 * Research shows users are 40% more patient when you tell them duration
 * Unknown waits feel 2x longer than known waits (psychological fact)
 * 
 * DESIGN CHOICES:
 * - Spinning circle: Universal loading indicator
 * - Gradient border: Matches app's premium aesthetic
 * - Blur effect: Creates depth, feels polished
 * - Dark background: Consistent with app theme
 */
export function AnalyzingLoader() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        {/* 
          SPINNER CONSTRUCTION:
          - Rounded border (full circle)
          - Top border transparent (creates gap)
          - Rotate animation (spins the gap around)
          - Purple color (brand consistency)
          
          WHY border-t-transparent:
          Creates the "gap" that spins around the circle
          Without it, you'd see a solid circle (no spin visible)
        */}
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        
        {/* Primary message: What's happening */}
        <p className="text-white text-xl">Analyzing your idea...</p>
        
        {/* 
          Duration estimate: Critical UX improvement
          Sets expectations and reduces perceived wait time
          
          WHY "about 10 seconds":
          - "about" reduces expectation of precision
          - Specific number (not "a moment") manages expectations
          - Accurate estimate builds trust
        */}
        <p className="text-gray-400 text-sm mt-2">This takes about 10 seconds</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// BUTTON LOADER - Inline Loading State
// ═══════════════════════════════════════════════════════════════════════

/**
 * Small spinner for button loading states
 * 
 * WHEN TO USE:
 * - Form submissions
 * - Button clicks that trigger API calls
 * - Quick operations (< 3 seconds)
 * 
 * WHY INLINE VS FULL SCREEN:
 * - Keeps context visible (user sees what they clicked)
 * - Doesn't block entire UI
 * - Feels faster (visual continuity)
 * 
 * BUTTON DISABLED PATTERN:
 * When showing this loader, ALWAYS disable the button:
 * <button disabled={isLoading}>
 *   {isLoading ? <ButtonLoader /> : 'Submit'}
 * </button>
 * 
 * WHY:
 * - Prevents double-submission
 * - Visual feedback that action was received
 * - Reduces server load from impatient clicks
 * 
 * SIZE:
 * - Small (w-4 h-4): Fits inside buttons
 * - White border: Contrasts with button background
 * - Thin border (2px): Doesn't overpower text
 */
export function ButtonLoader() {
  return (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// SKELETON LOADER - For Content Loading
// ═══════════════════════════════════════════════════════════════════════

/**
 * Placeholder while content loads (alternative to spinners)
 * 
 * WHEN TO USE:
 * - Loading results page
 * - Loading chat history
 * - Any content with known structure
 * 
 * WHY SKELETONS VS SPINNERS:
 * - Shows page structure (less jarring)
 * - Reduces layout shift
 * - Feels faster (partial content visible)
 * 
 * USAGE EXAMPLE:
 * {isLoading ? <ResultsSkeleton /> : <ResultsContent />}
 */
export function ResultsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-pulse">
      {/* Score skeleton */}
      <div className="h-32 bg-white/5 rounded-2xl mb-6" />
      
      {/* Sections skeleton */}
      <div className="space-y-4">
        <div className="h-24 bg-white/5 rounded-xl" />
        <div className="h-24 bg-white/5 rounded-xl" />
        <div className="h-24 bg-white/5 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * USAGE PATTERNS IN YOUR APP
 * ════════════════════════════════════════════════════════════════════════
 * 
 * CHAT PAGE (app/chat/page.js):
 * import { TypingIndicator, ButtonLoader } from '@/components/LoadingStates';
 * 
 * // In your conversation UI
 * {isThinking && <TypingIndicator />}
 * 
 * // In your submit button
 * <button disabled={isLoading}>
 *   {isLoading ? <ButtonLoader /> : 'Send'}
 * </button>
 * 
 * ────────────────────────────────────────────────────────────────────────
 * 
 * RESULTS PAGE (app/results/page.js):
 * import { AnalyzingLoader, ResultsSkeleton } from '@/components/LoadingStates';
 * 
 * // During analysis generation
 * {isAnalyzing && <AnalyzingLoader />}
 * 
 * // While loading saved results
 * {isLoadingResults ? <ResultsSkeleton /> : <ResultsContent />}
 * 
 * ────────────────────────────────────────────────────────────────────────
 * 
 * LANDING PAGE (app/page.js):
 * import { ButtonLoader } from '@/components/LoadingStates';
 * 
 * // On main CTA button
 * <button onClick={handleStart} disabled={isStarting}>
 *   {isStarting ? <ButtonLoader /> : 'Start Validation →'}
 * </button>
 * 
 * ════════════════════════════════════════════════════════════════════════
 * ANIMATION TIMING REFERENCE
 * ════════════════════════════════════════════════════════════════════════
 * 
 * Tailwind's animate-bounce:
 * - Duration: 1s
 * - Easing: cubic-bezier(0, 0, 0.2, 1)
 * - Motion: Up and down
 * 
 * Tailwind's animate-spin:
 * - Duration: 1s
 * - Easing: linear
 * - Motion: 360° rotation
 * 
 * Tailwind's animate-pulse:
 * - Duration: 2s
 * - Easing: cubic-bezier(0.4, 0, 0.6, 1)
 * - Motion: Opacity fade in/out
 * 
 * WHY THESE TIMINGS:
 * - 1s spin: Fast enough to show activity, slow enough not to cause nausea
 * - 2s pulse: Gentle, not distracting
 * - 150ms stagger: Perceptible wave, not too slow
 * 
 * ════════════════════════════════════════════════════════════════════════
 * ACCESSIBILITY NOTES
 * ════════════════════════════════════════════════════════════════════════
 * 
 * SCREEN READERS:
 * Add aria-live regions to announce loading states:
 * <div aria-live="polite" aria-busy="true">
 *   <TypingIndicator />
 * </div>
 * 
 * REDUCED MOTION:
 * Respect user's prefers-reduced-motion setting:
 * @media (prefers-reduced-motion: reduce) {
 *   .animate-spin { animation: none; }
 * }
 * 
 * COGNITIVE LOAD:
 * - Don't show multiple loaders simultaneously
 * - One active loading state at a time
 * - Clear what's loading (not just "Loading...")
 */

