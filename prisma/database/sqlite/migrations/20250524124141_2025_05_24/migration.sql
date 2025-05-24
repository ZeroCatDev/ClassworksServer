-- CreateTable
CREATE TABLE "KVStore" (
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "creatorIp" TEXT DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("namespace", "key")
);

-- CreateTable
CREATE TABLE "Device" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "password" TEXT,
    "passwordHint" TEXT,
    "name" TEXT,
    "accessType" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
