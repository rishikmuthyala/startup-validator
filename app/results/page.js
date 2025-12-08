'use client';

/**
 * ════════════════════════════════════════════════════════════════════════
 * RESULTS ROUTER - Handles Fresh Analysis Redirect
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * This page handles /results (without an ID) for fresh analyses.
 * It redirects to /results/new which is handled by the [id] dynamic route.
 * 
 * WHY TWO ROUTES:
 * - /results → Fresh analysis (just completed conversation)
 * - /results/[id] → Shared result (specific ID)
 * 
 * FLOW:
 * 1. User completes conversation
 * 2. Chat page redirects to /results
 * 3. This page immediately redirects to /results/new
 * 4. The [id] route detects "new" and loads from session
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResultsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    /**
     * INSTANT REDIRECT:
     * No UI shown, just immediately redirect to /results/new
     * The [id] route will handle loading the fresh analysis
     */
    router.replace('/results/new');
  }, [router]);
  
  /**
   * LOADING STATE:
   * Show minimal loading while redirect happens
   * User should barely see this (redirect is instant)
   */
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-gray-500">Loading results...</div>
    </div>
  );
}

