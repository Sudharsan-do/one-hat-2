/*
  Warnings:

  - A unique constraint covering the columns `[heyGenVideoId]` on the table `VideoScript` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_id" TEXT,
ADD COLUMN     "voice_id" TEXT;

-- AlterTable
ALTER TABLE "VideoScript" ADD COLUMN     "heyGenVideoId" TEXT;

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoScript_heyGenVideoId_key" ON "VideoScript"("heyGenVideoId");
