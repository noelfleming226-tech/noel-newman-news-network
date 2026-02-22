-- CreateTable
CREATE TABLE "PostViewEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "sessionKeyHash" TEXT NOT NULL,
    "userAgentHash" TEXT,
    "referrerHost" TEXT,
    "path" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostViewEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PostViewEvent_postId_occurredAt_idx" ON "PostViewEvent"("postId", "occurredAt");

-- CreateIndex
CREATE INDEX "PostViewEvent_occurredAt_idx" ON "PostViewEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "PostViewEvent_postId_sessionKeyHash_occurredAt_idx" ON "PostViewEvent"("postId", "sessionKeyHash", "occurredAt");

-- CreateIndex
CREATE INDEX "PostViewEvent_referrerHost_occurredAt_idx" ON "PostViewEvent"("referrerHost", "occurredAt");
