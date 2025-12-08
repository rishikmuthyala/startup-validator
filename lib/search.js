/**
 * ════════════════════════════════════════════════════════════════════════
 * BRAVE SEARCH API - Real Competitor Research
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Find ACTUAL competitors for startup ideas using Brave Search API.
 * No more AI hallucination - we search the web for real companies.
 * 
 * WHY BRAVE SEARCH:
 * - Independent search index (not Google)
 * - Clean, structured API responses
 * - Generous free tier (2,000 requests/month)
 * - No tracking or data collection
 * - Fast response times (~500-1000ms)
 * 
 * INTEGRATION FLOW:
 * 1. Extract keywords from startup idea
 * 2. Search Brave API for related companies
 * 3. Filter out noise (news sites, Wikipedia, etc.)
 * 4. Score relevance to original idea
 * 5. Return top 5 most relevant competitors
 * 
 * GRACEFUL DEGRADATION:
 * If search fails at ANY point, return empty array.
 * Analysis should NEVER be blocked by search failures.
 * Better to have no competitors than to crash the analysis.
 */

// ═══════════════════════════════════════════════════════════════════════
// KEYWORD EXTRACTION - Turn idea into search query
// ═══════════════════════════════════════════════════════════════════════

/**
 * Extract searchable keywords from startup idea description
 * 
 * STRATEGY:
 * - Remove common stop words (the, a, an, for, to, etc.)
 * - Keep meaningful words (nouns, verbs, domain terms)
 * - Take first 4-6 keywords for search
 * 
 * WHY NOT USE GPT-4 FOR THIS:
 * - Faster (no API call = instant)
 * - Free (no OpenAI cost)
 * - Good enough for most cases
 * - Simple extraction works 90% of the time
 * 
 * EXAMPLES:
 * Input: "AI-powered study app for college students"
 * Output: "AI-powered study app college students"
 * 
 * Input: "Social network for dog owners to meet up"
 * Output: "social network dog owners meet"
 * 
 * @param {string} ideaDescription - Full startup idea from user
 * @returns {string} Cleaned search query
 */
function extractKeywords(ideaDescription) {
  // Common words to remove (don't add value to search)
  const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'for', 'to', 'of', 
    'in', 'on', 'at', 'with', 'by', 'from', 'about', 'as',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'can', 'could', 'should', 'may', 'might', 'must',
    'i', 'we', 'my', 'our', 'want', 'build', 'create', 'make'
  ];
  
  // Convert to lowercase and split into words
  const words = ideaDescription
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Remove punctuation except hyphens
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && // Keep words longer than 2 chars
      !stopWords.includes(word) // Remove stop words
    );
  
  // Take first 6 meaningful words
  // WHY 6: Balance between specificity and not-too-narrow search
  const keywords = words.slice(0, 6).join(' ');
  
  console.log('[Search] Extracted keywords:', keywords);
  return keywords;
}

// ═══════════════════════════════════════════════════════════════════════
// BRAVE API CALL - Search the web
// ═══════════════════════════════════════════════════════════════════════

/**
 * Call Brave Search API to find competitors
 * 
 * BRAVE API DETAILS:
 * - Endpoint: https://api.search.brave.com/res/v1/web/search
 * - Auth: X-Subscription-Token header (NOT Authorization)
 * - Parameters:
 *   - q: Search query (URL encoded)
 *   - count: Number of results (we request 10, filter to top 5)
 * 
 * RESPONSE STRUCTURE:
 * {
 *   web: {
 *     results: [
 *       {
 *         title: "Company Name - Tagline",
 *         description: "Brief description...",
 *         url: "https://example.com",
 *         ...
 *       }
 *     ]
 *   }
 * }
 * 
 * ERROR HANDLING:
 * - Missing API key: Warn and return null
 * - Rate limit (429): Log and return null
 * - Network error: Log and return null
 * - Invalid JSON: Log and return null
 * 
 * WHY return null on error:
 * Signals to caller that search failed, but doesn't crash.
 * Caller can continue with empty competitor list.
 * 
 * @param {string} searchQuery - Keywords to search for
 * @returns {Promise<Object|null>} Brave API response or null on error
 */
