'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * COMPETITOR CARD - Visual Competitor Display
 * ════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN DECISIONS:
 * 
 * WHY show competitors as links:
 * - Builds trust (users can verify claims)
 * - Demonstrates thoroughness (real research)
 * - Useful reference (bookmark for later)
 * - Shows we're not making things up
 * 
 * WHY hover states:
 * - Shows interactivity (affordance)
 * - Provides feedback (responsive UI)
 * - Guides user to click
 * - Premium feel (polished details)
 * 
 * WHY limit to 5 competitors:
 * - Prevents overwhelming user
 * - Forces prioritization (show most relevant)
 * - Fits on screen without scrolling
 * - Respects attention span
 * 
 * WHY empty state matters:
 * - Handles edge case gracefully
 * - Provides context (not a bug, intentional)
 * - Explains what it means (opportunity or red flag)
 * - Maintains conversational tone
 * 
 * DATA STRUCTURE:
 * competitors = [
 *   { name: string, description: string, url: string },
 *   ...
 * ]
 */

export function CompetitorCard({ competitors }) {
  return (
    <div>
      
      {/* 
        TITLE
        Removed emoji for cleaner look
        
        MOBILE OPTIMIZATION:
        - Responsive text sizing
        - Adjusted spacing
        - Added horizontal padding
      */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center px-4">
        The Competition
      </h2>

      {/* 
        SUBTITLE WITH COUNT
        
        WHY show count:
        - Sets expectations (3 items to read)
        - Provides context (many vs few competitors)
        - Adds specificity (not just "some companies")
        
        MOBILE OPTIMIZATION:
        - Responsive text size
        - Adjusted spacing
      */}
      <p className="text-center text-sm sm:text-base text-gray-400 mb-6 sm:mb-10 px-4">
        {competitors.length} {competitors.length === 1 ? 'company' : 'companies'} already doing this
      </p>

      {/* 
        COMPETITOR LIST
        
        LAYOUT: Vertical stack (space-y-4)
        Each competitor gets its own card
        
        MOBILE OPTIMIZATION:
        - Adjusted spacing (space-y-3 sm:space-y-4)
      */}
      <div className="space-y-3 sm:space-y-4">
        {competitors.slice(0, 5).map((comp, i) => (
          
          /* 
            COMPETITOR LINK CARD
            
            WHY <a> tag:
            - Semantic HTML (link to external site)
            - Works with keyboard nav (Tab key)
            - Supports right-click → "Open in new tab"
            - Accessible (screen readers announce as link)
            
            WHY target="_blank":
            - Opens in new tab (doesn't lose progress)
            - Standard for external links
            
            WHY rel="noopener noreferrer":
            - Security: Prevents new tab from accessing window.opener
            - Privacy: Doesn't send referrer info
            - Best practice for target="_blank"
            
            HOVER EFFECTS:
            - Border lightens (border-gray-800 → border-gray-700)
            - Background lightens (shows interactivity)
            - Arrow animates (→ signals clickability)
            
            MOBILE OPTIMIZATION:
            - Responsive padding (p-4 sm:p-6)
            - Touch-friendly sizing
            - Responsive border radius
          */
          <a
            key={i}
            href={comp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#111111] border border-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-gray-700 hover:bg-[#1A1A1A] transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              
              {/* 
                LEFT SIDE: Content
              */}
              <div className="flex-1 min-w-0">
                
                {/* 
                  COMPANY NAME
                  
                  WHY group-hover effect:
                  - Provides feedback that entire card is clickable
                  - Subtle color shift (white → gray-200)
                  - Text is the main clickable element
                  
                  MOBILE OPTIMIZATION:
                  - Responsive text size
                  - Word break for long names
                */}
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2 group-hover:text-gray-200 break-words">
                  {comp.name}
                </h3>
                
                {/* 
                  COMPANY DESCRIPTION
                  
                  WHY text-sm:
                  - Secondary information (smaller than name)
                  - Fits more text in limited space
                  
                  WHY leading-relaxed:
                  - Better readability for multi-line text
                  - Prevents cramped feeling
                  
                  MOBILE OPTIMIZATION:
                  - Slightly smaller text on mobile
                */}
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed break-words">
                  {comp.description}
                </p>
              </div>
              
              {/* 
                RIGHT SIDE: Arrow indicator
                
                WHY arrow:
                - Universal "go to" symbol
                - Reinforces clickability
                - Provides direction (external link)
                
                WHY ml-4:
                - Separates from text
                - Prevents text from wrapping under arrow
                
                WHY color transition:
                - Subtle hover feedback
                - Matches overall hover state
                
                MOBILE OPTIMIZATION:
                - Slightly larger on mobile for better visibility
                - Fixed width to prevent layout shift
              */}
              <div className="flex-shrink-0 text-lg sm:text-xl text-gray-600 group-hover:text-gray-400 transition-colors">
                →
              </div>
              
            </div>
          </a>
        ))}
      </div>

      {/* 
        EMPTY STATE
        
        WHEN SHOWN: competitors.length === 0
        
        WHY important:
        - Prevents blank screen (confusing)
        - Explains what absence means
        - Provides context (not a bug)
        - Maintains conversational tone
        
        MESSAGE STRATEGY:
        - Acknowledges the finding (no competitors)
        - Presents both interpretations:
          1. Blue ocean opportunity (positive spin)
          2. Problem isn't real (realistic caution)
        - Doesn't tell user what to think
        - Matches the honest, challenging tone of the tool
        
        MOBILE OPTIMIZATION:
        - Responsive padding
        - Responsive text size
      */}
      {competitors.length === 0 && (
        <div className="bg-[#111111] border border-gray-800 rounded-lg sm:rounded-xl p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-gray-400">
            No direct competitors found. This could mean blue ocean opportunity... or that the problem isn't real.
          </p>
        </div>
      )}

    </div>
  )
}

