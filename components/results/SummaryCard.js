'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * SUMMARY CARD - One-Sentence Opener
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ENGAGEMENT PSYCHOLOGY:
 * 
 * WHY start with one sentence:
 * - Sets expectations without overwhelming
 * - Creates curiosity about details
 * - Gives user context for what's coming
 * - Respects attention span (TL;DR for busy founders)
 * 
 * WHY large text:
 * - Easy to read at a glance
 * - Feels important (not buried in paragraph)
 * - Works well on mobile (no squinting)
 * - Creates visual breathing room
 * 
 * WHY emoji as visual anchor:
 * - Provides emotional context at a glance
 * - Breaks up text monotony
 * - Universal symbol (no language barrier)
 * - Feels friendly, not corporate
 * 
 * DESIGN PATTERN:
 * This follows the "headline → summary → details" information hierarchy
 * Used by Apple keynotes, TechCrunch articles, Medium posts
 */

export function SummaryCard({ summary }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      
      {/* 
        TITLE/HEADLINE
        
        WHY this specific text:
        - "Here's what I found..." = conversational, personal
        - Sets up the summary sentence
        - Creates anticipation
        
        Removed emoji for cleaner, professional look
        
        MOBILE OPTIMIZATION:
        - Responsive text sizing
        - Adjusted spacing
        - Added horizontal padding
      */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-10 leading-tight px-4">
        Here's what I found
      </h2>

      {/* 
        ONE-SENTENCE SUMMARY
        
        ELEVATED DESIGN:
        - Subtle card background
        - Extra padding for emphasis
        - Border for definition
        - Feels more polished than plain text
        
        TYPOGRAPHY DECISIONS:
        - 2xl-3xl: Large but readable
        - text-gray-200: High contrast for readability
        - leading-relaxed: Extra line-height
        - font-normal: Readable weight
        
        MOBILE OPTIMIZATION:
        - Responsive padding (p-6 sm:p-8 md:p-10)
        - Responsive text size (text-lg sm:text-xl md:text-2xl lg:text-3xl)
        - Responsive border radius
      */}
      <div className="bg-[#111111] border border-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10">
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 leading-relaxed">
          {summary}
        </p>
      </div>

    </div>
  )
}

