'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * FOLLOW-UP CHAT - Q&A Interface
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ENGAGEMENT PSYCHOLOGY:
 * 
 * WHY allow follow-up questions:
 * - Users always have more questions after analysis
 * - Clarification increases confidence in results
 * - Creates ongoing value (not one-and-done tool)
 * - Feels conversational (not transactional)
 * 
 * MESSAGE BUBBLE ALIGNMENT:
 * - User messages: Right side (iMessage, WhatsApp pattern)
 * - AI messages: Left side (established convention)
 * - Max width 80%: Prevents bubbles from spanning full width
 * 
 * TYPING INDICATOR:
 * - Sets expectations (AI is "thinking")
 * - Reduces perceived wait time
 * - Provides feedback (request was received)
 * - Standard pattern (Slack, iMessage, ChatGPT)
 * 
 * SUGGESTED QUESTIONS:
 * - Reduces friction (don't have to think what to ask)
 * - Shows what's possible (discovery)
 * - Fills empty space (not just blank input)
 * - Can click to auto-fill (faster than typing)
 * 
 * COMPONENT ARCHITECTURE:
 * - Local state for messages and input
 * - Calls /api/followup with question + analysis context
 * - AnimatePresence for smooth message appearance
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function FollowUpChat({ analysis }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * HANDLE SUBMIT FUNCTION
   * 
   * FLOW:
   * 1. Validate input (not empty, not already loading)
   * 2. Add user message to state immediately
   * 3. Clear input field
   * 4. Call API with question + analysis + previous messages
   * 5. Add AI response to state
   * 6. Handle errors gracefully
   * 
   * WHY add user message immediately:
   * - Provides instant feedback (feels responsive)
   * - Shows request was received
   * - Standard chat UI pattern
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('') // Clear input immediately
    setIsLoading(true)

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      /**
       * API CALL
       * 
       * PAYLOAD:
       * - analysis: Full analysis object (for context)
       * - question: User's new question
       * - previousMessages: Conversation history (for context)
       * 
       * WHY send full analysis:
       * - AI needs context to answer accurately
       * - Questions often reference specific points
       * - Maintains conversation continuity
       */
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          question: userMessage,
          previousMessages: messages,
        }),
      })

      const data = await response.json()

      // Add AI response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer 
      }])
    } catch (error) {
      console.error('Follow-up error:', error)
      
      /**
       * ERROR HANDLING
       * 
       * WHY friendly error message:
       * - Don't expose technical details
       * - Suggest retry (might be temporary)
       * - Maintains conversational tone
       */
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble with that. Can you try again?'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-16 border-t border-gray-900 pt-16">
      
      {/* 
        HEADER
        
        Sets context for this section
      */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-3">
          Have Questions?
        </h2>
        <p className="text-gray-400">
          Ask me anything about your analysis
        </p>
      </div>

      {/* 
        MESSAGES DISPLAY
        
        WHY max-w-3xl:
        - Comfortable reading width
        - Matches other content sections
        - Prevents super-wide bubbles
        
        CONDITIONAL RENDER:
        - Only show if there are messages
        - Saves space when empty
      */}
      {messages.length > 0 && (
        <div className="space-y-6 mb-8 max-w-3xl mx-auto">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* 
                  MESSAGE BUBBLE
                  
                  ALIGNMENT:
                  - User: Right side (justify-end)
                  - AI: Left side (justify-start)
                  
                  STYLING DIFFERENCES:
                  - User: Mid-gray background
                  - AI: Dark gray background (slightly darker)
                  - Max width 80% (prevents spanning full width)
                  - Rounded-2xl (iOS message bubble style)
                */}
                <div className={`max-w-[80%] rounded-2xl p-6 ${
                  msg.role === 'user'
                    ? 'bg-[#1A1A1A] border border-gray-800'
                    : 'bg-[#111111] border border-gray-700'
                }`}>
                  <p className="text-gray-200 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 
            TYPING INDICATOR
            
            WHEN SHOWN: isLoading === true
            
            WHY three dots:
            - Universal "thinking" symbol
            - Used by iMessage, Slack, ChatGPT
            - Bouncing animation shows activity
            
            ANIMATION:
            - Each dot bounces independently
            - Staggered delays (0, 0.2s, 0.4s)
            - Creates "wave" effect
          */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#111111] border border-gray-700 rounded-2xl px-6 py-4">
                <div className="flex space-x-2">
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i}
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" 
                      style={{ animationDelay: `${i * 0.2}s` }} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 
        INPUT FORM
      */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          
          {/* 
            TEXT INPUT
            
            WHY relative positioning:
            - Allows button to position inside (absolute)
            - Creates integrated input+button UI
            
            WHY pr-24 (padding-right):
            - Makes room for button on right side
            - Prevents text from going under button
            
            DISABLED STATE:
            - Prevents input while loading
            - Visual feedback (opacity-50)
          */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., How do I improve my score?"
            className="w-full bg-[#111111] border border-gray-800 rounded-xl px-6 py-4 text-white placeholder-gray-600 focus:border-gray-600 focus:outline-none pr-24"
            disabled={isLoading}
          />
          
          {/* 
            SUBMIT BUTTON
            
            POSITIONING:
            - absolute: Positions inside input
            - right-2: 8px from right edge
            - top-1/2 -translate-y-1/2: Vertically centered
            
            DISABLED STATE:
            - If input is empty
            - If currently loading
            - Visual feedback (opacity-30, cursor-not-allowed)
          */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Ask →
          </button>
        </form>

        {/* 
          SUGGESTED QUESTIONS
          
          WHEN SHOWN: messages.length === 0 (no conversation yet)
          
          WHY show suggestions:
          - Reduces blank space
          - Helps users discover what to ask
          - Reduces typing friction (click to fill)
          - Shows capability (not just free-form)
          
          INTERACTION:
          - Click fills input (doesn't submit immediately)
          - User can edit before submitting
          - Maintains user control
        */}
        {messages.length === 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {[
              'How do I improve my score?',
              'Why is monetization weak?',
              'Should I pivot or persist?',
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInput(suggestion)}
                className="px-4 py-2 bg-[#111111] border border-gray-800 text-gray-400 text-sm rounded-lg hover:border-gray-700 hover:text-gray-300 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

