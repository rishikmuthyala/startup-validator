/**
 * ════════════════════════════════════════════════════════════════════════
 * FOLLOW-UP API - Continue the Conversation
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Allows founders to ask clarifying questions about their analysis.
 * Maintains the same honest, direct tone as the original analysis.
 * 
 * FLOW:
 * 1. Receive original analysis + new question + previous follow-ups
 * 2. Build context for GPT-4 (analysis summary + Q&A history)
 * 3. Call GPT-4 to answer the question
 * 4. Return answer to frontend
 * 
 * WHY THIS MATTERS:
 * - Analysis might raise new questions
 * - User might want to explore specific points deeper
 * - Creates ongoing value (not just one-and-done)
 * - Builds trust (we're here to help, not just judge)
 * 
 * EXAMPLE FOLLOW-UP QUESTIONS:
 * - "Why do you think my monetization is weak?"
 * - "How should I validate the market size?"
 * - "Can you explain more about the pivot idea?"
 * - "What if I targeted businesses instead of consumers?"
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// ═══════════════════════════════════════════════════════════════════════
// OPENAI CLIENT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

const initializeOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  return new OpenAI({ apiKey });
};

// ═══════════════════════════════════════════════════════════════════════
// FOLLOW-UP SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generates system prompt for follow-up questions
 * 
 * WHY separate from analysis prompt:
 * - Different task (answer questions vs. analyze)
 * - Needs context from original analysis
 * - Should reference specific points from analysis
 * 
 * TONE:
 * Same as analysis - direct, honest, helpful
 * Not defensive about the analysis
 * If user challenges a point, explain reasoning
 * 
 * @param {Object} analysis - Original analysis object
 * @returns {string} System prompt for follow-up
 */
