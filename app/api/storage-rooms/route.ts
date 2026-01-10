import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storageRooms = await prisma.storageRoom.findMany({
      where: {
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
        },
        _count: {
          select: {
            boxes: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ storageRooms });
  } catch (error) {
    console.error("Get storage rooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

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

    const storageRoom = await prisma.storageRoom.create({
      data: {
        name,
        userId: session.user.id,
      },
      include: {
        boxes: true,
        _count: {
          select: {
            boxes: true,
          },
        },
      },
    });

    return NextResponse.json({ storageRoom }, { status: 201 });
  } catch (error) {
    console.error("Create storage room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
