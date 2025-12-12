import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

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
          userId: session.user.id,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;
    const image = formData.get("image") as File | null;
    const deleteImage = formData.get("deleteImage") === "true";

    if (!name) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    let imagePath = item.imagePath;

    if (deleteImage && imagePath) {
      // Delete from Cloudinary
      await deleteFromCloudinary(imagePath);
      imagePath = null;
    }

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

      // Delete old image from Cloudinary if exists
      if (imagePath) {
        await deleteFromCloudinary(imagePath);
      }

      // Upload new image to Cloudinary
      imagePath = await uploadToCloudinary(image, "boxit/items");
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        category,
        imagePath,
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Update item error:", error);
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

    const item = await prisma.item.findFirst({
      where: {
        id,
        box: {
          userId: session.user.id,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete image from Cloudinary if exists
    if (item.imagePath) {
      await deleteFromCloudinary(item.imagePath);
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
