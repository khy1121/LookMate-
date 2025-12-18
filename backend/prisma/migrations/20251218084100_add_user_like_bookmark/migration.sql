-- AlterTable
ALTER TABLE "public_looks" ADD COLUMN "ownerEmail" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "user_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "publicLookId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_likes_publicLookId_fkey" FOREIGN KEY ("publicLookId") REFERENCES "public_looks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "publicLookId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_bookmarks_publicLookId_fkey" FOREIGN KEY ("publicLookId") REFERENCES "public_looks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "user_likes_publicLookId_idx" ON "user_likes"("publicLookId");

-- CreateIndex
CREATE UNIQUE INDEX "user_likes_userId_publicLookId_key" ON "user_likes"("userId", "publicLookId");

-- CreateIndex
CREATE INDEX "user_bookmarks_publicLookId_idx" ON "user_bookmarks"("publicLookId");

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmarks_userId_publicLookId_key" ON "user_bookmarks"("userId", "publicLookId");
