/*
  Warnings:

  - You are about to drop the `DemoRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordHash" TEXT;

-- DropTable
DROP TABLE "DemoRequest";
