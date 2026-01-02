import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const { qrCode } = await request.json();

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code value is required" },
        { status: 400 }
      );
    }

    // Use the request origin to support both localhost and network IP
    const origin = request.headers.get('origin') ||
                   request.headers.get('referer')?.replace(/\/$/, '') ||
                   process.env.NEXTAUTH_URL ||
                   'http://localhost:3000';

    const url = `${origin}/box/${qrCode}`;
    const qrCodeImage = await QRCode.toDataURL(url, {
      width: 500,
      margin: 2,
    });

    return NextResponse.json({ qrCodeImage });
  } catch (error: unknown) {
    console.error("Generate QR code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
