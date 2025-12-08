/**
 * ════════════════════════════════════════════════════════════════════════
 * SHARE API - Save Results to Vercel KV
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ENDPOINT: POST /api/share
 * 
 * PURPOSE:
 * Saves analysis results to Vercel KV and returns shareable ID
 * 
 * REQUEST BODY:
 * {
 *   analysis: { score, verdict, summary, ... },
 *   conversation: [{ role, content }, ...]
 * }
 * 
 * RESPONSE:
 * {
 *   id: "abc123xyz", // 10-character unique ID
 *   url: "https://yourapp.com/results/abc123xyz"
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Missing or invalid data
 * - 503: Storage not available
 * - 500: Server error
 */

import { NextResponse } from 'next/server'
import { saveResult, isStorageAvailable } from '@/lib/storage'

export async function POST(request) {
  try {
    // Check if storage is available
    if (!isStorageAvailable()) {
      return NextResponse.json(
        { error: 'Sharing is not available. Please try again later.' },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { analysis, conversation } = body

    // Validate required fields
    if (!analysis || !conversation) {
      return NextResponse.json(
        { error: 'Missing required fields: analysis or conversation' },
        { status: 400 }
      )
    }

    // Validate analysis structure
    if (!analysis.score || !analysis.verdict) {
      return NextResponse.json(
        { error: 'Invalid analysis structure' },
        { status: 400 }
      )
    }

    // Save to storage
    const id = await saveResult(analysis, conversation)

    if (!id) {
      return NextResponse.json(
        { error: 'Failed to save result. Please try again.' },
        { status: 500 }
      )
    }

    // Construct shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    request.headers.get('origin') || 
                    'http://localhost:3000'
    const url = `${baseUrl}/results/${id}`

    return NextResponse.json({ id, url })

  } catch (error) {
    console.error('[Share API] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
