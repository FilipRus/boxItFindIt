import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await prisma.item.findFirst({
      where: {
        id,
        box: {
          storageRoom: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: { inUse: !item.inUse },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Toggle in-use error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
