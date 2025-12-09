/**
 * ════════════════════════════════════════════════════════════════════════
 * LOAD API - Retrieve Shared Results from Vercel KV
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ENDPOINT: GET /api/load?id=abc123xyz
 * 
 * PURPOSE:
 * Loads shared analysis results from Vercel KV
 * 
 * QUERY PARAMS:
 * - id: Share ID from URL
 * 
 * RESPONSE:
 * {
 *   analysis: { score, verdict, summary, ... },
 *   conversation: [{ role, content }, ...],
 *   createdAt: 1234567890,
 *   metadata: { ... }
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Missing ID parameter
 * - 404: Result not found (expired or invalid ID)
 * - 503: Storage not available
 * - 500: Server error
 */

import { NextResponse } from 'next/server'
import { loadResult, isStorageAvailable } from '@/lib/storage'

export async function GET(request) {
  try {
    // Check if storage is available
    if (!isStorageAvailable()) {
      return NextResponse.json(
        { error: 'Loading shared results is not available' },
        { status: 503 }
      )
    }

    // Extract ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    // Load from storage
    const data = await loadResult(id)

    if (!data) {
      return NextResponse.json(
        { error: 'Result not found. It may have expired or the link is invalid.' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('[Load API] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

