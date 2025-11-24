import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client"; // Updated import path

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: ["query"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export const messagePayload = {
    select: {
        id: true,
        conversation_id: true,
        content: true,
        created_at: true,
        edited_at: true,
        image_url: true,
        image_height: true,
        image_width: true,
        type: true,
        deleted: true,
        parent_id: true,
        sender: { select: { id: true, username: true, avatar: true } },
        messages: {
            select: {
                id: true,
                content: true,
                image_url: true,
                sender: { select: { id: true, username: true, avatar: true } },
            },
        },
        message_reactions: {
            select: { id: true, created_at: true, emoji: true, message_id: true, profile_id: true },
        },
        message_reads: { select: { profile_id: true } },
    },
} satisfies Prisma.messagesFindManyArgs;
