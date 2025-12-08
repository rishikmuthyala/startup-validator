/**
 * ════════════════════════════════════════════════════════════════════════
 * ANALYSIS API ENDPOINT - Comprehensive Startup Idea Evaluation
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Takes the complete 7-question conversation and generates a comprehensive,
 * brutally honest analysis of the startup idea. This is the "verdict" moment.
 * 
 * FLOW:
 * 1. Receive full conversation history from frontend
 * 2. Format conversation into readable text for GPT-4
 * 3. Send to GPT-4 with analysis system prompt
 * 4. Parse JSON response with score, verdict, insights
 * 5. Validate and return structured analysis
 * 
 * WHY THIS IS CRITICAL:
 * This is the payoff moment - where all the questions come together into
 * actionable insights. Must be personal, specific, and genuinely helpful.
 * 
 * OUTPUT STRUCTURE:
 * {
 *   score: 0-100,
 *   verdict: "Promising" | "Needs Work" | "Pivot Recommended",
 *   promising: ["strength 1", "strength 2", ...],
 *   reality: ["harsh truth 1", "harsh truth 2", ...],
 *   pivotIdeas: ["pivot idea 1", "pivot idea 2", ...],
 *   nextSteps: ["action 1", "action 2", "action 3"]
 * }
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchCompetitors } from '../../../lib/search.js';

// ═══════════════════════════════════════════════════════════════════════
// OPENAI CLIENT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * WHY separate function: Reusable, testable, clear error handling
 */
const initializeOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  return new OpenAI({ apiKey });
};

// ═══════════════════════════════════════════════════════════════════════
// ANALYSIS SYSTEM PROMPT - The Brain of the Validator
// ═══════════════════════════════════════════════════════════════════════

/**
 * WHAT THIS PROMPT DOES:
 * Instructs GPT-4 to be a brutally honest startup advisor who:
 * - Scores ideas on 5 key criteria (problem, market, monetization, moat, execution)
 * - References specific things the founder said
 * - Gives real feedback, not generic startup advice
 * - Provides actionable pivots and next steps
 * 
 * SCORING SYSTEM EXPLAINED:
 * 
 * 1. Problem Clarity (0-20 points):
 *    - Is this a real, painful problem?
 *    - Or is it a "nice to have"?
 *    - Do people actively seek solutions?
 *    
 * 2. Market Opportunity (0-20 points):
 *    - Is the market big enough to matter?
 *    - Is it growing or shrinking?
 *    - Can you reach these customers?
 *    
 * 3. Monetization (0-20 points):
 *    - Will people actually pay?
 *    - How much and how often?
 *    - Do unit economics work?
 *    
 * 4. Competitive Moat (0-20 points):
 *    - What's defensible here?
 *    - Can competitors easily copy this?
 *    - What's the unfair advantage?
 *    
 * 5. Execution Feasibility (0-20 points):
 *    - Can THIS founder actually build it?
 *    - What's their unique capability?
 *    - Is the scope realistic?
 * 
 * WHY THESE CRITERIA:
 * These are the 5 things that determine startup success/failure most often.
 * Based on analyzing thousands of successful and failed startups.
 * 
 * SCORING FAIRNESS:
 * Most ideas should score 40-70. Here's what scores mean:
 * - 80-100: Extremely promising, very rare
 * - 60-79: Solid idea with clear path forward
 * - 40-59: Has potential but needs significant work
 * - 20-39: Major issues, pivot recommended
 * - 0-19: Not viable in current form
 * 
 * WHY be harsh: Better to hear hard truths now than fail for 2 years
 * 
 * @param {string} conversationText - Formatted conversation for analysis
 * @returns {string} Complete system prompt
 */
