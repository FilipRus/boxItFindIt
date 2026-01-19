import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: "RESEND_API_KEY environment variable is not set",
      }, { status: 500 });
    }

    // Try to send a test email
    const result = await resend.emails.send({
      from: "BoxIT <onboarding@resend.dev>",
      to: "delivered@resend.dev", // Resend test email
      subject: "Test Email from BoxIT",
      html: "<p>This is a test email to verify Resend is working.</p>",
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      result,
    });
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json({
      error: "Failed to send test email",
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
