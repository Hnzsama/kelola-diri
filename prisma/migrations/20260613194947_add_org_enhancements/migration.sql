/*
  Warnings:

  - You are about to drop the column `assignedToUserId` on the `OrganizationTask` table. All the data in the column will be lost.
  - Added the required column `userId` to the `OrganizationEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `OrganizationTask` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrganizationTask" DROP CONSTRAINT "OrganizationTask_assignedToUserId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationTask" DROP CONSTRAINT "OrganizationTask_eventId_fkey";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "logoIcon" TEXT NOT NULL DEFAULT '🏢',
ADD COLUMN     "period" TEXT;

-- AlterTable
ALTER TABLE "OrganizationEvent" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "period" TEXT,
ADD COLUMN     "position" TEXT;

-- AlterTable
ALTER TABLE "OrganizationTask" DROP COLUMN "assignedToUserId",
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "eventId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OrganizationEvent" ADD CONSTRAINT "OrganizationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationTask" ADD CONSTRAINT "OrganizationTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OrganizationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationTask" ADD CONSTRAINT "OrganizationTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
