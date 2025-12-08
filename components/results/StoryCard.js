'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * STORY CARD - Reusable Container for Each Stage
 * ════════════════════════════════════════════════════════════════════════
 * 
 * COMPONENT ARCHITECTURE:
 * - This is a "wrapper" component (accepts children)
 * - Provides consistent layout, progress, navigation
 * - Content (children) can be anything: text, cards, images
 * 
 * DESIGN DECISIONS:
 * 
 * 1. PROGRESS INDICATORS (Segmented bars at top):
 *    - Current segment: Longer (w-12) and white = visual focus
 *    - Past segments: Medium (w-8) and gray-600 = completed
 *    - Future segments: Medium (w-8) and gray-900 = upcoming
 *    
 *    WHY this pattern:
 *    - Instagram Stories uses similar pattern (familiar)
 *    - Variable width creates visual hierarchy
 *    - Shows progress AND position in one glance
 * 
 * 2. STAGGERED ANIMATION:
 *    - Card wrapper slides in first (from right)
 *    - Content inside fades in 0.2s later
 *    
 *    WHY stagger:
 *    - Single animation = boring
 *    - Two-step reveal = more polished, premium feel
 *    - Guides eye from container → content
 * 
 * 3. NAVIGATION LAYOUT:
 *    - Back button: Left, only if not first card
 *    - Next button: Right, always visible, primary action
 *    
 *    WHY this layout:
 *    - Reading direction (left = back, right = forward)
 *    - Next is bigger/bolder (primary action)
 *    - Space between = prevents misclicks
 */

import { motion } from 'framer-motion'

export function StoryCard({
  children,
  cardNumber,
  totalCards,
  onNext,
  onPrevious,
  nextLabel = 'Next'
}) {
  return (
    <motion.div
      /**
       * SLIDE-IN ANIMATION:
       * - Starts 100px to the right (x: 100) on desktop, 50px on mobile
       * - Slides to center (x: 0)
       * - Also fades in (opacity: 0 → 1)
       * 
       * EXIT ANIMATION:
       * - Slides out to left (x: -100) on desktop, -50px on mobile
       * - Fades out simultaneously
       * 
       * TIMING: 0.4s with smooth ease curve
       * Fast enough to feel snappy, slow enough to track visually
       * 
       * MOBILE OPTIMIZATION:
       * - Reduced slide distance on mobile for smoother feel
       */
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12"
    >
      <div className="w-full max-w-3xl">
        
        {/* 
          PROGRESS SECTION
          Shows which card you're on and how many remain
          
          MOBILE OPTIMIZATION:
          - Reduced bottom margin (mb-8 sm:mb-12)
        */}
        <div className="mb-8 sm:mb-12">
          
          {/* Segmented progress bars - mobile optimized */}
          <div className="flex justify-center space-x-1.5 sm:space-x-2 mb-3 sm:mb-4">
            {[...Array(totalCards)].map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === cardNumber - 1
                    ? 'w-10 sm:w-12 bg-white' // Current: longest and white, responsive
                    : i < cardNumber - 1
                    ? 'w-6 sm:w-8 bg-gray-600' // Past: medium and medium gray, responsive
                    : 'w-6 sm:w-8 bg-gray-900' // Future: medium and dark gray, responsive
                }`}
              />
            ))}
          </div>
          
          {/* Text indicator (e.g., "3 of 7") - mobile optimized */}
          <p className="text-center text-xs sm:text-sm text-gray-600">
            {cardNumber} of {totalCards}
          </p>
        </div>

        {/* 
          CARD CONTENT
          
          Delayed animation (0.2s after card wrapper)
          Creates staggered reveal effect
          
          MOBILE OPTIMIZATION:
          - Reduced animation delay for snappier feel on mobile
        */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          {children}
        </motion.div>

        {/* 
          NAVIGATION BUTTONS
          
          LAYOUT STRATEGY:
          - flex + justify-between spreads buttons to edges
          - gap-4 prevents touch target overlap on mobile
          - Back button conditionally rendered
          - Empty div maintains layout when no back button
          
          MOBILE OPTIMIZATION:
          - Adjusted spacing (mt-8 sm:mt-12)
          - Smaller gap on mobile (gap-3 sm:gap-4)
        */}
        <div className="flex items-center justify-between mt-8 sm:mt-12 gap-3 sm:gap-4">
          
          {/* 
            BACK BUTTON (Optional)
            
            Only shows if:
            1. onPrevious function exists
            2. Not on first card (cardNumber > 1)
            
            WHY secondary styling:
            - Dark gray background (less prominent)
            - Gray text (not white)
            - Smaller padding
            Makes it clear Next is the primary action
            
            MOBILE OPTIMIZATION:
            - Responsive padding and text size
            - Touch-friendly sizing (min 44px height)
          */}
          {onPrevious && cardNumber > 1 ? (
            <button
              onClick={onPrevious}
              className="px-4 sm:px-6 py-3 bg-[#111111] border border-gray-800 text-gray-400 text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-[#1A1A1A] hover:border-gray-700 transition-all"
            >
              ← Back
            </button>
          ) : (
            <div /> // Empty div to maintain layout
          )}

          {/* 
            NEXT BUTTON (Primary Action)
            
            WHY prominent styling:
            - White background (inverted, stands out on dark)
            - Black text (maximum contrast)
            - Larger padding (easier to hit)
            - ml-auto pushes to right even without back button
            
            HOVER EFFECTS:
            - Scale up slightly (1.02x) = feels responsive
            - Active state scales down (0.98x) = tactile feedback
            - Smooth transitions = polished feel
            
            MOBILE OPTIMIZATION:
            - Responsive padding (px-6 sm:px-8, py-3 sm:py-4)
            - Touch-friendly min height
            - Responsive text size
          */}
          <button
            onClick={onNext}
            className="ml-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-black text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {nextLabel} →
          </button>

        </div>

      </div>
    </motion.div>
  )
}

