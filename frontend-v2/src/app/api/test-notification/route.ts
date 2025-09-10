import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, message, priority = 'medium' } = body

    // Simulate broadcasting a notification via the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${backendUrl}/api/v1/notifications/test/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title || 'Test Notification',
        message: message || 'This is a test notification from the frontend',
        priority: priority
      })
    })

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      data: result
    })

  } catch (error) {
    console.error('Failed to send test notification:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send test notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}