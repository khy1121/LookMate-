-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "height" INTEGER,
    "bodyType" TEXT,
    "gender" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "clothing_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "originalImageUrl" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "season" TEXT,
    "brand" TEXT,
    "size" TEXT,
    "tags" TEXT NOT NULL,
    "memo" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "shoppingUrl" TEXT,
    "price" INTEGER,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clothing_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "looks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemIds" TEXT NOT NULL,
    "layers" TEXT NOT NULL,
    "snapshotUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "looks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_looks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lookId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "snapshotUrl" TEXT,
    "itemsSnapshot" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "public_looks_lookId_fkey" FOREIGN KEY ("lookId") REFERENCES "looks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "clothing_items_userId_idx" ON "clothing_items"("userId");

-- CreateIndex
CREATE INDEX "clothing_items_category_idx" ON "clothing_items"("category");

-- CreateIndex
CREATE INDEX "looks_userId_idx" ON "looks"("userId");

-- CreateIndex
CREATE INDEX "looks_isPublic_idx" ON "looks"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "public_looks_lookId_key" ON "public_looks"("lookId");

-- CreateIndex
CREATE UNIQUE INDEX "public_looks_publicId_key" ON "public_looks"("publicId");

-- CreateIndex
CREATE INDEX "public_looks_publicId_idx" ON "public_looks"("publicId");

-- CreateIndex
CREATE INDEX "public_looks_createdAt_idx" ON "public_looks"("createdAt");

-- CreateIndex
CREATE INDEX "public_looks_likesCount_idx" ON "public_looks"("likesCount");
