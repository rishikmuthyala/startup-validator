'use client'

/**
 * ════════════════════════════════════════════════════════════════════════
 * STORY MODE RESULTS - Progressive Reveal Flow
 * ════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN PHILOSOPHY:
 * Instagram Stories meets Apple product reveals
 * One insight at a time, builds momentum, keeps engagement
 * 
 * STATE MACHINE:
 * score → summary → promising → reality → competitors → pivot → actions → report
 * 
 * WHY THIS ORDER:
 * 1. Score: Big reveal moment (hook)
 * 2. Summary: Sets context (TL;DR)
 * 3. Promising: Start positive (engagement)
 * 4. Reality: Then challenges (honesty)
 * 5. Competitors: Concrete evidence (credibility)
 * 6. Pivot: Solutions if needed (actionable)
 * 7. Actions: Next steps (momentum)
 * 8. Report: Full summary (reference)
 * 
 * ANIMATION STRATEGY:
 * - AnimatePresence: Smooth transitions between stages
 * - mode="wait": Current stage exits before next enters
 * - Prevents awkward overlaps
 * - Creates clean, focused experience
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { ScoreReveal } from '@/components/results/ScoreReveal'
import { StoryCard } from '@/components/results/StoryCard'
import { SummaryCard } from '@/components/results/SummaryCard'
import { InsightCard } from '@/components/results/InsightCard'
import { CompetitorCard } from '@/components/results/CompetitorCard'
import { ActionCard } from '@/components/results/ActionCard'
import { FullReport } from '@/components/results/FullReport'
import { FollowUpChat } from '@/components/results/FollowUpChat'

/**
 * STAGE TYPE
 * All possible stages in the story flow
 */
