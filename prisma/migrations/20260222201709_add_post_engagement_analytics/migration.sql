-- CreateTable
CREATE TABLE "PostEngagementEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sessionKeyHash" TEXT NOT NULL,
    "userAgentHash" TEXT,
    "referrerHost" TEXT,
    "path" TEXT NOT NULL,
    "targetUrl" TEXT,
    "targetHost" TEXT,
    "secondsOnPage" INTEGER,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostEngagementEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PostEngagementEvent_postId_type_occurredAt_idx" ON "PostEngagementEvent"("postId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "PostEngagementEvent_type_occurredAt_idx" ON "PostEngagementEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "PostEngagementEvent_postId_sessionKeyHash_type_occurredAt_idx" ON "PostEngagementEvent"("postId", "sessionKeyHash", "type", "occurredAt");
