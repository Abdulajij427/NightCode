-- CreateTable
CREATE TABLE "OAuthAuthorizationState" (
    "id" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "cliAuthorizationRequestId" TEXT NOT NULL,

    CONSTRAINT "OAuthAuthorizationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAuthorizationState_stateHash_key" ON "OAuthAuthorizationState"("stateHash");

-- CreateIndex
CREATE INDEX "OAuthAuthorizationState_cliAuthorizationRequestId_idx" ON "OAuthAuthorizationState"("cliAuthorizationRequestId");

-- CreateIndex
CREATE INDEX "OAuthAuthorizationState_expiresAt_idx" ON "OAuthAuthorizationState"("expiresAt");

-- AddForeignKey
ALTER TABLE "OAuthAuthorizationState" ADD CONSTRAINT "OAuthAuthorizationState_cliAuthorizationRequestId_fkey" FOREIGN KEY ("cliAuthorizationRequestId") REFERENCES "CliAuthorizationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
