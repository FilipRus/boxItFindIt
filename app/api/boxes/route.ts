import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const boxes = await prisma.box.findMany({
      where: {
        storageRoom: {
          userId: session.user.id,
        },
        ...(search && {
          OR: [
            { name: { contains: search } },
            {
              items: {
                some: {
                  OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                    { category: { contains: search } },
                  ],
                },
              },
            },
          ],
        }),
      },
      include: {
        items: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ boxes });
  } catch (error) {
    console.error("Get boxes error:", error);
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

    const { name, storageRoomId } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Box name is required" },
        { status: 400 }
      );
    }

    if (!storageRoomId) {
      return NextResponse.json(
        { error: "Storage room ID is required" },
        { status: 400 }
      );
    }

    // Verify storage room belongs to user
    const storageRoom = await prisma.storageRoom.findFirst({
      where: {
        id: storageRoomId,
        userId: session.user.id,
      },
    });

    if (!storageRoom) {
      return NextResponse.json({ error: "Storage room not found" }, { status: 404 });
    }

    const qrCode = nanoid(10);

    const box = await prisma.box.create({
      data: {
        name,
        qrCode,
        storageRoomId,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ box }, { status: 201 });
  } catch (error) {
    console.error("Create box error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
