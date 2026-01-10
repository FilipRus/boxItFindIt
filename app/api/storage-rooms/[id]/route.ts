import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storageRoom = await prisma.storageRoom.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        boxes: {
          include: {
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    if (!storageRoom) {
      return NextResponse.json({ error: "Storage room not found" }, { status: 404 });
    }

    return NextResponse.json({ storageRoom });
  } catch (error) {
    console.error("Get storage room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Storage room name is required" },
        { status: 400 }
      );
    }

    const storageRoom = await prisma.storageRoom.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!storageRoom) {
      return NextResponse.json({ error: "Storage room not found" }, { status: 404 });
    }

    const updatedStorageRoom = await prisma.storageRoom.update({
      where: { id },
      data: { name },
      include: {
        boxes: true,
        _count: {
          select: {
            boxes: true,
          },
        },
      },
    });

    return NextResponse.json({ storageRoom: updatedStorageRoom });
  } catch (error) {
    console.error("Update storage room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storageRoom = await prisma.storageRoom.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!storageRoom) {
      return NextResponse.json({ error: "Storage room not found" }, { status: 404 });
    }

    await prisma.storageRoom.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete storage room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
