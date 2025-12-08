'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * SCORE REVEAL ANIMATION - The Opening Moment
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ENGAGEMENT PSYCHOLOGY:
 * - Counting animation creates anticipation (dopamine hit watching numbers climb)
 * - Sequential reveal (score → verdict → auto-advance) maintains momentum
 * - Large typography = feeling of importance
 * - Auto-advance prevents "what do I click?" friction
 * 
 * ANIMATION TIMING EXPLANATION:
 * - 2 seconds for count-up: Fast enough to maintain interest, slow enough to feel significant
 * - 500ms delay before verdict: Let the final score "settle" psychologically
 * - 3 seconds total before advance: Enough time to process, not so long they get bored
 * 
 * EASING FUNCTION [0.16, 1, 0.3, 1]:
 * - This is a "smooth deceleration" curve (ease-out)
 * - Numbers accelerate at start, slow down at end
 * - Feels more natural than linear counting
 * - Standard in premium UX (Apple, Linear, Stripe)
 */

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export function ScoreReveal({ targetScore, verdict, onComplete }) {
  const [score, setScore] = useState(0)
  const [showVerdict, setShowVerdict] = useState(false)

  useEffect(() => {
    /**
     * COUNTING ANIMATION LOGIC:
     * 
     * WHY not use Framer Motion:
     * - Need integer display (not decimals)
     * - Want control over step timing
     * - simpler to understand for learning
     * 
     * HOW IT WORKS:
     * - Divide total time into 60 steps (smooth but not too many)
     * - Calculate increment per step
     * - Use setInterval to update every stepDuration ms
     * - Clear interval when target reached
     */
    const duration = 2000 // 2 seconds total
    const steps = 60 // 60 frames = ~30fps (smooth to human eye)
    const increment = targetScore / steps
    const stepDuration = duration / steps // ~33ms per step

    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= targetScore) {
        setScore(targetScore)
        clearInterval(interval)
        
        /**
         * SEQUENTIAL REVEAL TIMING:
         * - Wait 500ms for score to "settle"
         * - Then show verdict badge
         * - Then wait 2.5s more before auto-advancing
         * Total: 3s on this screen
         */
        setTimeout(() => setShowVerdict(true), 500)
        setTimeout(onComplete, 3000)
      } else {
        setScore(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [targetScore, onComplete])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 sm:px-6">
      <div className="text-center">
        
        {/* 
          ANIMATED SCORE DISPLAY
          
          WHY so large (10rem = 160px):
          - Dominates visual hierarchy
          - Easy to read from any distance
          - Creates drama and importance
          
          WHY initial scale 0.8:
          - "Pop in" effect feels more dynamic
          - Combined with opacity fade = premium reveal
          
          MOBILE OPTIMIZATION:
          - Responsive sizing (text-[7rem] sm:text-[10rem] md:text-[12rem])
          - Adjusted spacing (mb-6 sm:mb-8)
          - Ensures it fits on small screens without overflow
        */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-8"
        >
          <div className="text-[7rem] sm:text-[10rem] md:text-[12rem] font-bold text-white leading-none tracking-tighter">
            {score}
          </div>
          <div className="text-2xl sm:text-3xl md:text-4xl text-gray-600 font-light">
            / 100
          </div>
        </motion.div>

        {/* 
          VERDICT BADGE
          
          CONDITIONAL ANIMATION:
          - Only appears after score finishes counting
          - Fades in from below (y: 20 → 0)
          - Creates a "reveal" moment
          
          WHY pill shape:
          - Modern, used by Linear, Vercel, Apple
          - Feels less "button-y" than rectangle
          - Border adds subtle depth without color
          
          MOBILE OPTIMIZATION:
          - Responsive padding (px-6 sm:px-8, py-2.5 sm:py-3)
          - Responsive text size (text-base sm:text-lg md:text-xl)
          - Ensures readable on all screens
        */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showVerdict ? 1 : 0,
            y: showVerdict ? 0 : 20 
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-[#111111] border border-gray-800 rounded-full">
            <span className="text-base sm:text-lg md:text-xl text-gray-300 tracking-wide">
              {verdict}
            </span>
          </div>
        </motion.div>

        {/* 
          LOADING INDICATOR
          
          WHY show this:
          - Sets expectation that something is coming next
          - Reduces "now what?" confusion
          - Subtle enough not to distract from score/verdict
          
          ANIMATION DELAY:
          - Only appears after verdict is shown
          - Uses staggered delays (0, 0.2s, 0.4s) for wave effect
          - CSS animate-pulse provides continuous feedback
          
          MOBILE OPTIMIZATION:
          - Adjusted spacing (mt-8 sm:mt-12)
        */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showVerdict ? 1 : 0 }}
          transition={{ delay: 1 }}
          className="mt-8 sm:mt-12"
        >
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-gray-700 rounded-full animate-pulse" 
                style={{ animationDelay: `${i * 0.2}s` }} 
              />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}

