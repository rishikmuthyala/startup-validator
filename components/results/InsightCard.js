'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * INSIGHT CARD - Text-Based Insights (The Good, The Reality, Pivots)
 * ════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN PHILOSOPHY:
 * 
 * WHY tone variants (positive/neutral/warning):
 * - Visual differentiation without color
 * - Grayscale-only = subtle border differences
 * - Icon bullets provide emotional context
 * - Maintains consistent layout across tones
 * 
 * WHY icon bullets (✓, ⚠, •):
 * - More interesting than plain bullets
 * - Provides emotional signal without reading
 * - Familiar symbols (no learning curve)
 * - Works in any language
 * 
 * WHY generous line-height (leading-relaxed):
 * - Easier to read multi-line points
 * - Prevents "wall of text" feeling
 * - Better for scanning (eye can track lines)
 * - Standard in premium UX (Medium, Linear, Notion)
 * 
 * COMPONENT ARCHITECTURE:
 * - Accepts array of string points
 * - Renders each as list item with icon
 * - Tone prop changes border and bullet style
 */

export function InsightCard({ 
  icon, 
  title, 
  points,
  tone = 'neutral' 
}) {
  
  /**
   * TONE-BASED STYLING
   * 
   * Since we're grayscale-only, use subtle differences:
   * - positive: Medium gray border + accent bars
   * - neutral: Dark gray (facts, no judgment)
   * - warning: Slightly lighter gray + accent bars
   */
  const styles = {
    positive: {
      border: 'border-gray-600',
      accent: 'bg-gray-600',
      indicator: 'bg-white'
    },
    neutral: {
      border: 'border-gray-800',
      accent: 'bg-gray-700',
      indicator: 'bg-gray-500'
    },
    warning: {
      border: 'border-gray-700',
      accent: 'bg-gray-600',
      indicator: 'bg-gray-400'
    }
  }[tone]

  return (
    <div>
      
      {/* 
        TITLE
        Section header (e.g., "What's Promising", "The Reality")
        Removed emoji for cleaner, less AI-generated look
        
        MOBILE OPTIMIZATION:
        - Responsive text sizing (text-2xl sm:text-3xl md:text-4xl)
        - Adjusted bottom margin for mobile (mb-6 sm:mb-10)
      */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-10 text-center px-4">
        {title}
      </h2>

      {/* 
        POINTS CONTAINER
        
        Elegant card with subtle accent bar on left
        Creates visual hierarchy without colors
        
        MOBILE OPTIMIZATION:
        - Adjusted spacing between cards (space-y-3 sm:space-y-4)
      */}
      <div className="space-y-3 sm:space-y-4">
        {points.map((point, i) => (
          
          /* 
            INDIVIDUAL POINT CARD
            
            WHY separate cards:
            - Easier to scan (clear separation)
            - Each point feels important
            - Better for long text (doesn't feel cramped)
            - Modern design pattern (Linear, Notion, Reflect)
            
            ACCENT BAR:
            - Left border creates visual interest
            - Subtle hierarchy without noise
            - Guides eye down the list
            
            MOBILE OPTIMIZATION:
            - Responsive padding (p-4 sm:p-6 md:p-8)
            - Touch-friendly size with proper spacing
          */
          <div 
            key={i}
            className={`relative bg-[#111111] border ${styles.border} rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 group hover:bg-[#1A1A1A] transition-all`}
          >
            {/* 
              SUBTLE ACCENT BAR
              
              WHY on left:
              - Reading direction (draws eye to text)
              - Creates rhythm when scanning list
              - Minimal but effective
            */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent} rounded-l-lg sm:rounded-l-xl`} />
            
            {/* 
              ANIMATED INDICATOR DOT
              
              Appears on hover, adds subtle interactivity
              Shows which point you're focused on
            */}
            <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 ${styles.indicator} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            {/* 
              POINT TEXT
              
              WHY larger text (xl):
              - Easy to read without strain
              - Feels important
              - Better for longer sentences
              
              WHY pl-4:
              - Creates space from accent bar
              - Prevents text from touching edge
              
              WHY leading-relaxed:
              - Generous line height
              - Easier to read multi-line text
              - Prevents cramped feeling
              
              MOBILE OPTIMIZATION:
              - Responsive text size (text-base sm:text-lg md:text-xl)
              - Adjusted left padding (pl-3 sm:pl-4)
            */}
            <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed pl-3 sm:pl-4 group-hover:text-white transition-colors">
              {point}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}

