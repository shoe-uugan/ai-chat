/*
  Warnings:

  - Added the required column `basePrompt` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `greetingText` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "basePrompt" TEXT NOT NULL,
ADD COLUMN     "greetingText" TEXT NOT NULL;
