-- AlterTable
ALTER TABLE "users" ADD COLUMN "stripeAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_account_unique" ON "users"("stripeAccountId");
