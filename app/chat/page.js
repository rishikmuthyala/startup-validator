'use client';

/**
 * ════════════════════════════════════════════════════════════════════════
 * PREMIUM CHAT INTERFACE - One Question, Full Focus
 * ════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN PHILOSOPHY:
 * Typeform meets Linear - premium, focused, one question at a time.
 * No generic chatbot stacking. Pure focus on the current exchange.
 * 
 * VISUAL STYLE:
 * - Full-screen focus on current question
 * - Segmented arrow progress (8 segments, fills as you go)
 * - Large, centered typography
 * - Premium thinking state (gradient orb)
 * - Smooth fade transitions between questions
 * - Generous whitespace, refined palette
 * 
 * USER FLOW:
 * 1. User arrives from landing page with problem in URL
 * 2. Problem sent to API, first question loads
 * 3. Question appears centered, large, focused
 * 4. User answers → smooth fade out
 * 5. Premium thinking state → new question fades in
 * 6. Arrow segment fills in
 * 7. After 8 questions, redirect to /results
 * 
 * STATE MANAGEMENT STRATEGY:
 * - currentQuestion: What's displayed (not full history)
 * - conversationHistory: Stored for API context (not displayed)
 * - isThinking: Premium loading state between questions
 * - inputValue: User's current answer
 * - questionNumber: For segmented arrow progress
 * 
 * IMPORTANT FIX:
 * WHY Suspense wrapper: Next.js requires Suspense for components using useSearchParams
 * This prevents hydration errors and ensures proper server-side rendering
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { postJSON } from '@/lib/apiRetry';
import { handleError } from '@/lib/errors';
import { showError } from '@/lib/toast';

// ═══════════════════════════════════════════════════════════════════
// CHAT COMPONENT (Inner component that uses useSearchParams)
// ═══════════════════════════════════════════════════════════════════

function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  //const [listLength, setListLength] = useState(7);
   
  // ═══════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT - Refactored for One-at-a-Time UI
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * WHY currentQuestion: Only display what's currently being asked
   * Not showing message history = cleaner, more focused
   */
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  /**
   * WHY conversationHistory: Keep full context for API
   * Format matches OpenAI: [{ role: 'user'|'assistant', content: string }]
   * Stored but NOT displayed in UI
   */
  const [conversationHistory, setConversationHistory] = useState([]);
  
  /**
   * WHY isThinking: Premium loading state between questions
   * Shows gradient orb animation instead of typing dots
   */
  const [isThinking, setIsThinking] = useState(false);
  
  /**
   * WHY controlled input: User's current answer
   */
  const [inputValue, setInputValue] = useState('');
  
  /**
   * WHY questionNumber: For segmented arrow progress
   * Count how many questions we've asked (not including initial problem)
   */
  const questionNumber = conversationHistory.filter(m => m.role === 'assistant').length + 1;
  const totalQuestions = 8;
  
  // ═══════════════════════════════════════════════════════════════════
  // REFS
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * WHY isInitialized ref: Prevents double initialization in React StrictMode
   * In development, React deliberately runs effects twice to catch bugs
   * This ref ensures we only initialize the chat once
   */
  const isInitialized = useRef(false);

  // ═══════════════════════════════════════════════════════════════════
  // INITIAL SETUP - Get Problem from URL
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * WHY useEffect with empty deps: Runs once on mount
   * 
   * FLOW:
   * 1. Extract problem from URL params (?problem=...)
   * 2. If no problem, redirect back to landing page
   * 3. Add problem as first user message to history
   * 4. Immediately fetch first AI question
   * 5. Display that question (centered, focused)
   * 
   * WHY check localStorage: Backup if URL param is missing
   * (e.g., user refreshed page and params were lost)
   * 
   * WHY isInitialized check: Prevents double initialization in React StrictMode
   * React intentionally runs effects twice in development to catch bugs
   */
  useEffect(() => {
    // Guard against double initialization (React StrictMode in development)
    if (isInitialized.current) {
      return;
    }
    
    const initializeChat = async () => {
      // Mark as initialized before async operations
      isInitialized.current = true;
      
      /**
       * CRITICAL FIX: Clear old analysis from previous conversations
       * This ensures each new conversation generates fresh analysis
       * Without this, users see cached results from previous sessions
       */
      localStorage.removeItem('startup_analysis');
      localStorage.removeItem('conversation_history');
      
      // Get problem from URL params (sent from landing page)
      let problem = searchParams.get('problem');
      
      // Fallback to localStorage if URL param missing
      if (!problem) {
        problem = localStorage.getItem('startup_problem');
      }
    
      /**
       * ═══════════════════════════════════════════════════════════════
       * EDGE CASE: No Problem Provided
       * ═══════════════════════════════════════════════════════════════
       * 
       * SCENARIOS THIS CATCHES:
       * 1. User navigates directly to /chat (no URL param)
       * 2. User refreshed and localStorage was cleared
       * 3. Problem was too short (< 20 chars)
       * 4. Problem was removed/corrupted
       * 
       * WHY REDIRECT TO HOME:
       * - Can't have conversation without initial problem
       * - Better to restart than show broken UI
       * - Landing page explains what to do
       * 
       * MINIMUM LENGTH CHECK:
       * 20 characters is minimum viable problem statement
       * "AI app" (6 chars) → Too vague
       * "AI app for students to study better" (36 chars) → Good
       */
      if (!problem || problem.trim().length < 20) {
        console.log('[Chat Page] No valid problem, redirecting to home');
        showError('Please describe your startup idea to get started');
        router.push('/');
        return;
      }
      
      /**
       * ═══════════════════════════════════════════════════════════════
       * EDGE CASE: Problem Too Long
       * ═══════════════════════════════════════════════════════════════
       * 
       * WHY LIMIT LENGTH:
       * - API has token limits
       * - User probably pasted essay (not focused problem)
       * - Forces user to be concise (better validation)
       * 
       * MAX LENGTH: 1000 characters
       * Enough for detailed problem, not entire business plan
       */
      if (problem.length > 1000) {
        console.log('[Chat Page] Problem too long, redirecting to home');
        showError('Problem description too long. Please keep it under 1000 characters.');
        router.push('/');
        return;
      }
      
      // Add problem as first user message to conversation history
      const initialMessage = {
        role: 'user',
        content: problem
      };
      
      setConversationHistory([initialMessage]);
      
      // Immediately fetch first AI question
      await fetchAIResponse([initialMessage]);
    };
    
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount
  
  /**
   * ═══════════════════════════════════════════════════════════════════
   * EDGE CASE: Browser Back/Forward Button
   * ═══════════════════════════════════════════════════════════════════
   * 
   * PROBLEM:
   * User answers 3 questions → hits back button → conversation state lost
   * 
   * SOLUTION:
   * Save conversation to localStorage on every update
   * Restore from localStorage if found
   * 
   * WHY POPSTATE EVENT:
   * Fires when user uses browser navigation (back/forward)
   * Gives us chance to save state before leaving
   */
  useEffect(() => {
    const handlePopState = () => {
      // Save current conversation before leaving
      if (conversationHistory.length > 0) {
        localStorage.setItem('saved_conversation', JSON.stringify({
          history: conversationHistory,
          question: currentQuestion,
          timestamp: Date.now()
        }));
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [conversationHistory, currentQuestion]);
  
  /**
   * ═══════════════════════════════════════════════════════════════════
   * EDGE CASE: Page Refresh During Conversation
   * ═══════════════════════════════════════════════════════════════════
   * 
   * PROBLEM:
   * User accidentally refreshes → loses all progress
   * 
   * SOLUTION:
   * Auto-save conversation to localStorage
   * On mount, check if saved conversation exists
   * Restore if it's recent (< 30 minutes old)
   * 
   * WHY 30 MINUTES:
   * - Long enough for accidental refresh
   * - Short enough not to show stale data
   * - Matches typical session duration
   */
  useEffect(() => {
    const saved = localStorage.getItem('saved_conversation');
    if (saved && !isInitialized.current) {
      try {
        const data = JSON.parse(saved);
        const age = Date.now() - data.timestamp;
        
        // If saved conversation is < 30 minutes old, restore it
        if (age < 30 * 60 * 1000 && data.history.length > 0) {
          console.log('[Chat Page] Restoring conversation from refresh');
          setConversationHistory(data.history);
          setCurrentQuestion(data.question);
          // Don't mark as initialized so we don't trigger new conversation
        }
      } catch (error) {
        console.error('[Chat Page] Failed to restore conversation:', error);
      }
    }
  }, []);
  
  /**
   * ═══════════════════════════════════════════════════════════════════
   * AUTO-SAVE: Save Conversation on Every Update
   * ═══════════════════════════════════════════════════════════════════
   * 
   * WHY AUTO-SAVE:
   * Protects against unexpected page close/refresh
   * User never loses progress
   * 
   * THROTTLE CONSIDERATION:
   * Currently saves on every change
   * For production, consider throttling (save max once per second)
   */
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  // ═══════════════════════════════════════════════════════════════════
  // API INTEGRATION - Fetch AI Response
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Fetches next AI question based on conversation history
   * 
   * @param {Array} history - Array of message objects
   * 
   * FLOW:
   * 1. Set thinking state (shows premium loading)
   * 2. Call /api/chat with full conversation history
   * 3. API returns: { message: string, isComplete: boolean }
   * 4. If complete, redirect to /results
   * 5. If not, display new question (centered, focused)
   * 
   * WHY send full history: AI needs context to ask relevant follow-ups
   * WHY isComplete flag: Tells us when to stop asking questions
   */
  /**
   * ═══════════════════════════════════════════════════════════════════
   * IMPROVED API CALL WITH RETRY & ERROR HANDLING
   * ═══════════════════════════════════════════════════════════════════
   * 
   * IMPROVEMENTS OVER PREVIOUS VERSION:
   * 1. Uses postJSON with automatic retry (3 attempts)
   * 2. Specific error messages based on error type
   * 3. Toast notifications for errors
   * 4. Logs errors for debugging
   * 5. Graceful fallback question on error
   * 
   * ERROR HANDLING FLOW:
   * 1. Network error → Auto-retry 3 times → Show error if all fail
   * 2. Server error (500) → Auto-retry → Show error if all fail
   * 3. Client error (400) → Don't retry → Show error immediately
   * 4. Success → Update UI
   * 
   * USER EXPERIENCE:
   * - Most transient errors auto-fix (user never sees them)
   * - Only show error after retry exhausted
   * - Error toast + fallback question (conversation doesn't break)
   * - User can try again without refresh
   */
  const fetchAIResponse = async (history) => {
    setIsThinking(true);
    
    try {
      /**
       * IMPROVED FETCH:
       * - postJSON automatically stringifies body
       * - Automatic retry on transient errors (3 attempts)
       * - Exponential backoff (1s, 2s wait)
       * - Throws specific error types (NetworkError, APIError)
       */
      const data = await postJSON('/api/chat', {
        messages: history
      });
      
      /**
       * WHY check isComplete first: If conversation is done,
       * we should redirect BEFORE showing the message
       * 
       * The API will return isComplete: true after 8 questions
       */
      if (data.isComplete) {
        // Save conversation to localStorage for results page
        localStorage.setItem('conversation_history', JSON.stringify(history));
        
        // Redirect to results page
        router.push('/results');
        return;
      }
      
      /**
       * ═══════════════════════════════════════════════════════════════
       * EDGE CASE: Invalid API Response
       * ═══════════════════════════════════════════════════════════════
       * 
       * VALIDATE RESPONSE:
       * API should return { message: string, isComplete: boolean }
       * If message is missing or invalid, something is wrong
       * 
       * WHY CHECK THIS:
       * - Prevents undefined/null being shown to user
       * - Catches API bugs early
       * - Better error message than "undefined"
       */
      if (!data.message || typeof data.message !== 'string') {
        throw new Error('Invalid response from API');
      }
      
      // Create AI message object
      const aiMessage = {
        role: 'assistant',
        content: data.message
      };
      
      // Update conversation history (stored, not displayed)
      const updatedHistory = [...history, aiMessage];
      setConversationHistory(updatedHistory);
      
      // Display the new question (this is what user sees)
      setCurrentQuestion(data.message);
      
      // Save to localStorage as backup (in case of refresh)
      localStorage.setItem('chat_history', JSON.stringify(updatedHistory));
      
    } catch (error) {
      /**
       * ERROR HANDLING:
       * - Log full error for developers
       * - Translate to user-friendly message
       * - Show toast notification
       * - Display fallback question (don't break conversation)
       * 
       * WHY FALLBACK QUESTION:
       * Instead of blank screen or error message in question area,
       * show friendly message that allows user to continue
       * They can retry by submitting their answer again
       */
      console.error('[Chat Page] Error fetching AI response:', error);
      
      // Translate error to user-friendly message
      const errorMessage = handleError(error);
      
      // Show toast notification
      showError(errorMessage);
      
      // Show fallback question (conversation can continue)
      setCurrentQuestion(
        "I'm having trouble thinking right now. Could you try sending that again?"
      );
      
      /**
       * PRODUCTION IMPROVEMENT:
       * Track errors to analytics:
       * analytics.track('Chat API Error', {
       *   errorType: error.name,
       *   conversationLength: history.length,
       *   timestamp: Date.now()
       * });
       */
    } finally {
      // Always hide loading state (error or success)
      setIsThinking(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGE SUBMISSION HANDLER
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Handles user sending their answer
   * 
   * VALIDATION:
   * - Don't send if input is empty (just whitespace)
   * - Don't send if AI is currently thinking (isThinking)
   * 
   * FLOW:
   * 1. Create user message object
   * 2. Add to conversation history
   * 3. Clear input field and current question (fade out effect)
   * 4. Fetch next AI question with updated history
   * 5. New question fades in
   */
  /**
   * ═══════════════════════════════════════════════════════════════════
   * IMPROVED MESSAGE SUBMISSION WITH VALIDATION
   * ═══════════════════════════════════════════════════════════════════
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    /**
     * EDGE CASE: Empty or Whitespace-Only Input
     * 
     * WHY PREVENT:
     * - Wastes API call
     * - Confuses AI (empty message)
     * - Bad UX (nothing sent)
     * 
     * VALIDATION:
     * - Check if input exists
     * - Check if it's not just whitespace
     * - Check if not already sending (isThinking)
     */
    if (!inputValue.trim() || isThinking) return;
    
    /**
     * EDGE CASE: Input Too Short
     * 
     * WHY MINIMUM LENGTH:
     * - Single word answers are usually not helpful
     * - Forces user to elaborate
     * - Better validation quality
     * 
     * EXCEPTION:
     * Allow short answers for some questions (names, numbers)
     * Only enforce minimum for problem descriptions
     */
    const trimmedInput = inputValue.trim();
    if (trimmedInput.length < 3) {
      showError('Please provide a more detailed answer');
      return;
    }
    
    /**
     * EDGE CASE: Input Too Long
     * 
     * WHY MAXIMUM LENGTH:
     * - API has token limits
     * - User probably pasted something
     * - Encourages concise answers
     * 
     * MAX LENGTH: 500 characters
     * Enough for detailed answer, not essay
     */
    if (trimmedInput.length > 500) {
      showError('Answer too long. Please keep it under 500 characters.');
      return;
    }
    
    /**
     * EDGE CASE: Spam Prevention
     * 
     * WHY CHECK CONVERSATION LENGTH:
     * - Normal flow: 8 questions max (16 messages with answers)
     * - More than 20 messages = something wrong
     * - Prevents API abuse
     * 
     * This catches:
     * - User clicking repeatedly
     * - Automated scripts
     * - Infinite loops
     */
    if (conversationHistory.length > 20) {
      showError('Conversation too long. Please start a new conversation.');
      router.push('/');
      return;
    }
    
    // Create user message
    const userMessage = {
      role: 'user',
      content: trimmedInput
    };
    
    // Add to conversation history
    const updatedHistory = [...conversationHistory, userMessage];
    setConversationHistory(updatedHistory);
    
    // Clear input immediately (feels more responsive)
    setInputValue('');
    
    // Clear current question to trigger fade out
    // (AnimatePresence will handle the exit animation)
    setCurrentQuestion('');
    
    // Small delay to let fade out happen, then fetch next question
    setTimeout(async () => {
      await fetchAIResponse(updatedHistory);
    }, 300);
  };
  
  /**
   * Handle Enter key for submission
   * 
   * WHY: Better UX - Enter sends, Shift+Enter adds new line
   * This matches how modern chat apps work (Slack, Discord, etc.)
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATION VARIANTS - Premium Transitions
  // ═══════════════════════════════════════════════════════════════════
  
  /**
   * Question entrance/exit animations
   * WHY: Premium feel with smooth fade + subtle scale
   * Slower than typical (500ms) = more premium, intentional
   */
  const questionVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.96,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] // Custom easing for premium feel
      }
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: -20,
      transition: { 
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  /**
   * Thinking state animation
   * WHY: Gradient orb with smooth pulsing
   */
  const thinkingVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4 }
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER - Premium One-Question-at-a-Time UI
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      
      {/* Animated background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(200, 200, 200, 0.06) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════
          SEGMENTED ARROW PROGRESS - Enhanced Premium Indicator
          ═══════════════════════════════════════════════════════════════
          
          WHY segmented arrows: Visual milestone for each question
          WHY fixed top: Always visible, tracks progress
          WHY gradient on filled: Premium aesthetic
          
          MOBILE OPTIMIZATIONS:
          - Reduced top spacing on mobile (top-4 sm:top-8)
          - Smaller gap on mobile (gap-2 sm:gap-4)
          - Adjusted text size for mobile (text-xs sm:text-sm)
      */}
      <div className="fixed top-4 sm:top-8 left-0 right-0 z-50 px-4">
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-4">
          {/* Progress text */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs sm:text-sm text-gray-500 font-medium tracking-wider"
          >
            QUESTION {questionNumber} OF {totalQuestions}
          </motion.div>
          
          {/* Progress bar - optimized for mobile */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {Array.from({ length: totalQuestions }).map((_, index) => {
              const isCompleted = index < questionNumber - 1;
              const isCurrent = index === questionNumber - 1;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isCurrent ? 1.1 : 1,
                    transition: { delay: index * 0.1 }
                  }}
                  className="relative"
                >
                  {/* Glow effect for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-400 to-gray-300 blur-md"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* Circle indicator - responsive sizing */}
                  <div className={`
                    relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-500
                    ${isCompleted 
                      ? 'bg-gradient-to-r from-gray-400 to-gray-300 scale-100' 
                      : isCurrent
                      ? 'bg-gradient-to-r from-gray-300 to-white scale-110'
                      : 'bg-gray-800 scale-90'
                    }
                  `}>
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT - Question or Thinking State
          ═══════════════════════════════════════════════════════════════
          
          WHY AnimatePresence mode="wait": 
          - Waits for exit animation to complete before entering
          - Prevents overlap during transitions
          - Creates smooth question → thinking → question flow
          
          WHY centered: Full focus on current exchange
          WHY max-w-3xl: Optimal reading width with more breathing room
          
          MOBILE OPTIMIZATIONS:
          - Responsive container with proper mobile padding
          - Adjusted spacing for smaller screens
      */}
      <div className="w-full max-w-3xl mx-auto relative z-10 px-2 sm:px-0">
        <AnimatePresence mode="wait">
          {isThinking ? (
            // ─────────────────────────────────────────────────────────
            // ENHANCED PREMIUM THINKING STATE
            // ─────────────────────────────────────────────────────────
            <motion.div
              key="thinking"
              variants={thinkingVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-12 sm:py-20"
            >
              {/* Multi-layered gradient orbs - responsive sizing */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
                {/* Outer glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(200, 200, 200, 0.4) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Middle layer */}
                <motion.div
                  className="absolute inset-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #9CA3AF 0%, #D1D5DB 100%)',
                    filter: 'blur(12px)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                
                {/* Inner core */}
                <motion.div
                  className="absolute inset-4 rounded-full"
                  style={{
                    background: 'linear-gradient(225deg, #D1D5DB 0%, #9CA3AF 100%)',
                    filter: 'blur(8px)',
                  }}
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              
              {/* Animated thinking text - responsive sizing */}
              <motion.div
                className="flex items-center gap-1.5 sm:gap-2 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.p
                  className="text-gray-300 text-base sm:text-xl font-medium text-center"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  Analyzing your response
                </motion.p>
                <motion.span
                  className="text-gray-300 text-base sm:text-xl"
                  animate={{
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  ...
                </motion.span>
              </motion.div>
              
              {/* Progress hints - responsive sizing */}
              <motion.p
                className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4 px-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Crafting the perfect next question
              </motion.p>
            </motion.div>
          ) : currentQuestion ? (
            // ─────────────────────────────────────────────────────────
            // ENHANCED QUESTION VIEW - More Engaging Layout
            // ─────────────────────────────────────────────────────────
            <motion.div
              key={currentQuestion}
              variants={questionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="py-8 sm:py-12"
            >
              {/* Decorative top line - responsive sizing */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-px w-12 sm:w-20 bg-gradient-to-r from-gray-500 to-gray-300 mx-auto mb-6 sm:mb-8"
              />
              
              {/* Question card with glass morphism - optimized mobile padding */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative mb-8 sm:mb-12 p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                {/* Corner accents - responsive sizing */}
                <div className="absolute top-0 left-0 w-12 h-12 sm:w-20 sm:h-20 border-t-2 border-l-2 border-gray-500/30 rounded-tl-2xl sm:rounded-tl-3xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-20 sm:h-20 border-b-2 border-r-2 border-gray-400/30 rounded-br-2xl sm:rounded-br-3xl" />
                
                {/* Question text - Enhanced typography with better mobile sizing */}
                <motion.h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-center leading-tight tracking-tight px-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  style={{
                    background: 'linear-gradient(to bottom, #ffffff 60%, #a0a0a0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {currentQuestion}
                </motion.h1>
                
                {/* Subtle shimmer effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="shimmer absolute inset-0" />
                </motion.div>
              </motion.div>
              
              {/* Answer input section - Enhanced with mobile optimization */}
              <motion.form
                onSubmit={handleSendMessage}
                className="space-y-4 sm:space-y-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="relative group">
                  {/* Textarea with enhanced styling - mobile optimized */}
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share your thoughts here..."
                    rows={4}
                    disabled={isThinking}
                    className="
                      w-full bg-black/40 backdrop-blur-xl
                      border-2 border-white/10 rounded-xl sm:rounded-2xl 
                      px-4 py-4 sm:px-6 sm:py-5 text-base sm:text-lg text-white placeholder:text-gray-500
                      focus:outline-none focus:border-gray-400/60 focus:ring-4 focus:ring-gray-400/20
                      transition-all duration-300 resize-none
                      disabled:opacity-50 disabled:cursor-not-allowed
                      group-hover:border-white/20
                    "
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                    autoFocus
                  />
                  
                  {/* Floating label effect - responsive */}
                  {inputValue && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-2.5 sm:-top-3 left-3 sm:left-4 px-2 bg-[#0A0A0A] text-xs text-gray-400 font-medium"
                    >
                      Your Answer
                    </motion.div>
                  )}
                  
                  {/* Character count indicator - responsive positioning */}
                  <div className="absolute bottom-2.5 sm:bottom-3 right-3 sm:right-4 text-xs text-gray-600">
                    {inputValue.length}/500
                  </div>
                </div>
                
                {/* Enhanced submit button with icon - mobile optimized */}
                <motion.button
                  type="submit"
                  disabled={isThinking || !inputValue.trim()}
                  whileHover={!isThinking && inputValue.trim() ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isThinking && inputValue.trim() ? { scale: 0.98 } : {}}
                  className={`
                    relative w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold
                    transition-all duration-300 overflow-hidden
                    ${isThinking || !inputValue.trim()
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-2xl hover:shadow-gray-500/30 cursor-pointer'
                    }
                  `}
                  style={!isThinking && inputValue.trim() ? {
                    boxShadow: '0 10px 40px rgba(150, 150, 150, 0.3)',
                  } : {}}
                >
                  {/* Button gradient overlay on hover */}
                  {!isThinking && inputValue.trim() && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-500 opacity-0 hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    />
                  )}
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isThinking ? 'Processing...' : (
                      <>
                        Continue
                        <motion.svg
                          className="w-4 h-4 sm:w-5 sm:h-5 inline-block"
                          viewBox="0 0 20 20"
                          fill="none"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                      </>
                    )}
                  </span>
                </motion.button>
                
                {/* Enhanced helper text - mobile optimized with line break on small screens */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-600"
                >
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/5 border border-white/10 font-mono text-xs">Enter</kbd>
                    <span className="hidden sm:inline">to submit</span>
                    <span className="sm:hidden">submit</span>
                  </span>
                  <span className="text-gray-700 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/5 border border-white/10 font-mono text-xs">Shift</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/5 border border-white/10 font-mono text-xs">Enter</kbd>
                    <span className="hidden sm:inline">for new line</span>
                    <span className="sm:hidden">new line</span>
                  </span>
                </motion.div>
              </motion.form>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT (Wrapped with Suspense)
// ═══════════════════════════════════════════════════════════════════

/**
 * WHY this wrapper component:
 * Next.js requires Suspense boundary for any component using useSearchParams
 * This is a Next.js App Router requirement for dynamic rendering
 * 
 * The Suspense fallback shows while Next.js is preparing the component
 * (typically very fast, but necessary for proper hydration)
 */
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    }>
      <ChatInterface />
    </Suspense>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * PREMIUM UI ARCHITECTURE EXPLANATION
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHY THIS STRUCTURE (One Question at a Time):
 * 
 * 1. Full Focus Design:
 *    - No stacked chat history visible
 *    - One question centered, large typography
 *    - Minimizes cognitive load
 *    - Feels premium, not generic chatbot
 * 
 * 2. Segmented Arrow Progress:
 *    - 8 arrow segments at top (one per question)
 *    - Visual milestones, not just numbers
 *    - Gradient fills as you progress
 *    - Minimal but clear
 * 
 * 3. Smooth Transitions:
 *    - Question fades out (300ms)
 *    - Premium thinking state (gradient orb)
 *    - New question fades in (500ms)
 *    - Feels intentional, not rushed
 * 
 * 4. Two-component structure:
 *    - ChatPage: Wrapper with Suspense (required by Next.js)
 *    - ChatInterface: Main component with all the logic
 *    - Separation needed for useSearchParams to work
 * 
 * ════════════════════════════════════════════════════════════════════════
 * STATE MANAGEMENT - Optimized for Focus
 * ════════════════════════════════════════════════════════════════════════
 * 
 * HOW WE TRACK CONVERSATION:
 * 
 * 1. currentQuestion (string):
 *    - What's currently displayed (centered, large)
 *    - Changes on each exchange
 *    - Triggers fade in/out animations
 * 
 * 2. conversationHistory (array):
 *    - Full conversation for API context
 *    - Format: { role: 'user' | 'assistant', content: string }
 *    - Stored but NOT displayed
 *    - Saved to localStorage as backup
 * 
 * 3. isThinking (boolean):
 *    - Shows premium gradient orb animation
 *    - Disables input during API call
 *    - Smoother than generic "loading"
 * 
 * 4. inputValue (string):
 *    - User's current answer
 *    - Clears after submission
 * 
 * FLOW BETWEEN QUESTIONS:
 * 
 * 1. User submits answer
 * 2. Clear currentQuestion → triggers exit animation
 * 3. Show thinking state (gradient orb)
 * 4. API returns next question
 * 5. Set currentQuestion → triggers enter animation
 * 6. Arrow segment fills in
 * 
 * COMPLETION:
 * - After 8 questions, API returns isComplete: true
 * - Save history to localStorage
 * - Redirect to /results page
 * 
 * ════════════════════════════════════════════════════════════════════════
 * ANIMATION TIMING (Premium Feel)
 * ════════════════════════════════════════════════════════════════════════
 * 
 * Exit: 300ms (quick fade out)
 * Thinking: Until API responds (gradient rotation)
 * Enter: 500ms (smooth fade in with scale)
 * Total: ~1-1.5s per transition (feels premium, not slow)
 * 
 * Custom easing: [0.22, 1, 0.36, 1] (smooth acceleration)
 * 
 * ════════════════════════════════════════════════════════════════════════
 * RESPONSIVE DESIGN
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ✓ Question text: 5xl on desktop, 4xl on mobile
 * ✓ Centered layout with max-w-2xl
 * ✓ Touch-friendly input and button
 * ✓ Arrow progress scales on mobile
 * ✓ Generous padding prevents edge-to-edge
 * ✓ Auto-focus on input for desktop
 */