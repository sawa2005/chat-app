import { Prisma } from "@prisma/client";
import { messagePayload } from "./prisma";

export type Reaction = Prisma.message_reactionsGetPayload<{
    select: { id: true; created_at: true; emoji: true; message_id: true; profile_id: true };
}>;

export type Message = Prisma.messagesGetPayload<typeof messagePayload>;

export type Member = {
    id: bigint;
    username: string;
    avatar: string | null;
};
