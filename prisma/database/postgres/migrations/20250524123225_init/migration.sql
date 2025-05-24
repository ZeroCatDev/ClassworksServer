-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('PUBLIC', 'PROTECTED', 'PRIVATE');

-- CreateTable
CREATE TABLE "KVStore" (
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "creatorIp" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KVStore_pkey" PRIMARY KEY ("namespace","key")
);

-- CreateTable
CREATE TABLE "Device" (
    "uuid" TEXT NOT NULL,
    "password" TEXT,
    "passwordHint" TEXT,
    "name" TEXT,
    "accessType" "AccessType" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("uuid")
);
