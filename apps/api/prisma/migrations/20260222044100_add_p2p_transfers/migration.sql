-- CreateTable
CREATE TABLE "p2p_transfers" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p2p_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "p2p_stripe_pi_unique" ON "p2p_transfers"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "p2p_sender_idx" ON "p2p_transfers"("senderId");

-- CreateIndex
CREATE INDEX "p2p_recipient_idx" ON "p2p_transfers"("recipientId");

-- CreateIndex
CREATE INDEX "p2p_created_idx" ON "p2p_transfers"("created_at");

-- AddForeignKey
ALTER TABLE "p2p_transfers" ADD CONSTRAINT "p2p_transfers_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p2p_transfers" ADD CONSTRAINT "p2p_transfers_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
