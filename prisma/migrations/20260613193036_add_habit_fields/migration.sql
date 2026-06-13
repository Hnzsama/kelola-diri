/*
  Warnings:

  - You are about to drop the column `frequency` on the `Habit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Habit" DROP COLUMN "frequency",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'ACADEMIC',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
