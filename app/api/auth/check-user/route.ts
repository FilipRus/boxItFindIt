import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { exists: false, verified: false },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ exists: false, verified: false });
    }

    return NextResponse.json({
      exists: true,
      verified: user.emailVerified,
    });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { exists: false, verified: false },
      { status: 500 }
    );
  }
}
