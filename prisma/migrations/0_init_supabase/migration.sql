-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_by" VARCHAR DEFAULT '',
    "sent_to" VARCHAR DEFAULT '',
    "content" TEXT DEFAULT '',

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

