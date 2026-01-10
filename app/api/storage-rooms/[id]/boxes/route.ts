import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Verify storage room belongs to user
    const storageRoom = await prisma.storageRoom.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!storageRoom) {
      return NextResponse.json({ error: "Storage room not found" }, { status: 404 });
    }

    const boxes = await prisma.box.findMany({
      where: {
        storageRoomId: id,
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

export async function POST(
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
        { error: "Box name is required" },
        { status: 400 }
      );
    }

    // Verify storage room belongs to user
    const storageRoom = await prisma.storageRoom.findFirst({
      where: {
        id,
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
        storageRoomId: id,
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
