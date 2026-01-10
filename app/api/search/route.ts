import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Search for items matching the query across all user's storage rooms
    const items = await prisma.item.findMany({
      where: {
        box: {
          storageRoom: {
            userId: session.user.id,
          },
        },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        box: {
          include: {
            storageRoom: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Also search for boxes matching the query
    const boxes = await prisma.box.findMany({
      where: {
        storageRoom: {
          userId: session.user.id,
        },
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        storageRoom: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    // Also search for storage rooms matching the query
    const storageRooms = await prisma.storageRoom.findMany({
      where: {
        userId: session.user.id,
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        _count: {
          select: {
            boxes: true,
          },
        },
      },
    });

    return NextResponse.json({
      items,
      boxes,
      storageRooms,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
