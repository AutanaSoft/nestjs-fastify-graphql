-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user', 'guest');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('registered', 'active', 'suspended', 'banned');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(64) NOT NULL,
    "user_name" VARCHAR(20) NOT NULL,
    "password" VARCHAR(64) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'registered',
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_user_name_idx" ON "users"("user_name");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