const getAnalysisPrompt = (conversationText) => {
  return `You are a brutally honest startup advisor analyzing a startup idea based on a conversation.

Your job: Generate a comprehensive, honest analysis that helps the founder understand if this idea is worth pursuing.

SCORING SYSTEM (0-100 total):

1. Problem Clarity (0-20 points):
   - Is this a REAL, painful problem or just a "nice to have"?
   - Do people actively seek solutions for this?
   - Is the pain point clear and specific?
   
   Scoring guide:
   - 16-20: Acute, urgent problem that people desperately need solved
   - 11-15: Real problem but not critical/urgent
   - 6-10: Nice to have, not a must-have
   - 0-5: Unclear if this is actually a problem

2. Market Opportunity (0-20 points):
   - Is the market big enough to build a real business?
   - Is it growing, stable, or shrinking?
   - Can this founder realistically reach the customers?
   
   Scoring guide:
   - 16-20: Large, growing market with clear access
   - 11-15: Decent market size but competitive or hard to access
   - 6-10: Small market or unclear customer acquisition
   - 0-5: Tiny market or impossible to reach customers

3. Monetization (0-20 points):
   - Will customers actually PAY for this?
   - How much? Is it worth building a business around?
   - Do the unit economics make sense?
   
   Scoring guide:
   - 16-20: Clear willingness to pay, strong economics
   - 11-15: Likely to pay but price point unclear
   - 6-10: Unclear if they'll pay enough
   - 0-5: Free product or no monetization path

4. Competitive Moat (0-20 points):
   - What's defensible here?
   - Why can't competitors easily copy this?
   - What's the unfair advantage?
   
   Scoring guide:
   - 16-20: Strong defensibility (network effects, data, exclusive access)
   - 11-15: Some advantage but can be replicated
   - 6-10: Minimal differentiation
   - 0-5: Easily copied, no moat

5. Execution Feasibility (0-20 points):
   - Can THIS founder actually build this?
   - Do they have relevant skills/experience?
   - Is the scope realistic?
   
   Scoring guide:
   - 16-20: Founder has unique capability to execute
   - 11-15: Can probably build it with effort
   - 6-10: Major gaps in capability
   - 0-5: Unrealistic for this founder

CRITICAL RULES FOR YOUR ANALYSIS:

1. BE HONEST, NOT NICE
   - Founders need truth, not encouragement
   - If it's a bad idea, say so clearly (but offer pivots)
   - Don't soften the blow - they'll waste years if you do

2. REFERENCE SPECIFIC THINGS THEY SAID
   - Quote their exact words when making points
   - This proves you actually read their answers
   - Makes feedback feel personal, not generic

3. BE SPECIFIC, NOT GENERIC
   - "You admitted students don't want this" not "customer validation is unclear"
   - "Apple could add this tomorrow" not "competitive landscape is challenging"
   - "Parents won't pay more than $5/month" not "pricing strategy needs work"

4. PROVIDE ACTIONABLE PIVOTS
   - Based on their skills/domain knowledge
   - Concrete alternative approaches
   - Not "think about other ideas" - actual pivots

5. GIVE CONCRETE NEXT STEPS
   - Specific actions they can take THIS WEEK
   - "Interview 20 parents - ask if they'd pay $5/month"
   - Not "validate your assumptions" - tell them HOW

VERDICT GUIDELINES:
- "Promising" (score 70+): Worth pursuing, clear path forward
- "Needs Work" (score 40-69): Has potential but major issues to solve first
- "Pivot Recommended" (score <40): Current approach won't work, here's what might

TONE:
- Direct and clear (like a senior founder giving real feedback)
- Helpful but realistic (not mean, but not sugar-coated)
- Conversational (use "you", contractions, natural language)

OUTPUT FORMAT (STRICT JSON):
You MUST return valid JSON in exactly this format, no other text:

{
  "score": <number between 0-100>,
  "verdict": "<exactly one of: Promising | Needs Work | Pivot Recommended>",
  "promising": [
    "<specific positive point referencing their answer>",
    "<another strength based on what they said>"
    // REQUIRED: MINIMUM 2 items, can include 3-4 if applicable
  ],
  "reality": [
    "<first harsh truth they need to hear, with specific reference>",
    "<second challenge or red flag>",
    "<third reality check>"
    // REQUIRED: MINIMUM 3 items, can include 4-5 if needed
  ],
  "pivotIdeas": [
    "<specific pivot suggestion based on their domain/skills>",
    "<alternative approach that addresses same problem>"
    // REQUIRED: MINIMUM 2 items, can include 3 if applicable
  ],
  "nextSteps": [
    "<concrete action they can take this week>",
    "<second actionable step with specifics>",
    "<third step to validate further>"
    // REQUIRED: MINIMUM 3 items
  ]
}

CRITICAL REQUIREMENTS:
- "promising" array: MUST have at least 2 items
- "reality" array: MUST have at least 3 items
- "pivotIdeas" array: MUST have at least 2 items
- "nextSteps" array: MUST have at least 3 items
- Each array item must be a string, not an object
- Do NOT include comments in the actual JSON output

CONVERSATION TO ANALYZE:

${conversationText}

Now analyze this conversation deeply. Be brutally honest but helpful. Reference specific things they said. Return ONLY valid JSON, no other text before or after.`;
};