const getFollowUpPrompt = (analysis) => {
  return `You're continuing a conversation about a startup analysis you provided.

ORIGINAL ANALYSIS SUMMARY:
Score: ${analysis.score}/100
Verdict: ${analysis.verdict}

Promising aspects:
${analysis.promising.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Reality checks:
${analysis.reality.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Pivot ideas:
${analysis.pivotIdeas.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Next steps:
${analysis.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

────────────────────────────────────────────────────────────────────

The founder is now asking a follow-up question about this analysis.

YOUR ROLE:
- Answer their question with the same honest, direct style as the original analysis
- Reference specific parts of your analysis when relevant
- If they're pushing back on criticism, explain your reasoning (but don't back down if you were right)
- If they want to explore a pivot, dig into it specifically
- Stay helpful and constructive

TONE:
- Conversational and direct (you're, don't, can't)
- Not defensive - you gave them real feedback for a reason
- Not generic startup advice - specific to THEIR situation
- Helpful but honest - don't sugar-coat to be nice

Keep responses focused and actionable. 2-4 paragraphs max. Get to the point.`;
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════════════

export async function POST(request) {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Parse Request
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * EXPECTED REQUEST FORMAT:
     * {
     *   analysis: { score, verdict, promising, reality, ... },
     *   question: "User's follow-up question",
     *   previousFollowUps: [{ question, answer }, ...] // optional
     * }
     */
    const body = await request.json();
    const { analysis, question, previousFollowUps = [] } = body;
    
    /**
     * ═══════════════════════════════════════════════════════════════════
     * INPUT VALIDATION
     * ═══════════════════════════════════════════════════════════════════
     */
    
    if (!analysis || !question) {
      return NextResponse.json(
        { error: 'Invalid request: analysis and question required' },
        { status: 400 }
      );
    }
    
    // Validate question length
    if (typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      );
    }
    
    if (question.length > 500) {
      return NextResponse.json(
        { error: 'Question too long. Maximum 500 characters.' },
        { status: 400 }
      );
    }
    
    // Validate previous follow-ups
    if (!Array.isArray(previousFollowUps)) {
      return NextResponse.json(
        { error: 'previousFollowUps must be an array' },
        { status: 400 }
      );
    }
    
    // Limit number of follow-ups (prevent abuse)
    if (previousFollowUps.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 follow-up questions allowed' },
        { status: 400 }
      );
    }
    
    console.log(`[Follow-up API] Received question: "${question.substring(0, 50)}..."`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Build Conversation Context
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * WHY build full context:
     * - GPT-4 needs to know previous Q&A to avoid repeating itself
     * - User might reference previous questions ("what you said about...")
     * - Creates coherent conversation thread
     * 
     * MESSAGE STRUCTURE:
     * [
     *   { role: 'system', content: prompt with analysis context },
     *   { role: 'user', content: first follow-up question },
     *   { role: 'assistant', content: first answer },
     *   { role: 'user', content: second question },
     *   ...
     *   { role: 'user', content: current question }
     * ]
     */
    const messages = [
      {
        role: 'system',
        content: getFollowUpPrompt(analysis)
      }
    ];
    
    // Add previous follow-up history
    previousFollowUps.forEach(({ question: q, answer: a }) => {
      messages.push({ role: 'user', content: q });
      messages.push({ role: 'assistant', content: a });
    });
    
    // Add current question
    messages.push({ role: 'user', content: question });
    
    console.log(`[Follow-up API] Context includes ${previousFollowUps.length} previous exchanges`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Initialize OpenAI
    // ─────────────────────────────────────────────────────────────────────
    
    let openai;
    try {
      openai = initializeOpenAI();
    } catch (error) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
      }, { status: 500 });
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Call GPT-4 for Answer
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * API PARAMETERS:
     * 
     * model: gpt-4-turbo
     * - Fast enough for real-time conversation
     * - Smart enough for nuanced answers
     * 
     * temperature: 0.8
     * - Natural conversation (not rigid)
     * - Still consistent with original analysis tone
     * 
     * max_tokens: 500
     * - 2-4 paragraphs (not essays)
     * - Enough to be thorough
     * - Not overwhelming
     */
    console.log('[Follow-up API] Calling GPT-4...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      temperature: 0.8,
      max_tokens: 500,
    });
    
    const answer = completion.choices[0].message.content;
    
    console.log('[Follow-up API] Answer generated');
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Return Answer
    // ─────────────────────────────────────────────────────────────────────
    
    return NextResponse.json({ answer });
    
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════════
    // COMPREHENSIVE ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════════
    
    console.error('[Follow-up API] Error:', error);
    console.error('[Follow-up API] Error stack:', error.stack);
    
    // OpenAI-specific errors
    if (error.code === 'insufficient_quota') {
      console.error('[Follow-up API] OpenAI quota exceeded');
      return NextResponse.json({
        error: 'Service temporarily unavailable. Please try again later.',
      }, { status: 503 });
    }
    
    if (error.code === 'invalid_api_key') {
      console.error('[Follow-up API] Invalid OpenAI API key');
      return NextResponse.json({
        error: 'Service configuration error. Please contact support.',
      }, { status: 500 });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      console.error('[Follow-up API] OpenAI rate limit exceeded');
      return NextResponse.json({
        error: 'Too many requests. Please wait a moment and try again.',
      }, { status: 429 });
    }
    
    if (error.code === 'context_length_exceeded') {
      console.error('[Follow-up API] Context length exceeded');
      return NextResponse.json({
        error: 'Conversation too long. Please start a new session.',
      }, { status: 400 });
    }
    
    // Network/timeout errors
    if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      console.error('[Follow-up API] Request timeout');
      return NextResponse.json({
        error: 'Request timed out. Please try again.',
      }, { status: 504 });
    }
    
    // JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error('[Follow-up API] Invalid JSON in request');
      return NextResponse.json({
        error: 'Invalid request format.',
      }, { status: 400 });
    }
    
    // Generic fallback
    return NextResponse.json({
      error: 'Failed to generate answer. Please try again.',
    }, { status: 500 });
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * TESTING THE FOLLOW-UP API
 * ════════════════════════════════════════════════════════════════════════
 * 
 * TEST REQUEST:
 * 
 * POST http://localhost:3000/api/followup
 * 
 * Body:
 * {
 *   "analysis": {
 *     "score": 58,
 *     "verdict": "Needs Work",
 *     "promising": ["Clear pain point", "Target audience identified"],
 *     "reality": ["Students don't want it", "Low willingness to pay"],
 *     "pivotIdeas": ["Target schools instead", "Gamify for students"],
 *     "nextSteps": ["Interview 20 parents", "Talk to students", "Research competitors"]
 *   },
 *   "question": "Why do you think students won't want this?",
 *   "previousFollowUps": []
 * }
 * 
 * EXPECTED RESPONSE:
 * {
 *   "answer": "You literally said in the conversation that students don't want their parents controlling their phones. That's not me guessing - that's you recognizing the reality.\n\nHere's the thing: any app that forces behavior on unwilling users has massive friction. Students will:\n- Find workarounds (use different devices, uninstall, etc.)\n- Resent parents more (creates conflict)\n- Not engage with the solution\n\nCompare that to apps students WANT to use - productivity tools, social apps, games. They have natural retention because users chose them.\n\nIf you're building something for students, they need to be the ones wanting it. That's why I suggested the pivot to gamifying healthy phone usage - same problem, but framed as helping them achieve their goals, not restricting them."
 * }
 * 
 * WHAT TO CHECK:
 * ✓ Answer references specific things from analysis
 * ✓ Tone matches original analysis (direct, honest)
 * ✓ Provides reasoning, not just assertions
 * ✓ Length is reasonable (2-4 paragraphs)
 * ✓ Actionable insights if relevant
 * 
 * ════════════════════════════════════════════════════════════════════════
 */

