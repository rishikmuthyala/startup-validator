'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * FULL REPORT - Scrollable Summary View
 * ════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN PHILOSOPHY:
 * 
 * WHY provide full report after story:
 * - Some users want to scan everything at once
 * - Reference material (bookmark, print, screenshot)
 * - Skimmers vs readers (respect different styles)
 * - Feels complete (not hiding information)
 * 
 * WHY staggered section reveals:
 * - Makes page load feel dynamic (not static dump)
 * - Guides reading order (top to bottom)
 * - Each section "earns" attention as it appears
 * - Premium feel (Linear, Apple product pages)
 * 
 * TIMING STRATEGY:
 * - Score: 0ms (appears immediately)
 * - Summary: +100ms
 * - Promising: +100ms
 * - Reality: +100ms
 * - etc.
 * Total: ~700ms for all sections
 * Fast enough to not annoy, slow enough to feel intentional
 * 
 * COMPONENT ARCHITECTURE:
 * - Single scrollable page (not paginated)
 * - Uses Section helper component (DRY principle)
 * - Accepts full analysis object
 * - Provides actions (share, start over)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function FullReport({ analysis, onReviewStory }) {
  const router = useRouter()
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)

  /**
   * Handle Share Results
   * 
   * FLOW:
   * 1. Get conversation from localStorage
   * 2. Call /api/share with analysis + conversation
   * 3. Receive shareable URL
   * 4. Copy to clipboard
   * 5. Show success toast
   * 6. Display share URL and social buttons
   */
  const handleShare = async () => {
    setIsSharing(true)

    try {
      // Get conversation history
      const conversationStr = localStorage.getItem('conversation_history')
      if (!conversationStr) {
        toast.error('No conversation found. Please complete a validation first.')
        setIsSharing(false)
        return
      }

      const conversation = JSON.parse(conversationStr)

      // Call share API
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, conversation })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to share results')
      }

      const data = await response.json()

      // Set URL first (so it's visible even if clipboard fails)
      setShareUrl(data.url)

      // Try to copy to clipboard (might fail due to permissions)
      try {
        await navigator.clipboard.writeText(data.url)
        toast.success('Link copied to clipboard!')
      } catch (clipboardError) {
        // Clipboard failed, but URL is still available
        console.warn('[Share] Clipboard access denied:', clipboardError)
        toast.success('Share link generated! Copy it below.')
      }

    } catch (error) {
      console.error('[Share] Error:', error)
      toast.error(error.message || 'Failed to share results. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  /**
   * Handle Start Over
   * 
   * FLOW:
   * 1. Clear localStorage (conversation, analysis)
   * 2. Redirect to home page
   * 3. User can start fresh validation
   */
  const handleStartOver = () => {
    // Clear all stored data
    localStorage.removeItem('conversation_history')
    localStorage.removeItem('startup_analysis')
    localStorage.removeItem('conversation_id')
    localStorage.removeItem('chat_history')
    localStorage.removeItem('saved_conversation')

    // Show confirmation
    toast.success('Ready for a new validation!')

    // Redirect to home
    router.push('/')
  }
  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        
        {/* 
          HEADER SECTION
          
          WHY "Review story mode" link:
          - Allows going back without losing progress
          - Some users might want to see animations again
          - Respects user agency
          
          MOBILE OPTIMIZATION:
          - Responsive spacing (mb-10 sm:mb-16)
          - Responsive text sizes
        */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Full Analysis
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
              Here's everything we covered
            </p>
            <button
              onClick={onReviewStory}
              className="text-gray-500 hover:text-gray-300 transition-colors text-xs sm:text-sm"
            >
              ← Review story mode
            </button>
          </motion.div>
        </div>

        {/* 
          SCORE SUMMARY CARD
          
          WHY show score at top:
          - Most important metric (TL;DR)
          - Sets context for everything below
          - Easy to share (screenshot this)
          
          MOBILE OPTIMIZATION:
          - Responsive padding (p-8 sm:p-12)
          - Responsive text size for score
          - Responsive spacing (mb-6 sm:mb-8)
        */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-[#111111] border border-gray-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center mb-6 sm:mb-8"
        >
          <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-3">
            {analysis.score}
          </div>
          <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-[#1A1A1A] border border-gray-700 rounded-full">
            <span className="text-sm sm:text-base text-gray-300">{analysis.verdict}</span>
          </div>
        </motion.div>

        {/* 
          ALL SECTIONS
          
          Each section uses the Section helper component
          Delays are staggered (0.2s, 0.3s, 0.4s, etc.)
          
          MOBILE OPTIMIZATION:
          - Adjusted spacing (space-y-4 sm:space-y-6)
        */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* ONE-SENTENCE SUMMARY */}
          <Section title="Summary" delay={0.2}>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed">
              {analysis.summary}
            </p>
          </Section>

          {/* WHAT'S PROMISING (conditional) */}
          {analysis.promising && analysis.promising.length > 0 && (
            <Section title="What's Promising" delay={0.3}>
              <div className="space-y-2.5 sm:space-y-3">
                {analysis.promising.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed flex-1">{point}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* THE REALITY */}
          <Section title="The Reality" delay={0.4}>
            <div className="space-y-2.5 sm:space-y-3">
              {analysis.reality.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed flex-1">{point}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* COMPETITORS (conditional) */}
          {analysis.competitors && analysis.competitors.length > 0 && (
            <Section title="Competitors" delay={0.5}>
              <div className="space-y-2.5 sm:space-y-3">
                {analysis.competitors.map((comp, i) => (
                  <a
                    key={i}
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 sm:p-4 bg-[#1A1A1A] border border-gray-800 rounded-lg sm:rounded-xl hover:border-gray-700 transition-all"
                  >
                    <p className="text-sm sm:text-base text-white font-semibold mb-1 break-words">{comp.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm break-words">{comp.description}</p>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* PIVOT IDEAS (conditional - only if score < 70) */}
          {analysis.pivotIdeas && analysis.pivotIdeas.length > 0 && (
            <Section title="How to Fix This" delay={0.6}>
              <div className="space-y-2.5 sm:space-y-3">
                {analysis.pivotIdeas.map((idea, i) => (
                  <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed flex-1">{idea}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* NEXT STEPS */}
          <Section title="Next Steps" delay={0.7}>
            <div className="space-y-2.5 sm:space-y-3">
              {analysis.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-black">{i + 1}</span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed flex-1">{step}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>

        {/* 
          ACTION BUTTONS
          
          WHY two buttons:
          - Share: Promotes organic growth
          - Start Over: Clear path to validate another idea
          
          WHY flex-col sm:flex-row:
          - Stack on mobile (easier to tap)
          - Side-by-side on desktop (more compact)
          
          MOBILE OPTIMIZATION:
          - Adjusted spacing (mt-8 sm:mt-12)
          - Responsive button padding
          - Touch-friendly button sizes
        */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 sm:mt-12 space-y-4"
        >
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 bg-white text-black font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating Link...
                </>
              ) : shareUrl ? (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 20 20" fill="none">
                    <path d="M16.5 7L8.5 15L4.5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Copied!
                </>
              ) : (
                'Share Results →'
              )}
            </button>
            <button 
              onClick={handleStartOver}
              className="flex-1 bg-[#111111] border border-gray-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base hover:bg-[#1A1A1A] transition-all"
            >
              Start Over
            </button>
          </div>

          {/* Share URL display (appears after sharing) */}
          {shareUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-[#111111] border border-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Share URL */}
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-2">Share this link:</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-gray-300 text-xs sm:text-sm focus:outline-none focus:border-gray-600"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl)
                        toast.success('Link copied!')
                      }}
                      className="px-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-gray-300 hover:bg-[#222222] transition-all text-xs sm:text-sm whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Social share buttons */}
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">Or share on:</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* LinkedIn */}
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0077B5] text-white rounded-lg hover:bg-[#006399] transition-all text-xs sm:text-sm font-medium"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>

                    {/* X (Twitter) */}
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`I validated my startup idea and got a ${analysis.score}/100! Check it out:`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-gray-700 text-white rounded-lg hover:bg-gray-900 transition-all text-xs sm:text-sm font-medium"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X (Twitter)
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  )
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * SECTION HELPER COMPONENT
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHY create this helper:
 * - DRY principle (Don't Repeat Yourself)
 * - Consistent styling across all sections
 * - Consistent animation timing
 * - Easy to maintain (change once, updates everywhere)
 * 
 * PROPS:
 * - title: Section heading
 * - icon: Optional emoji
 * - children: Content (text, list, etc.)
 * - delay: Animation delay (for stagger effect)
 * 
 * MOBILE OPTIMIZATION:
 * - Responsive padding
 * - Responsive title size
 * - Responsive spacing
 */
function Section({ 
  title, 
  children, 
  delay = 0 
}) {
  return (
    <motion.div
      /**
       * STAGGERED ANIMATION:
       * - Each section fades in + slides up
       * - Delay prop creates stagger effect
       * - Once animation completes, stays in view
       */
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-[#111111] border border-gray-800 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8"
    >
      {/* 
        SECTION HEADER
        
        Removed icon prop - cleaner look
        
        MOBILE OPTIMIZATION:
        - Responsive text size (text-xl sm:text-2xl)
        - Responsive bottom margin (mb-4 sm:mb-6)
      */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
        {title}
      </h2>
      
      {/* 
        SECTION CONTENT
        
        Accepts any React children:
        - Paragraph (<p>)
        - List (<ul> or <ol>)
        - Custom components
        
        Styling is handled by parent (this component)
      */}
      {children}
    </motion.div>
  )
}

