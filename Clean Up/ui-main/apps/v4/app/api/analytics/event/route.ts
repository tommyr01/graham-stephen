import { NextRequest, NextResponse } from "next/server"

// Analytics event types
type AnalyticsEvent = {
  eventType: string
  eventData: any
  sessionId: string
  timestamp: string
  userAgent?: string
  ip?: string
}

// Mock analytics storage
const events: AnalyticsEvent[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create analytics event
    const event: AnalyticsEvent = {
      eventType: body.eventType,
      eventData: body.eventData || {},
      sessionId: body.sessionId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || undefined,
      // In production, get real IP from headers
      ip: "anonymized",
    }

    // Validate event type
    const validEventTypes = [
      "page_view",
      "podcast_play",
      "podcast_pause",
      "form_start",
      "form_submit",
      "cta_click",
      "assessment_start",
      "assessment_complete",
      "download_transcript",
    ]

    if (!validEventTypes.includes(event.eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      )
    }

    // In production, send to analytics service (GA4, Mixpanel, etc.)
    events.push(event)

    // Log important events
    if (["form_submit", "assessment_complete"].includes(event.eventType)) {
      console.log("Important event:", event)
    }

    return NextResponse.json({
      success: true,
      sessionId: event.sessionId,
    })
  } catch (error) {
    console.error("Error tracking event:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}