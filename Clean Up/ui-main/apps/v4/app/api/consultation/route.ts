import { NextRequest, NextResponse } from "next/server"

// Mock database for demo purposes
const consultations: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.preferredDate || !body.preferredTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create consultation request
    const consultation = {
      id: crypto.randomUUID(),
      leadId: body.leadId || null,
      email: body.email,
      preferredDate: body.preferredDate,
      preferredTime: body.preferredTime,
      timezone: body.timezone || "UTC",
      specificChallenges: body.specificChallenges || "",
      companySize: body.companySize || "",
      budgetRange: body.budgetRange || null,
      decisionTimeline: body.decisionTimeline || "",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // In production, save to Supabase
    consultations.push(consultation)

    // In production, send confirmation email
    // await sendConsultationConfirmationEmail(consultation)

    return NextResponse.json({
      id: consultation.id,
      status: consultation.status,
      confirmationEmail: consultation.email,
      message: "Consultation request received. We'll contact you within 24 hours.",
    })
  } catch (error) {
    console.error("Error creating consultation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}