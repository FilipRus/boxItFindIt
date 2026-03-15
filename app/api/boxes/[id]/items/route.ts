import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: boxId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const box = await prisma.box.findFirst({
      where: {
        id: boxId,
        storageRoom: {
          userId: session.user.id,
        },
      },
    });

    if (!box) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const image = formData.get("image") as File | null;
    const labelsJson = formData.get("labels") as string | null;

    if (!name) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    let imagePath: string | null = null;

    if (image) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
          { status: 400 }
        );
      }

      // Validate file size
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 400 }
        );
      }

      // Upload to Cloudinary
      imagePath = await uploadToCloudinary(image, "boxit/items");
    }

    // Parse labels
    const labelNames: string[] = labelsJson ? JSON.parse(labelsJson) : [];

    // Create or find labels and create item with label connections
    const item = await prisma.item.create({
      data: {
        name,
        description,
        imagePath,
        boxId,
      },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    // Handle labels
    if (labelNames.length > 0) {
      for (const labelName of labelNames) {
        const trimmedName = labelName.trim();
        if (!trimmedName) continue;

        // Find or create label
        let label = await prisma.label.findFirst({
          where: {
            name: trimmedName,
            userId: session.user.id,
          },
        });

        if (!label) {
          label = await prisma.label.create({
            data: {
              name: trimmedName,
              userId: session.user.id,
            },
          });
        }

        // Create item-label connection
        await prisma.itemLabel.create({
          data: {
            itemId: item.id,
            labelId: label.id,
          },
        });
      }
    }

    // Fetch item with labels for response
    const itemWithLabels = await prisma.item.findUnique({
      where: { id: item.id },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    return NextResponse.json({ item: itemWithLabels }, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