// ═══════════════════════════════════════════════════════════════════════
// CONVERSATION FORMATTING HELPER
// ═══════════════════════════════════════════════════════════════════════

/**
 * Formats conversation array into readable text for GPT-4
 * 
 * WHY WE FORMAT:
 * GPT-4 analyzes better when conversation is formatted as readable text
 * rather than raw JSON array. Makes it easier to reference specific exchanges.
 * 
 * INPUT FORMAT:
 * [
 *   { role: 'user', content: 'Problem statement...' },
 *   { role: 'assistant', content: 'Question 1?' },
 *   { role: 'user', content: 'Answer 1...' },
 *   ...
 * ]
 * 
 * OUTPUT FORMAT:
 * "USER: Problem statement...
 *  AI: Question 1?
 *  USER: Answer 1...
 *  ..."
 * 
 * @param {Array} messages - Conversation history
 * @returns {string} Formatted conversation text
 */
const formatConversation = (messages) => {
  return messages
    .map(msg => {
      const speaker = msg.role === 'user' ? 'FOUNDER' : 'AI';
      return `${speaker}: ${msg.content}`;
    })
    .join('\n\n');
};

// ═══════════════════════════════════════════════════════════════════════
// JSON VALIDATION & REPAIR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Validates and repairs GPT-4 JSON response
 * 
 * WHY THIS IS NEEDED:
 * Sometimes GPT-4 returns:
 * - Valid JSON wrapped in markdown code blocks (```json...```)
 * - JSON with extra text before/after
 * - Almost-valid JSON with small syntax errors
 * 
 * This function attempts to extract and validate the JSON.
 * 
 * VALIDATION CHECKS:
 * - All required fields present
 * - Score is 0-100
 * - Verdict is one of the three allowed values
 * - All arrays have at least minimum required items
 * 
 * @param {string} responseText - Raw GPT-4 response
 * @returns {Object} Validated analysis object
 * @throws {Error} If JSON is invalid or missing required fields
 */
