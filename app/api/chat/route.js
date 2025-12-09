/**
 * ════════════════════════════════════════════════════════════════════════
 * CHAT API ENDPOINT - GPT-4 Powered Startup Validator
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * This endpoint is the brain of the startup validator. It receives the 
 * conversation history and uses GPT-4 to generate intelligent follow-up 
 * questions that validate the startup idea.
 * 
 * CONVERSATION FLOW:
 * 1. Frontend sends conversation history (all messages so far)
 * 2. We count how many questions we've asked
 * 3. If < 7 questions: Ask GPT-4 to generate next question
 * 4. If >= 7 questions: Return isComplete: true (triggers results page)
 * 
 * WHY GPT-4 (not hardcoded questions):
 * - GPT-4 can reference specific things the user said
 * - It can push back on vague answers
 * - It can adapt questions based on context
 * - Creates natural conversation, not a rigid form
 * 
 * API RESPONSE FORMAT:
 * Success: { message: "Next question...", isComplete: false }
 * Complete: { message: "", isComplete: true }
 * Error: { error: "Error message" }
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// ═══════════════════════════════════════════════════════════════════════
// OPENAI CLIENT SETUP
// ═══════════════════════════════════════════════════════════════════════

/**
 * WHY initialize here: We want one client instance per request
 * WHY check for API key: Better error message if missing
 * 
 * The OpenAI client handles:
 * - Authentication with API key
 * - Request formatting
 * - Response parsing
 * - Error handling for network issues
 */
const initializeOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

// ═══════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT - The AI's Personality & Instructions
// ═══════════════════════════════════════════════════════════════════════

/**
 * WHY this is critical: The system prompt defines HOW the AI behaves
 * 
 * KEY ELEMENTS:
 * 1. Persona: "Battle-tested founder" - real, direct, honest
 * 2. Goal: Reality check through sharp, probing questions
 * 3. Tone: Conversational but skeptical - not cheerleader, not harsh
 * 4. Strategy: Dig into specifics, challenge assumptions, find the truth
 * 
 * DESIGN CHOICES:
 * - "2am honest conversation": No BS, just real talk
 * - "Skeptical but helpful": We want truth, not validation
 * - "Ask what matters": Cut through the fluff to real issues
 * - Natural language: Contractions, casual phrasing, human rhythm
 * 
 * @param {number} questionNumber - Current question (1-7)
 * @returns {string} Complete system prompt
 */