const STAGES = {
  SCORE: 'score',
  SUMMARY: 'summary',
  PROMISING: 'promising',
  REALITY: 'reality',
  COMPETITORS: 'competitors',
  PIVOT: 'pivot',
  ACTIONS: 'actions',
  REPORT: 'report'
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  const [analysis, setAnalysis] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  /**
   * STAGE MANAGEMENT
   * 
   * currentStage: Which stage we're currently showing
   * stageHistory: Array of visited stages (for back button)
   */
  const [currentStage, setCurrentStage] = useState(STAGES.SCORE)
  const [stageHistory, setStageHistory] = useState([])
  
  // ═══════════════════════════════════════════════════════════════════════
  // DYNAMIC STAGE CALCULATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * CALCULATE WHICH STAGES TO SHOW
   * 
   * WHY dynamic:
   * - Not all analyses have all sections
   * - Low scores might not have "promising" section
   * - High scores don't need "pivot" section
   * - No competitors found = skip competitors stage
   * 
   * useMemo: Only recalculate when analysis changes
   */
  const stages = useMemo(() => {
    if (!analysis) return [STAGES.SCORE]
    
    const stageList = [STAGES.SCORE, STAGES.SUMMARY]
    
    // Add "What's Promising" if score > 30 and has content
    if (analysis.score > 30 && analysis.promising?.length > 0) {
      stageList.push(STAGES.PROMISING)
    }
    
    // Always show "The Reality"
    stageList.push(STAGES.REALITY)
    
    // Add competitors if found
    if (analysis.competitors?.length > 0) {
      stageList.push(STAGES.COMPETITORS)
    }
    
    // Add pivot ideas if score < 70
    if (analysis.score < 70 && analysis.pivotIdeas?.length > 0) {
      stageList.push(STAGES.PIVOT)
    }
    
    // Always show actions and report
    stageList.push(STAGES.ACTIONS, STAGES.REPORT)
    
    return stageList
  }, [analysis])
  
  /**
   * CALCULATE CURRENT POSITION
   * For progress indicators
   */
  const currentStageIndex = stages.indexOf(currentStage)
  const totalStages = stages.length
  
  // ═══════════════════════════════════════════════════════════════════════
  // NAVIGATION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * ADVANCE TO NEXT STAGE
   * 
   * LOGIC:
   * 1. Find current position in stages array
   * 2. Move to next stage
   * 3. Add current stage to history (for back button)
   * 4. If at end, stay on final stage
   */
  const goToNextStage = () => {
    const currentIndex = stages.indexOf(currentStage)
    if (currentIndex < stages.length - 1) {
      setStageHistory([...stageHistory, currentStage])
      setCurrentStage(stages[currentIndex + 1])
    }
  }
  
  /**
   * GO BACK TO PREVIOUS STAGE
   * 
   * LOGIC:
   * 1. Pop last stage from history
   * 2. Set as current stage
   * 3. If no history, do nothing
   */
  const goToPreviousStage = () => {
    if (stageHistory.length > 0) {
      const previousStage = stageHistory[stageHistory.length - 1]
      setStageHistory(stageHistory.slice(0, -1))
      setCurrentStage(previousStage)
    }
  }
  
  /**
   * JUMP TO SPECIFIC STAGE
   * Used for "Review story mode" button
   */
  const jumpToStage = (stage) => {
    setStageHistory([])
    setCurrentStage(stage)
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const loadAnalysis = async () => {
      const id = params.id
      
      // If ID exists and is not 'new', try to load shared result from Vercel KV
      if (id && id !== 'undefined' && id !== 'new') {
        console.log(`[Results] Loading shared result: ${id}`)
        
        try {
          const response = await fetch(`/api/load?id=${id}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('[Results] Shared result loaded successfully')
            
            setAnalysis(data.analysis)
            setConversation(data.conversation)
            setIsLoading(false)
            return
          } else {
            const error = await response.json()
            console.error('[Results] Failed to load shared result:', error)
            setError(error.error || 'Result not found. It may have expired.')
            setIsLoading(false)
            setTimeout(() => router.push('/'), 3000)
            return
          }
        } catch (err) {
          console.error('[Results] Error loading shared result:', err)
          setError('Failed to load shared result. Please try again.')
          setIsLoading(false)
          setTimeout(() => router.push('/'), 3000)
          return
        }
      }
      
      // Load from current session (localStorage)
      const conversationHistory = localStorage.getItem('conversation_history')
      
      if (!conversationHistory) {
        setError('No analysis found. Please start a new validation.')
        setIsLoading(false)
        setTimeout(() => router.push('/'), 2000)
        return
      }
      
      const messages = JSON.parse(conversationHistory)
      setConversation(messages)
      
      // Check for cached analysis
      const savedAnalysis = localStorage.getItem('startup_analysis')
      const savedConversationId = localStorage.getItem('conversation_id')
      const currentConversationId = generateConversationId(messages)
      
      if (savedAnalysis && savedConversationId === currentConversationId) {
        try {
          const parsed = JSON.parse(savedAnalysis)
          console.log('[Results] Using cached analysis')
          setAnalysis(parsed)
          setIsLoading(false)
          return
        } catch (e) {
          console.error('[Results] Failed to parse cached analysis:', e)
        }
      }
      
      // Generate fresh analysis
      console.log('[Results] Generating fresh analysis...')
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        })
        
        if (!response.ok) {
          throw new Error('Analysis failed')
        }
        
        const analysisData = await response.json()
        
        // Cache analysis
        localStorage.setItem('startup_analysis', JSON.stringify(analysisData))
        localStorage.setItem('conversation_id', currentConversationId)
        
        setAnalysis(analysisData)
        setIsLoading(false)
        
      } catch (err) {
        console.error('[Results] Error generating analysis:', err)
        setError('Failed to generate analysis. Please try again.')
        setIsLoading(false)
      }
    }
    
    loadAnalysis()
  }, [params.id, router])
  
  const generateConversationId = (messages) => {
    const firstMsg = messages[0]?.content || ''
    const lastMsg = messages[messages.length - 1]?.content || ''
    return `${firstMsg.substring(0, 50)}_${lastMsg.substring(0, 50)}_${messages.length}`
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your analysis...</p>
        </div>
      </div>
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════════
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-medium mb-4 text-gray-300">{error}</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // STORY MODE RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      
      {/**
       * AnimatePresence
       * 
       * WHY mode="wait":
       * - Current component exits completely before next enters
       * - Prevents overlapping animations
       * - Creates cleaner, more focused transitions
       * 
       * WHY key={currentStage}:
       * - Tells React this is a new component when stage changes
       * - Triggers exit animation on old component
       * - Triggers enter animation on new component
       */}
      <AnimatePresence mode="wait">
        
        {/* 
          STAGE 1: SCORE REVEAL
          Full-screen animated score counting
        */}
        {currentStage === STAGES.SCORE && (
          <ScoreReveal
            key="score"
            targetScore={analysis.score}
            verdict={analysis.verdict}
            onComplete={goToNextStage}
          />
        )}
        
        {/* 
          STAGE 2: ONE-SENTENCE SUMMARY
        */}
        {currentStage === STAGES.SUMMARY && (
          <StoryCard
            key="summary"
            cardNumber={currentStageIndex + 1}
            totalCards={totalStages}
            onNext={goToNextStage}
            onPrevious={goToPreviousStage}
          >
            <SummaryCard summary={analysis.summary} />
          </StoryCard>
        )}
        
        {/* 
          STAGE 3: WHAT'S PROMISING (conditional)
        */}
        {currentStage === STAGES.PROMISING && (
          <StoryCard
            key="promising"
            cardNumber={currentStageIndex + 1}
            totalCards={totalStages}
            onNext={goToNextStage}
            onPrevious={goToPreviousStage}
          >
            <InsightCard
              icon="✨"
              title="What's Promising"
              points={analysis.promising}
              tone="positive"
            />
          </StoryCard>
        )}
        
        {/* 
          STAGE 4: THE REALITY
        */}
        {currentStage === STAGES.REALITY && (
          <StoryCard
            key="reality"
            cardNumber={currentStageIndex + 1}
            totalCards={totalStages}
            onNext={goToNextStage}
            onPrevious={goToPreviousStage}
          >
            <InsightCard
              icon="⚡"
              title="The Reality"
              points={analysis.reality}
              tone="warning"
            />
          </StoryCard>
        )}
        
        {/* 
          STAGE 5: COMPETITORS (conditional)
        */}
        {currentStage === STAGES.COMPETITORS && (
          <StoryCard
            key="competitors"
            cardNumber={currentStageIndex + 1}
            totalCards={totalStages}
            onNext={goToNextStage}
            onPrevious={goToPreviousStage}
          >
            <CompetitorCard competitors={analysis.competitors} />
          </StoryCard>
        )}
        
        {/* 
          STAGE 6: PIVOT IDEAS (conditional)
        */}
        {currentStage === STAGES.PIVOT && (
          <StoryCard
            key="pivot"
            cardNumber={currentStageIndex + 1}
            totalCards={totalStages}
            onNext={goToNextStage}
            onPrevious={goToPreviousStage}
          >
            <InsightCard
              icon="🔄"
              title="How to Fix This"
              points={analysis.pivotIdeas}
              tone="neutral"
            />
          </StoryCard>
        )}
        
        {/* 
          STAGE 7: NEXT STEPS
        */}
        {currentStage === STAGES.ACTIONS && (
          <StoryCard
            key="actions"
            cardNumber={currentStageIndex + 1}
            totalCards={totalStages}
            onNext={goToNextStage}
            onPrevious={goToPreviousStage}
            nextLabel="View Full Report"
          >
            <ActionCard
              title="What To Do Next"
              steps={analysis.nextSteps}
            />
          </StoryCard>
        )}
        
        {/* 
          STAGE 8: FULL REPORT + FOLLOW-UP
          Scrollable summary with Q&A at bottom
        */}
        {currentStage === STAGES.REPORT && (
          <div key="report">
            <FullReport
              analysis={analysis}
              onReviewStory={() => jumpToStage(STAGES.SCORE)}
            />
            <FollowUpChat analysis={analysis} />
          </div>
        )}
        
      </AnimatePresence>
      
    </div>
  )
}
