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

    const box = await prisma.box.findFirst({
      where: {
        id,
        storageRoom: {
          userId: session.user.id,
        },
      },
      include: {
        items: {
          include: {
            labels: {
              include: {
                label: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!box) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    return NextResponse.json({ box });
  } catch (error) {
    console.error("Get box error:", error);
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
        { error: "Box name is required" },
        { status: 400 }
      );
    }

    const box = await prisma.box.findFirst({
      where: {
        id,
        storageRoom: {
          userId: session.user.id,
        },
      },
    });

    if (!box) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    const updatedBox = await prisma.box.update({
      where: { id },
      data: { name },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ box: updatedBox });
  } catch (error) {
    console.error("Update box error:", error);
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

    const box = await prisma.box.findFirst({
      where: {
        id,
        storageRoom: {
          userId: session.user.id,
        },
      },
    });

    if (!box) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    await prisma.box.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete box error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
