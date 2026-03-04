-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- CreateTable
CREATE TABLE "diner_loyalty" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE',
    "last_order_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diner_loyalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diner_loyalty_restaurant_idx" ON "diner_loyalty"("restaurantId");

-- CreateIndex
CREATE INDEX "diner_loyalty_user_idx" ON "diner_loyalty"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "diner_loyalty_restaurant_user_unique" ON "diner_loyalty"("restaurantId", "userId");

-- AddForeignKey
ALTER TABLE "diner_loyalty" ADD CONSTRAINT "diner_loyalty_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diner_loyalty" ADD CONSTRAINT "diner_loyalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