const parseAndValidateAnalysis = (responseText) => {
  // Try to extract JSON from markdown code blocks if present
  let jsonText = responseText.trim();
  
  // Remove markdown code block wrapper if present
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1];
  }
  
  // Try to find JSON object if there's extra text
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }
  
  // Parse JSON
  let analysis;
  try {
    analysis = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Invalid JSON from GPT-4: ${error.message}`);
  }
  
  // Validate required fields
  const requiredFields = ['score', 'verdict', 'promising', 'reality', 'pivotIdeas', 'nextSteps'];
  const missingFields = requiredFields.filter(field => !(field in analysis));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate score range
  if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
    throw new Error(`Invalid score: ${analysis.score}. Must be 0-100.`);
  }
  
  // Validate verdict
  const validVerdicts = ['Promising', 'Needs Work', 'Pivot Recommended'];
  if (!validVerdicts.includes(analysis.verdict)) {
    throw new Error(`Invalid verdict: ${analysis.verdict}. Must be one of: ${validVerdicts.join(', ')}`);
  }
  
  // Validate and fix arrays with more lenient requirements
  // If arrays exist but are too short, log the issue but don't fail immediately
  const arrayValidation = {
    promising: { min: 2, actual: Array.isArray(analysis.promising) ? analysis.promising.length : 0 },
    reality: { min: 3, actual: Array.isArray(analysis.reality) ? analysis.reality.length : 0 },
    pivotIdeas: { min: 2, actual: Array.isArray(analysis.pivotIdeas) ? analysis.pivotIdeas.length : 0 },
    nextSteps: { min: 3, actual: Array.isArray(analysis.nextSteps) ? analysis.nextSteps.length : 0 }
  };
  
  const validationErrors = [];
  
  for (const [field, validation] of Object.entries(arrayValidation)) {
    if (!Array.isArray(analysis[field])) {
      validationErrors.push(`${field} must be an array (got ${typeof analysis[field]})`);
    } else if (validation.actual < validation.min) {
      validationErrors.push(`${field} must have at least ${validation.min} items (got ${validation.actual})`);
    }
  }
  
  if (validationErrors.length > 0) {
    const errorMessage = `Validation failed:\n${validationErrors.join('\n')}`;
    console.error('[Validation]', errorMessage);
    console.error('[Validation] Received analysis:', JSON.stringify(analysis, null, 2));
    throw new Error(errorMessage);
  }
  
  return analysis;
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════════════

export async function POST(request) {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Parse and Validate Request
    // ─────────────────────────────────────────────────────────────────────
    
    const body = await request.json();
    const { messages } = body;
    
    /**
     * ═══════════════════════════════════════════════════════════════════
     * INPUT VALIDATION
     * ═══════════════════════════════════════════════════════════════════
     */
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }
    
    // Validate message structure
    const invalidMessage = messages.find(m => 
      !m.role || 
      !m.content || 
      typeof m.content !== 'string' ||
      m.content.trim().length === 0
    );
    
    if (invalidMessage) {
      console.error('[Analysis API] Invalid message structure');
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }
    
    // Reasonable length check
    if (messages.length > 30) {
      console.error('[Analysis API] Conversation too long:', messages.length);
      return NextResponse.json(
        { error: 'Conversation too long to analyze' },
        { status: 400 }
      );
    }
    
    console.log(`[Analysis API] Analyzing conversation with ${messages.length} messages`);
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Format Conversation for GPT-4
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * WHY format as text: GPT-4 analyzes better with readable format
     * Easier to reference "what the founder said" when it's formatted
     */
    const conversationText = formatConversation(messages);
    console.log('[Analysis API] Formatted conversation for analysis');
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 2.5: SEARCH FOR REAL COMPETITORS (NEW!)
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * COMPETITOR SEARCH INTEGRATION:
     * 
     * WHY search before analysis:
     * - Gives GPT-4 REAL data to work with (not hallucinated competitors)
     * - Makes analysis credible and specific
     * - Can reference actual companies by name
     * - User can click links to check out competitors
     * 
     * WHY extract from first message:
     * - First user message = the core problem/idea statement
     * - Best signal for what to search for
     * - Rest of conversation is follow-up Q&A
     * 
     * GRACEFUL DEGRADATION:
     * If search fails or returns nothing:
     * - Analysis still happens (don't block user)
     * - GPT-4 works with general knowledge
     * - User gets analysis, just without specific competitors listed
     * 
     * PERFORMANCE IMPACT:
     * Search adds ~500-1000ms to analysis time
     * Total: 4-6 seconds instead of 3-5 seconds
     * Acceptable tradeoff for real data
     */
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
    const competitors = await searchCompetitors(firstUserMessage);
    
    console.log(`[Analysis API] Found ${competitors.length} real competitors via Brave Search`);
    
    // Format competitor data for GPT-4 prompt
    const competitorContext = competitors.length > 0
      ? `

═══════════════════════════════════════════════════════════════════════
REAL COMPETITORS FOUND VIA BRAVE SEARCH API
═══════════════════════════════════════════════════════════════════════

The following are ACTUAL companies found by searching the web.
These are NOT made up - they are real competitors in this space.

${competitors.map((c, idx) => `
${idx + 1}. ${c.name}
   Description: ${c.description}
   Website: ${c.url}
   Relevance Score: ${c.relevanceScore}/100
`).join('\n')}

CRITICAL INSTRUCTIONS FOR COMPETITOR ANALYSIS:
1. You MUST reference these actual competitors by name in your analysis
2. Explain specifically how the founder's idea differs from each competitor
3. Assess whether the market is crowded (many competitors) or has room
4. Evaluate if the founder has a competitive advantage vs these companies
5. Be brutally honest: if a competitor already does this well, SAY SO
6. Do NOT make up or hallucinate additional competitors
7. Only reference the companies listed above

Your analysis will be MORE credible because you're using real data.
Users can click the competitor links to verify your claims.

═══════════════════════════════════════════════════════════════════════
`
      : `

═══════════════════════════════════════════════════════════════════════
NO SPECIFIC COMPETITORS FOUND
═══════════════════════════════════════════════════════════════════════

Web search found no direct competitors for this idea.

This could mean:
1. It's a blue ocean opportunity (rare but possible)
2. The problem isn't clearly defined enough to search for
3. It's too niche for mainstream search results
4. The search query didn't capture the right keywords

CRITICAL INSTRUCTIONS:
1. Analyze whether "no competitors" is GOOD or BAD in this case
2. Consider: "If this problem was real and big, wouldn't someone have built this?"
3. This could be a red flag (problem not real) or opportunity (blue ocean)
4. Do NOT hallucinate or make up competitors
5. Do NOT assume competitors exist if we didn't find them
6. Mention the lack of competitors as part of your analysis

Be honest about what "no competitors" means for this specific idea.

═══════════════════════════════════════════════════════════════════════
`;
    
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
    // STEP 4: Call GPT-4 to Generate Analysis
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * GPT-4 API PARAMETERS EXPLAINED:
     * 
     * model: gpt-4-turbo
     * - Best balance of speed and intelligence
     * - Good at following complex instructions
     * - Reliable JSON output
     * 
     * temperature: 0.7
     * - Lower than conversation (0.9) because we want consistency
     * - Still allows for natural language
     * - Not too rigid (0) but not too creative (1)
     * 
     * max_tokens: 2000
     * - Enough for comprehensive analysis
     * - Covers all sections with detail
     * - ~1500 words of output
     * 
     * response_format: { type: "json_object" }
     * - NEW OpenAI feature: Guarantees valid JSON output
     * - Reduces parsing errors significantly
     * - Still need validation for field completeness
     * 
     * WHY we use response_format:
     * Before this, GPT-4 would sometimes wrap JSON in text or markdown.
     * This ensures we get pure JSON, making parsing much more reliable.
     */
    console.log('[Analysis API] Calling GPT-4 for comprehensive analysis...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: getAnalysisPrompt(conversationText) + competitorContext
        }
      ],
      temperature: 0.7,      // Balanced - not too rigid, not too creative
      max_tokens: 2000,      // Room for comprehensive analysis
      response_format: { type: "json_object" }  // Guarantee JSON output
    });
    
    const analysisText = completion.choices[0].message.content;
    console.log('[Analysis API] GPT-4 analysis received');
    console.log('[Analysis API] Raw response (first 1000 chars):', analysisText.substring(0, 1000));
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Parse and Validate JSON Response
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * WHY validate: Even with response_format: json_object, GPT-4 might:
     * - Miss a required field
     * - Use wrong data types
     * - Return empty arrays
     * 
     * Validation ensures we return valid data to frontend
     */
    let analysis;
    try {
      analysis = parseAndValidateAnalysis(analysisText);
      console.log(`[Analysis API] Analysis validated - Score: ${analysis.score}, Verdict: ${analysis.verdict}`);
    } catch (validationError) {
      console.error('[Analysis API] Validation failed:', validationError.message);
      console.error('[Analysis API] Full raw response:', analysisText);
      
      // Retry once with stricter prompt
      console.log('[Analysis API] Retrying with stricter JSON instructions...');
      
      const retryCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: getAnalysisPrompt(conversationText) + competitorContext + `

CRITICAL: You MUST include AT LEAST:
- 2 items in "promising" array
- 3 items in "reality" array  
- 2 items in "pivotIdeas" array
- 3 items in "nextSteps" array

Return ONLY the JSON object with all fields populated. No extra text.`
          }
        ],
        temperature: 0.5,  // Lower temperature for more reliable output
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
      
      const retryText = retryCompletion.choices[0].message.content;
      console.log('[Analysis API] Retry response (first 1000 chars):', retryText.substring(0, 1000));
      
      try {
        analysis = parseAndValidateAnalysis(retryText);
        console.log('[Analysis API] Retry successful');
      } catch (retryError) {
        console.error('[Analysis API] Retry also failed:', retryError.message);
        console.error('[Analysis API] Full retry response:', retryText);
        
        // If both attempts fail, return a user-friendly error
        return NextResponse.json({
          error: 'Failed to generate a complete analysis. Please try again.',
          details: 'The AI could not generate all required sections of the analysis.'
        }, { status: 500 });
      }
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 6: Return Analysis to Frontend
    // ─────────────────────────────────────────────────────────────────────
    
    /**
     * SUCCESS RESPONSE:
     * Frontend receives validated analysis object
     * All fields guaranteed to be present and valid
     * Ready to display in results page
     * 
     * NEW: Now includes competitors array
     * Frontend can display these as clickable cards
     */
    return NextResponse.json({
      ...analysis,
      competitors: competitors  // Include real competitor data
    });
    
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════════
    // COMPREHENSIVE ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════════
    
    console.error('[Analysis API] Error:', error);
    console.error('[Analysis API] Error stack:', error.stack);
    
    // OpenAI-specific errors
    if (error.code === 'insufficient_quota') {
      console.error('[Analysis API] OpenAI quota exceeded');
      return NextResponse.json({
        error: 'Service temporarily unavailable. Please try again later.',
      }, { status: 503 });
    }
    
    if (error.code === 'invalid_api_key') {
      console.error('[Analysis API] Invalid OpenAI API key');
      return NextResponse.json({
        error: 'Service configuration error. Please contact support.',
      }, { status: 500 });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      console.error('[Analysis API] OpenAI rate limit exceeded');
      return NextResponse.json({
        error: 'Too many requests. Please wait a moment and try again.',
      }, { status: 429 });
    }
    
    if (error.code === 'context_length_exceeded') {
      console.error('[Analysis API] Context length exceeded');
      return NextResponse.json({
        error: 'Conversation too long to analyze. Please start a new conversation.',
      }, { status: 400 });
    }
    
    // Network/timeout errors
    if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      console.error('[Analysis API] Request timeout');
      return NextResponse.json({
        error: 'Analysis timed out. Please try again.',
      }, { status: 504 });
    }
    
    // JSON parsing errors (shouldn't happen with response_format, but just in case)
    if (error instanceof SyntaxError) {
      console.error('[Analysis API] Invalid JSON in request');
      return NextResponse.json({
        error: 'Invalid request format.',
      }, { status: 400 });
    }
    
    // Validation errors from parseAndValidateAnalysis
    if (error.message?.includes('Invalid') || error.message?.includes('Missing')) {
      console.error('[Analysis API] Validation error:', error.message);
      return NextResponse.json({
        error: 'Failed to generate valid analysis. Please try again.',
      }, { status: 500 });
    }
    
    // Generic fallback
    return NextResponse.json({
      error: 'Failed to generate analysis. Please try again.',
    }, { status: 500 });
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * TESTING THE ANALYSIS API
 * ════════════════════════════════════════════════════════════════════════
 * 
 * TEST REQUEST (using fetch or Postman):
 * 
 * POST http://localhost:3000/api/analyze
 * 
 * Body:
 * {
 *   "messages": [
 *     { "role": "user", "content": "I want to build a screen time limiter for parents" },
 *     { "role": "assistant", "content": "Who specifically has this problem?" },
 *     { "role": "user", "content": "Parents of teenagers who spend too much time on phones" },
 *     { "role": "assistant", "content": "Will parents pay for this?" },
 *     { "role": "user", "content": "I think so, maybe $5/month" },
 *     ... (7 exchanges total)
 *   ]
 * }
 * 
 * EXPECTED RESPONSE:
 * {
 *   "score": 58,
 *   "verdict": "Needs Work",
 *   "promising": [
 *     "You identified a real pain point parents have",
 *     "Clear target audience (parents of teens)",
 *     "Existing behavior (parents already try to limit screen time)"
 *   ],
 *   "reality": [
 *     "You admitted students don't want this - that's a HUGE problem",
 *     "Parents won't pay much ($2-5/month max), hard to build a business",
 *     "Apple/Google could add this to parental controls tomorrow",
 *     "Forcing an app on unwilling users never works"
 *   ],
 *   "pivotIdeas": [
 *     "Instead of locking, what about rewarding? Gamify healthy phone usage",
 *     "Target students directly with productivity features THEY want",
 *     "B2B play: Sell to schools for classroom management"
 *   ],
 *   "nextSteps": [
 *     "Interview 20 parents - would they pay $5/month? Be honest about results",
 *     "Talk to 10 students - what would make THEM want to use this?",
 *     "Research existing parental control apps - what's actually missing?"
 *   ]
 * }
 * 
 * WHAT TO CHECK:
 * ✓ Score is in valid range (0-100)
 * ✓ Verdict matches score (low score = Pivot Recommended, etc.)
 * ✓ Analysis references specific things from conversation
 * ✓ Reality section is brutally honest
 * ✓ Pivots are specific and actionable
 * ✓ Next steps are concrete (not vague advice)
 * 
 * ════════════════════════════════════════════════════════════════════════
 */