const getSystemPrompt = (questionNumber) => {
  return `You're a founder who's built and killed multiple startups. You're talking to someone about their idea at 2am. You're not here to be nice or encouraging - you're here to help them see reality before they waste years of their life.

Your vibe: Conversational, direct, a bit skeptical. Like a friend who actually tells you the truth instead of what you want to hear.

CRITICAL RULES:
- Ask ONE sharp question that actually matters
- Don't just restate what they said back to them (nobody likes that)
- If their answer is vague, call it out naturally: "That's pretty broad..." or "Okay but like, specifically..."
- Use contractions (you're, don't, can't) - talk like a real person
- No corporate speak, no buzzwords, no "that's interesting" filler
- Get to the uncomfortable truth

WHAT TO ASK ABOUT:
Questions 1-2: Who actually has this problem? Why should they care?
Questions 3-4: How does money work here? Who's paying and why?
Questions 5-6: What's already out there? Why will you win?
Question 7: What's your unfair advantage? Why you, why now?

YOUR STYLE:
- "Who's actually gonna pay for this?" not "Can you describe your monetization strategy?"
- "What happens when [competitor] does this?" not "How do you differentiate?"
- "Have you talked to anyone who has this problem?" not "What is your market validation?"
- "Why hasn't someone done this already?" not "What barriers to entry exist?"

Current question: ${questionNumber}/7

Remember: You're having a real conversation, not conducting an interview. Be human. Be direct. Ask what actually matters. If something smells off, dig into it. The startup world is brutal - better they hear hard truths from you than from the market.`;
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════════════

export async function POST(request) {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Parse and Validate Request
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * WHY await request.json(): Next.js Request body is a stream
     * We need to parse it to get the actual data
     * 
     * EXPECTED FORMAT:
     * { messages: [{ role: 'user', content: 'I want to...' }, ...] }
     */
    const body = await request.json();
    const { messages } = body;
    
    /**
     * ═══════════════════════════════════════════════════════════════════
     * INPUT VALIDATION - Prevent Invalid Requests
     * ═══════════════════════════════════════════════════════════════════
     * 
     * VALIDATION CHECKS:
     * 1. Messages array exists
     * 2. Messages is actually an array
     * 3. Messages array is not empty
     * 4. Each message has required fields
     * 5. Conversation length is reasonable
     * 
     * WHY VALIDATE HERE:
     * - Prevents wasted OpenAI API calls
     * - Better error messages
     * - Security (prevents malicious requests)
     * - Cost control (rejects spam early)
     */
    
    // Check 1: Messages exists and is array
    if (!messages || !Array.isArray(messages)) {
      console.error('[Chat API] Invalid request: messages not an array');
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }
    
    // Check 2: Messages array not empty
    if (messages.length === 0) {
      console.error('[Chat API] Invalid request: empty messages array');
      return NextResponse.json(
        { error: 'Invalid request: at least one message required' },
        { status: 400 }
      );
    }
    
    /**
     * Check 3: Validate message structure
     * 
     * EACH MESSAGE MUST HAVE:
     * - role: 'user' or 'assistant'
     * - content: non-empty string
     * 
     * WHY CHECK THIS:
     * - OpenAI API will reject invalid messages
     * - Better to catch and return clear error
     * - Prevents "undefined" being sent to AI
     */
    const invalidMessage = messages.find(m => 
      !m.role || 
      !m.content || 
      typeof m.content !== 'string' ||
      m.content.trim().length === 0 ||
      (m.role !== 'user' && m.role !== 'assistant' && m.role !== 'system')
    );
    
    if (invalidMessage) {
      console.error('[Chat API] Invalid message structure:', invalidMessage);
      return NextResponse.json(
        { error: 'Invalid message format: each message needs role and content' },
        { status: 400 }
      );
    }
    
    /**
     * Check 4: Prevent spam / abuse
     * 
     * REASONABLE LIMITS:
     * - Normal conversation: 7 questions = ~14 messages
     * - Allow some buffer: max 20 messages
     * - More than that = something wrong
     * 
     * WHY LIMIT:
     * - Prevents infinite loops
     * - Prevents API abuse
     * - Protects costs
     * - Catches bugs
     * 
     * PRODUCTION IMPROVEMENT:
     * Track by IP/session:
     * - Max 10 conversations per hour
     * - Max 100 API calls per day
     */
    if (messages.length > 20) {
      console.error('[Chat API] Conversation too long:', messages.length);
      return NextResponse.json(
        { error: 'Conversation too long. Maximum 20 messages allowed.' },
        { status: 400 }
      );
    }
    
    /**
     * Check 5: Validate content length
     * 
     * WHY LIMIT MESSAGE LENGTH:
     * - OpenAI has token limits
     * - Prevent huge API costs
     * - Catch paste accidents
     * 
     * MAX PER MESSAGE: 2000 characters
     * Total conversation: Will be checked by OpenAI
     */
    const tooLongMessage = messages.find(m => m.content.length > 2000);
    if (tooLongMessage) {
      console.error('[Chat API] Message too long');
      return NextResponse.json(
        { error: 'Message too long. Maximum 2000 characters per message.' },
        { status: 400 }
      );
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Count Question Number
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * HOW WE COUNT QUESTIONS:
     * 
     * Conversation structure:
     * - User message (problem statement)
     * - Assistant message (question 1)
     * - User message (answer 1)
     * - Assistant message (question 2)
     * - User message (answer 2)
     * - etc.
     * 
     * LOGIC:
     * - Count user messages = number of exchanges
     * - User messages count = question number we should ask
     * 
     * EXAMPLE:
     * - 1 user message = about to ask question 1
     * - 2 user messages = about to ask question 2
     * - 7 user messages = about to ask question 7
     * - 8 user messages = conversation complete
     */
    const userMessages = messages.filter(m => m.role === 'user');
    const questionNumber = userMessages.length;
    
    console.log(`[Chat API] Received ${messages.length} total messages`);
    console.log(`[Chat API] User has sent ${userMessages.length} messages`);
    console.log(`[Chat API] About to ask question ${questionNumber}`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Check if Conversation is Complete
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * WHY 7 questions: Sweet spot for validation
     * - Enough to understand the idea deeply
     * - Not so many that user gets fatigued
     * - Covers all key areas (problem, customer, market, moat, etc.)
     * 
     * WHEN WE SET isComplete: true:
     * After the user has answered 7 questions (meaning we've asked 7)
     * This triggers the frontend to:
     * 1. Save conversation to localStorage
     * 2. Redirect to /results page
     * 3. Generate final analysis
     */
    const MAX_QUESTIONS = 7;
    
    if (questionNumber > MAX_QUESTIONS) {
      console.log('[Chat API] Conversation complete, signaling frontend');
      
      return NextResponse.json({
        message: "", // Empty message, won't be displayed
        isComplete: true
      });
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Initialize OpenAI Client
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * WHY try/catch here: API key might be missing
     * Better to catch and return helpful error than crash
     */
    let openai;
    try {
      openai = initializeOpenAI();
    } catch (error) {
      console.error('[Chat API] OpenAI initialization failed:', error.message);
      
      return NextResponse.json({
        error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.',
      }, { status: 500 });
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Call GPT-4 to Generate Next Question
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * OPENAI API STRUCTURE:
     * 
     * We're using the Chat Completions API:
     * - Model: gpt-4-turbo (faster, great for natural conversation)
     * - Messages array: [system prompt, ...conversation history]
     * - Temperature: 0.9 (more natural variation, less robotic)
     * - Max tokens: 250 (room for natural, conversational questions)
     * - Presence penalty: 0.6 (encourages asking NEW things, not repeating)
     * - Frequency penalty: 0.3 (varies word choice, feels more human)
     * 
     * WHY higher temperature (0.9):
     * - Makes responses less predictable and more natural
     * - Each question feels unique, not templated
     * - Closer to how a real person would ask
     * 
     * WHY presence/frequency penalties:
     * - Presence: Pushes GPT to explore new topics, not rehash old ones
     * - Frequency: Varies vocabulary so it doesn't sound repetitive
     * - Together: Creates more dynamic, human-like conversation
     * 
     * WHY 250 tokens:
     * - Gives room for natural phrasing with context
     * - Can include a quick reference + the actual question
     * - Still keeps it concise (not essay-length)
     */
    console.log('[Chat API] Calling OpenAI GPT-4...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(questionNumber)
        },
        ...messages // Spread the entire conversation history
      ],
      temperature: 0.9,        // More natural, less robotic
      max_tokens: 250,         // Room for conversational flow
      presence_penalty: 0.6,   // Encourage new topics
      frequency_penalty: 0.3,  // Vary word choice
    });
    
    /**
     * PARSING THE RESPONSE:
     * 
     * OpenAI returns a complex object:
     * {
     *   choices: [
     *     {
     *       message: { role: 'assistant', content: 'The actual question' },
     *       finish_reason: 'stop'
     *     }
     *   ],
     *   usage: { ... }
     * }
     * 
     * WHY choices[0]: API can return multiple completions
     * We only requested one, so we take the first
     * 
     * WHY .message.content: That's where the actual text is
     */
    const aiMessage = completion.choices[0].message.content;
    
    console.log('[Chat API] GPT-4 response received');
    console.log('[Chat API] Question:', aiMessage.substring(0, 100) + '...');
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 6: Return Response to Frontend
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * SUCCESS RESPONSE FORMAT:
     * {
     *   message: "The next question from GPT-4",
     *   isComplete: false
     * }
     * 
     * Frontend will:
     * 1. Add this message to the conversation
     * 2. Show it in a message bubble
     * 3. Wait for user's answer
     * 4. Send updated conversation back to this endpoint
     */
    return NextResponse.json({
      message: aiMessage,
      isComplete: false
    });
    
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════════
    // COMPREHENSIVE ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * TYPES OF ERRORS WE HANDLE:
     * 
     * 1. OpenAI API errors:
     *    - Rate limit exceeded
     *    - Invalid API key
     *    - Insufficient quota
     *    - Context length exceeded
     *    - Network timeout
     * 
     * 2. Parsing errors:
     *    - Malformed request body
     *    - Invalid JSON
     * 
     * 3. Validation errors:
     *    - Caught above, but might throw
     * 
     * 4. Unexpected errors:
     *    - Server issues
     *    - Code bugs
     *    - Edge cases
     * 
     * ERROR HANDLING PHILOSOPHY:
     * - Log full error for developers (console)
     * - Return user-friendly message (API response)
     * - Use appropriate HTTP status codes
     * - Never expose internal system details
     * - Track errors for monitoring (production)
     */
    console.error('[Chat API] Error:', error);
    console.error('[Chat API] Error stack:', error.stack);
    
    /**
     * ═══════════════════════════════════════════════════════════════════
     * OpenAI-Specific Errors
     * ═══════════════════════════════════════════════════════════════════
     */
    
    // Insufficient quota (out of credits)
    if (error.code === 'insufficient_quota') {
      console.error('[Chat API] OpenAI quota exceeded');
      return NextResponse.json({
        error: 'Service temporarily unavailable. Please try again later.',
      }, { status: 503 }); // Service Unavailable
    }
    
    // Invalid API key (configuration error)
    if (error.code === 'invalid_api_key') {
      console.error('[Chat API] Invalid OpenAI API key');
      return NextResponse.json({
        error: 'Service configuration error. Please contact support.',
      }, { status: 500 }); // Internal Server Error
    }
    
    // Rate limit exceeded (too many requests)
    if (error.code === 'rate_limit_exceeded') {
      console.error('[Chat API] OpenAI rate limit exceeded');
      return NextResponse.json({
        error: 'Too many requests. Please wait a moment and try again.',
      }, { status: 429 }); // Too Many Requests
    }
    
    // Context length exceeded (conversation too long)
    if (error.code === 'context_length_exceeded') {
      console.error('[Chat API] Context length exceeded');
      return NextResponse.json({
        error: 'Conversation too long. Please start a new conversation.',
      }, { status: 400 }); // Bad Request
    }
    
    /**
     * ═══════════════════════════════════════════════════════════════════
     * Network & Timeout Errors
     * ═══════════════════════════════════════════════════════════════════
     */
    
    // Network errors
    if (error.message?.includes('fetch') || 
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED')) {
      console.error('[Chat API] Network error');
      return NextResponse.json({
        error: 'Network error. Please check your connection and try again.',
      }, { status: 503 }); // Service Unavailable
    }
    
    // Timeout errors
    if (error.message?.includes('timeout') || 
        error.name === 'TimeoutError') {
      console.error('[Chat API] Request timeout');
      return NextResponse.json({
        error: 'Request timed out. Please try again.',
      }, { status: 504 }); // Gateway Timeout
    }
    
    /**
     * ═══════════════════════════════════════════════════════════════════
     * Parsing & Validation Errors
     * ═══════════════════════════════════════════════════════════════════
     */
    
    // JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error('[Chat API] Invalid JSON in request');
      return NextResponse.json({
        error: 'Invalid request format.',
      }, { status: 400 }); // Bad Request
    }
    
    /**
     * ═══════════════════════════════════════════════════════════════════
     * Generic Fallback Error
     * ═══════════════════════════════════════════════════════════════════
     * 
     * PRODUCTION IMPROVEMENT:
     * Send error to monitoring service:
     * 
     * Sentry.captureException(error, {
     *   tags: {
     *     endpoint: '/api/chat',
     *     conversationLength: messages?.length
     *   }
     * });
     * 
     * Track error frequency:
     * - Alert if error rate > 5%
     * - Alert if new error type appears
     * - Daily error summary email
     */
    return NextResponse.json({
      error: 'Failed to generate next question. Please try again.',
    }, { status: 500 });
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * RATE LIMITING (Production Implementation)
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHY RATE LIMIT:
 * - Prevent abuse
 * - Control costs
 * - Ensure fair usage
 * - Protect server resources
 * 
 * STRATEGY:
 * 1. Track requests by IP address
 * 2. Limit to X requests per minute
 * 3. Use sliding window (not fixed window)
 * 4. Return 429 with Retry-After header
 * 
 * IMPLEMENTATION (with Redis):
 * 
 * import { Redis } from '@upstash/redis';
 * 
 * const redis = Redis.fromEnv();
 * 
 * async function checkRateLimit(ip) {
 *   const key = `ratelimit:${ip}`;
 *   const count = await redis.incr(key);
 *   
 *   if (count === 1) {
 *     // First request, set expiry
 *     await redis.expire(key, 60); // 60 seconds
 *   }
 *   
 *   const MAX_REQUESTS = 10; // 10 per minute
 *   
 *   if (count > MAX_REQUESTS) {
 *     const ttl = await redis.ttl(key);
 *     return {
 *       allowed: false,
 *       retryAfter: ttl
 *     };
 *   }
 *   
 *   return { allowed: true };
 * }
 * 
 * // In POST handler:
 * const ip = request.headers.get('x-forwarded-for') || 'unknown';
 * const rateLimit = await checkRateLimit(ip);
 * 
 * if (!rateLimit.allowed) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { 
 *       status: 429,
 *       headers: { 'Retry-After': rateLimit.retryAfter.toString() }
 *     }
 *   );
 * }
 */

/**
 * ════════════════════════════════════════════════════════════════════════
 * TESTING THIS ENDPOINT
 * ════════════════════════════════════════════════════════════════════════
 * 
 * TEST 1: First Question
 * Request:
 * {
 *   "messages": [
 *     { "role": "user", "content": "I want to build an AI tutor for college students" }
 *   ]
 * }
 * 
 * Expected: Question 1 about target customer or problem specifics
 * 
 * ────────────────────────────────────────────────────────────────────────
 * 
 * TEST 2: Mid-Conversation
 * Request:
 * {
 *   "messages": [
 *     { "role": "user", "content": "AI tutor..." },
 *     { "role": "assistant", "content": "Who is this for?" },
 *     { "role": "user", "content": "College students in STEM" }
 *   ]
 * }
 * 
 * Expected: Question 2, references "college students in STEM"
 * 
 * ────────────────────────────────────────────────────────────────────────
 * 
 * TEST 3: Conversation Complete
 * Request: (after 7 exchanges)
 * {
 *   "messages": [
 *     ... 14 messages (7 user, 7 assistant) ...
 *   ]
 * }
 * 
 * Expected: { message: "", isComplete: true }
 * 
 * ────────────────────────────────────────────────────────────────────────
 * 
 * TEST 4: Missing API Key
 * Remove OPENAI_API_KEY from .env.local
 * 
 * Expected: Helpful error message about missing API key
 * 
 * ════════════════════════════════════════════════════════════════════════
 * DEBUGGING TIPS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * If questions aren't making sense:
 * → Check the system prompt (getSystemPrompt function)
 * → Adjust temperature (higher = more creative, lower = more focused)
 * 
 * If it's too slow:
 * → Switch from 'gpt-4-turbo' to 'gpt-3.5-turbo' for faster (but less smart) responses
 * → Reduce max_tokens to 150
 * 
 * If it's asking too many questions:
 * → Check questionNumber calculation logic
 * → Verify MAX_QUESTIONS constant
 * 
 * If API errors:
 * → Check console logs for specific error codes
 * → Verify API key has credits
 * → Check OpenAI status page (status.openai.com)
 * 
 * ════════════════════════════════════════════════════════════════════════
 * NEXT STEPS AFTER THIS WORKS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * 1. Add Brave Search integration:
 *    - Mid-conversation, search for competitors
 *    - Feed competitor data back to GPT-4
 *    - Make questions more specific based on real data
 * 
 * 2. Add analysis endpoint (/api/analyze):
 *    - After 7 questions, analyze full conversation
 *    - Generate score, verdict, insights
 *    - Return structured data for results page
 * 
 * 3. Add rate limiting:
 *    - Prevent abuse
 *    - Use Redis or in-memory store
 *    - Limit to X requests per IP per hour
 * 
 * 4. Add conversation persistence:
 *    - Save to database (Supabase/MongoDB)
 *    - Enable sharing of results
 *    - Track analytics (which ideas score well)
 */