'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * ACTION CARD - Next Steps with Numbers
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ENGAGEMENT PSYCHOLOGY:
 * 
 * WHY numbered circles:
 * - Creates visual hierarchy (1 → 2 → 3)
 * - Shows sequence/priority
 * - More scannable than bullet points
 * - Feels organized and actionable
 * 
 * WHY separate cards per step:
 * - Easier to scan (each step is distinct)
 * - Creates breathing room (not dense)
 * - Better for mobile (tap-friendly spacing)
 * - Matches modern task list UX (Linear, Notion, Todoist)
 * 
 * WHY action-oriented language:
 * - Steps should start with verbs ("Talk to...", "Build...", "Research...")
 * - Concrete actions (not vague advice)
 * - Achievable in 1 week (not overwhelming)
 * - Respects founder's time
 * 
 * COMPONENT ARCHITECTURE:
 * - Accepts title and steps array
 * - Renders each step as numbered card
 * - Consistent spacing and styling
 */

export function ActionCard({ title, steps }) {
  return (
    <div>
      
      {/* 
        TITLE
        Usually "What To Do Next" or "Your Action Plan"
        Removed emoji for cleaner look
        
        MOBILE OPTIMIZATION:
        - Responsive text sizing
        - Adjusted spacing
      */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-center px-4">
        {title}
      </h2>

      {/* 
        SUBTITLE
        Sets scope (immediate actions, not 5-year plan)
        
        MOBILE OPTIMIZATION:
        - Responsive text size
        - Adjusted bottom margin
      */}
      <p className="text-center text-sm sm:text-base text-gray-400 mb-6 sm:mb-10 px-4">
        Start with these concrete actions
      </p>

      {/* 
        NUMBERED STEPS LIST
        
        REDESIGNED for elegance:
        - Clean minimal cards
        - Number badge with gradient background
        - Hover states for interactivity
        
        MOBILE OPTIMIZATION:
        - Adjusted spacing between cards
      */}
      <div className="space-y-3 sm:space-y-4">
        {steps.map((step, i) => (
          
          /* 
            STEP CARD
            
            REFINED DESIGN:
            - Cleaner spacing
            - Hover effects for engagement
            - Number badge is more prominent
            - Better visual hierarchy
            
            MOBILE OPTIMIZATION:
            - Responsive padding (p-4 sm:p-6 md:p-8)
            - Touch-friendly spacing
          */
          <div 
            key={i}
            className="relative bg-[#111111] border border-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 group hover:bg-[#1A1A1A] hover:border-gray-700 transition-all"
          >
            <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
              
              {/* 
                NUMBER BADGE
                
                REDESIGNED:
                - White background (stands out more)
                - Black text (high contrast)
                - Slightly smaller but bolder
                - Creates clear visual hierarchy
                
                MOBILE OPTIMIZATION:
                - Responsive sizing (w-8 h-8 sm:w-10 sm:h-10)
                - Adjusted font size
              */}
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-md sm:rounded-lg flex items-center justify-center">
                <span className="text-base sm:text-lg font-bold text-black">
                  {i + 1}
                </span>
              </div>

              {/* 
                STEP TEXT
                
                IMPROVEMENTS:
                - Better color on hover
                - Smoother transitions
                - Cleaner spacing
                
                MOBILE OPTIMIZATION:
                - Responsive text size (text-base sm:text-lg md:text-xl)
                - Adjusted padding top
              */}
              <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed flex-1 pt-0.5 sm:pt-1.5 group-hover:text-white transition-colors">
                {step}
              </p>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  )
}