async function callBraveSearch(searchQuery) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  
  // Check if API key is configured
  if (!apiKey) {
    console.warn('[Search] BRAVE_SEARCH_API_KEY not configured - skipping search');
    return null;
  }
  
  try {
    console.log('[Search] Calling Brave API...');
    
    // Build search URL with encoded query
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=10`;
    
    // Set timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey // CRITICAL: Must use X-Subscription-Token
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      // Handle rate limiting
      if (response.status === 429) {
        console.error('[Search] Rate limit exceeded (429) - Free tier is 2000/month');
        return null;
      }
      
      // Handle other errors
      if (!response.ok) {
        console.error(`[Search] Brave API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`[Search] Received ${data.web?.results?.length || 0} results`);
      
      return data;
      
    } catch (fetchError) {
      clearTimeout(timeout);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Search] Request timed out after 5s');
      } else {
        throw fetchError;
      }
      return null;
    }
    
  } catch (error) {
    console.error('[Search] Brave API call failed:', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RESULT FILTERING - Remove noise, keep competitors
// ═══════════════════════════════════════════════════════════════════════

/**
 * Filter search results to find actual competitor products
 * 
 * WHY FILTER:
 * Raw search results include lots of noise:
 * - News articles about the industry
 * - Blog posts and how-to guides
 * - Wikipedia and generic directories
 * - Reddit discussions
 * - YouTube videos
 * 
 * WHAT WE WANT:
 * - Actual product/company websites
 * - SaaS platforms
 * - Startups in the same space
 * - Real competitors users would encounter
 * 
 * FILTERING STRATEGY:
 * 1. Exclude generic domains (Wikipedia, LinkedIn, etc.)
 * 2. Exclude news/blog paths (/blog/, /news/, /article/)
 * 3. Prefer product indicators (pricing, features, demo, signup)
 * 4. Prefer simple URLs (homepages > deep pages)
 * 
 * EXAMPLES OF WHAT WE FILTER OUT:
 * ❌ "How to build a study app" (blog post)
 * ❌ "Top 10 study apps 2024" (listicle)
 * ❌ "Study App - Wikipedia" (generic info)
 * ❌ "r/startups discussion about study apps" (forum)
 * 
 * EXAMPLES OF WHAT WE KEEP:
 * ✅ "Quizlet - Study with flashcards" (actual product)
 * ✅ "StudyBlue | Make and share study materials" (competitor)
 * ✅ "Notion AI - Connected workspace" (related product)
 * 
 * @param {Array} results - Raw Brave search results
 * @returns {Array} Filtered results (likely competitors)
 */
function filterCompetitorResults(results) {
  if (!results || results.length === 0) {
    return [];
  }
  
  // Domains to exclude (too generic, not competitors)
  const excludeDomains = [
    'wikipedia.org',
    'linkedin.com',
    'facebook.com',
    'twitter.com',
    'crunchbase.com',
    'forbes.com',
    'techcrunch.com',
    'reddit.com',
    'quora.com',
    'youtube.com',
    'medium.com',
    'producthunt.com' // Lists of products, not products themselves
  ];
  
  // Keywords that indicate a product page (good signal)
  const productIndicators = [
    'pricing',
    'features',
    'demo',
    'signup',
    'sign-up',
    'login',
    'get-started',
    'app.',
    'use',
    'platform',
    'software',
    'tool',
    'product'
  ];
  
  // Keywords that indicate NOT a product (bad signal)
  const nonProductIndicators = [
    '/blog/',
    '/news/',
    '/article/',
    '/how-to/',
    '/guide/',
    '/tutorial/',
    '/review/',
    '/vs/',
    '/comparison/'
  ];
  
  return results.filter(result => {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();
    const description = (result.description || '').toLowerCase();
    
    // 1. Exclude generic domains
    if (excludeDomains.some(domain => url.includes(domain))) {
      console.log('[Search] Filtered out (generic domain):', result.title);
      return false;
    }
    
    // 2. Exclude news/blog content
    if (nonProductIndicators.some(indicator => url.includes(indicator))) {
      console.log('[Search] Filtered out (blog/news):', result.title);
      return false;
    }
    
    // 3. Exclude "how to" type content
    if (title.includes('how to') || title.includes('guide to') || title.includes('best')) {
      console.log('[Search] Filtered out (guide/listicle):', result.title);
      return false;
    }
    
    // 4. Prefer results with product signals
    const hasProductSignal = productIndicators.some(indicator => 
      url.includes(indicator) || title.includes(indicator) || description.includes(indicator)
    );
    
    // 5. Prefer homepages (simple URLs)
    const urlParts = url.replace('https://', '').replace('http://', '').split('/');
    const isHomepageOrSimple = urlParts.length <= 3; // domain.com or domain.com/page
    
    // Keep if: has product signal OR is a simple/homepage URL
    const shouldKeep = hasProductSignal || isHomepageOrSimple;
    
    if (shouldKeep) {
      console.log('[Search] Kept result:', result.title);
    }
    
    return shouldKeep;
  });
}

// ═══════════════════════════════════════════════════════════════════════
// RELEVANCE SCORING - Rank competitors by match quality
// ═══════════════════════════════════════════════════════════════════════

/**
 * Score how relevant a search result is to the original idea
 * 
 * SCORING SYSTEM (0-100):
 * - Base score: 50 points (neutral)
 * - +10 points: Each keyword match in title
 * - +5 points: Each keyword match in description
 * - +15 points: URL looks like SaaS product (app., get, use)
 * - +10 points: Description mentions platform/software/app/tool
 * - Cap at 100 points max
 * 
 * WHY SCORE:
 * Search returns 10 results, but quality varies widely.
 * Some are highly relevant (direct competitors).
 * Some are tangentially related (same industry, different product).
 * Scoring helps us show the BEST 5 competitors.
 * 
 * EXAMPLE SCORES:
 * 
 * "Quizlet - Study with flashcards" for "AI study app"
 * - Base: 50
 * - "study" in title: +10
 * - "app" in description: +10
 * - app.quizlet.com: +15
 * - "platform" in desc: +10
 * = 95/100 (highly relevant!)
 * 
 * "EdTech News - Latest in Education Technology"
 * - Base: 50
 * - No keyword matches: 0
 * - Generic URL: 0
 * = 50/100 (neutral, will be filtered by sort)
 * 
 * @param {Object} result - Search result with title, description, url
 * @param {string} originalKeywords - Keywords we searched for
 * @returns {number} Relevance score 0-100
 */
function scoreRelevance(result, originalKeywords) {
  let score = 50; // Start with neutral score
  
  const title = result.title.toLowerCase();
  const description = (result.description || '').toLowerCase();
  const url = result.url.toLowerCase();
  const keywords = originalKeywords.toLowerCase().split(' ');
  
  // +10 points for each keyword in title (title is most important)
  keywords.forEach(keyword => {
    if (keyword.length > 2 && title.includes(keyword)) {
      score += 10;
      console.log(`[Search] +10 for "${keyword}" in title`);
    }
  });
  
  // +5 points for each keyword in description
  keywords.forEach(keyword => {
    if (keyword.length > 2 && description.includes(keyword)) {
      score += 5;
      console.log(`[Search] +5 for "${keyword}" in description`);
    }
  });
  
  // +15 if URL looks like a SaaS product
  if (url.includes('app.') || url.includes('get') || url.includes('use') || url.includes('my.')) {
    score += 15;
    console.log('[Search] +15 for SaaS-like URL');
  }
  
  // +10 if description mentions product/platform/software/tool
  const productTerms = ['platform', 'software', 'app', 'tool', 'service', 'solution'];
  if (productTerms.some(term => description.includes(term))) {
    score += 10;
    console.log('[Search] +10 for product terminology');
  }
  
  // Cap at 100
  const finalScore = Math.min(score, 100);
  console.log(`[Search] Final relevance score: ${finalScore}/100 for "${result.title}"`);
  
  return finalScore;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPANY NAME EXTRACTION - Clean up titles
// ═══════════════════════════════════════════════════════════════════════

/**
 * Extract clean company name from search result title or URL
 * 
 * PROBLEM:
 * Search result titles are often formatted like:
 * - "Quizlet | Flashcards, Learning Tools and More"
 * - "Notion – The all-in-one workspace"
 * - "StudyBlue: Make and Share Study Materials"
 * 
 * We want just: "Quizlet", "Notion", "StudyBlue"
 * 
 * STRATEGY:
 * 1. Try to extract from title (before separator: -, |, :)
 * 2. If that fails, extract from domain name
 * 3. Clean up common suffixes (.com, .io, etc.)
 * 4. Capitalize properly
 * 
 * @param {string} title - Full title from search result
 * @param {string} url - URL of the result (fallback)
 * @returns {string} Clean company name
 */
function extractCompanyName(title, url) {
  // Try to get clean name from title (before separators)
  const separators = [' - ', ' | ', ': ', ' – ', ' — '];
  
  for (const separator of separators) {
    if (title.includes(separator)) {
      const name = title.split(separator)[0].trim();
      if (name.length > 0 && name.length < 50) { // Sanity check
        return name;
      }
    }
  }
  
  // Fallback: extract from domain name
  try {
    const domain = new URL(url).hostname;
    const name = domain
      .replace('www.', '')
      .replace('app.', '')
      .replace('get', '')
      .replace('use', '')
      .split('.')[0]; // Get first part before .com/.io/etc
    
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    // If URL parsing fails, just use first 30 chars of title
    return title.substring(0, 30).trim();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT - Search for competitors
// ═══════════════════════════════════════════════════════════════════════

/**
 * Search for real competitors based on startup idea
 * 
 * This is the main function called by the analysis API.
 * 
 * COMPLETE FLOW:
 * 1. Extract keywords from idea description
 * 2. Call Brave Search API
 * 3. Filter results (remove noise)
 * 4. Score relevance of each result
 * 5. Sort by relevance (best first)
 * 6. Return top 5 competitors
 * 
 * RETURN FORMAT:
 * [
 *   {
 *     name: "Quizlet",
 *     description: "Study with flashcards and games",
 *     url: "https://quizlet.com",
 *     relevanceScore: 95
 *   },
 *   ...
 * ]
 * 
 * GRACEFUL DEGRADATION:
 * - If API key missing: return []
 * - If API call fails: return []
 * - If no results found: return []
 * - If all results filtered: return []
 * 
 * NEVER throws errors. Always returns array (empty or with results).
 * 
 * WHY THIS MATTERS:
 * The analysis API should NEVER fail because search failed.
 * Better to have analysis without competitors than no analysis at all.
 * 
 * @param {string} ideaDescription - Full startup idea from user
 * @returns {Promise<Array>} Array of competitor objects (0-5 items)
 */
export async function searchCompetitors(ideaDescription) {
  try {
    console.log('[Search] ═══════════════════════════════════════════════════');
    console.log('[Search] Starting competitor search...');
    console.log('[Search] Idea:', ideaDescription.substring(0, 100) + '...');
    
    // ─────────────────────────────────────────────────────────────────
    // STEP 1: Extract search keywords
    // ─────────────────────────────────────────────────────────────────
    const searchQuery = extractKeywords(ideaDescription);
    
    if (!searchQuery || searchQuery.length < 3) {
      console.warn('[Search] Keywords too short, skipping search');
      return [];
    }
    
    // ─────────────────────────────────────────────────────────────────
    // STEP 2: Call Brave Search API
    // ─────────────────────────────────────────────────────────────────
    const braveResponse = await callBraveSearch(searchQuery);
    
    if (!braveResponse || !braveResponse.web?.results) {
      console.warn('[Search] No results from Brave API');
      return [];
    }
    
    const rawResults = braveResponse.web.results;
    console.log(`[Search] Received ${rawResults.length} raw results`);
    
    // ─────────────────────────────────────────────────────────────────
    // STEP 3: Filter to find actual competitors
    // ─────────────────────────────────────────────────────────────────
    const filtered = filterCompetitorResults(rawResults);
    console.log(`[Search] Filtered to ${filtered.length} potential competitors`);
    
    if (filtered.length === 0) {
      console.warn('[Search] All results filtered out (no competitors found)');
      return [];
    }
    
    // ─────────────────────────────────────────────────────────────────
    // STEP 4: Score relevance and format
    // ─────────────────────────────────────────────────────────────────
    const competitors = filtered
      .map(result => ({
        name: extractCompanyName(result.title, result.url),
        description: result.description || 'No description available',
        url: result.url,
        relevanceScore: scoreRelevance(result, searchQuery)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance (highest first)
      .slice(0, 5); // Take top 5 most relevant
    
    console.log(`[Search] Returning ${competitors.length} competitors:`);
    competitors.forEach((c, i) => {
      console.log(`[Search]   ${i + 1}. ${c.name} (${c.relevanceScore}/100)`);
    });
    console.log('[Search] ═══════════════════════════════════════════════════');
    
    return competitors;
    
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════
    // CRITICAL ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════
    
    console.error('[Search] ❌ Unexpected error in searchCompetitors:', error);
    console.error('[Search] Stack:', error.stack);
    
    // NEVER throw - always return empty array
    // Analysis must continue even if search completely fails
    return [];
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLE (for testing)
 * ════════════════════════════════════════════════════════════════════════
 * 
 * import { searchCompetitors } from './lib/search.js';
 * 
 * const competitors = await searchCompetitors("AI-powered study app for students");
 * 
 * console.log(competitors);
 * // [
 * //   {
 * //     name: "Quizlet",
 * //     description: "Study with flashcards, games, and more",
 * //     url: "https://quizlet.com",
 * //     relevanceScore: 95
 * //   },
 * //   {
 * //     name: "Notion AI",
 * //     description: "Connected workspace with AI writing assistant",
 * //     url: "https://notion.so",
 * //     relevanceScore: 78
 * //   },
 * //   ...
 * // ]
 * 
 * ════════════════════════════════════════════════════════════════════════
 * DEBUGGING TIPS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * If no competitors are found:
 * 1. Check console logs for each step
 * 2. Verify BRAVE_SEARCH_API_KEY is set in .env.local
 * 3. Check if keywords are too generic/specific
 * 4. Check if all results are being filtered (reduce filter strictness)
 * 5. Check relevance scores (might need to adjust scoring)
 * 
 * If wrong competitors appear:
 * 1. Adjust keyword extraction (more/fewer keywords)
 * 2. Add more domains to excludeDomains list
 * 3. Adjust relevance scoring weights
 * 4. Add more product/non-product indicators
 * 
 * If search is too slow:
 * 1. Reduce timeout from 5s to 3s
 * 2. Reduce count parameter from 10 to 5
 * 3. Consider caching results (same query = same results)
 * 
 * ════════════════════════════════════════════════════════════════════════
 */
