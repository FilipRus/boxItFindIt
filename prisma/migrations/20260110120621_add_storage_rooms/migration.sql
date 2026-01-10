-- CreateTable
CREATE TABLE "StorageRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageRoom_userId_idx" ON "StorageRoom"("userId");

-- AddForeignKey
ALTER TABLE "StorageRoom" ADD CONSTRAINT "StorageRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default storage room for each user that has boxes
INSERT INTO "StorageRoom" ("id", "name", "userId", "createdAt", "updatedAt")
SELECT
    'sr_' || gen_random_uuid()::text,
    'Main Storage',
    "userId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "userId" FROM "Box") AS users;

-- Add storageRoomId column as nullable first
ALTER TABLE "Box" ADD COLUMN "storageRoomId" TEXT;

-- Update existing boxes to point to their user's storage room
UPDATE "Box"
SET "storageRoomId" = (
    SELECT "id"
    FROM "StorageRoom"
    WHERE "StorageRoom"."userId" = "Box"."userId"
    LIMIT 1
);

-- Now make it required
ALTER TABLE "Box" ALTER COLUMN "storageRoomId" SET NOT NULL;

-- Remove userId from Box and add foreign key to StorageRoom
ALTER TABLE "Box" DROP CONSTRAINT IF EXISTS "Box_userId_fkey";
ALTER TABLE "Box" DROP COLUMN "userId";

-- CreateIndex
CREATE INDEX "Box_storageRoomId_idx" ON "Box"("storageRoomId");

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_storageRoomId_fkey" FOREIGN KEY ("storageRoomId") REFERENCES "StorageRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
