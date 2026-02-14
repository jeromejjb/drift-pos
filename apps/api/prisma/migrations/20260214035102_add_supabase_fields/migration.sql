/*
  Warnings:

  - A unique constraint covering the columns `[supabaseUserId]` on the table `restaurants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supabaseId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supabaseId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "email" TEXT,
ADD COLUMN     "supabaseUserId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "supabaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_supabaseUserId_key" ON "restaurants"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_id_idx" ON "users"("supabaseId");
