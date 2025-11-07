import { Prisma } from "@prisma/client";

export type Reaction = Prisma.message_reactionsGetPayload<{
    select: { id: true; created_at: true; emoji: true; message_id: true; profile_id: true };
}>;

// TODO: replace explicit message type usage with this Prisma generated type
export type PrismaMessage = Prisma.messagesGetPayload<{
    include: { sender: true; messages: true; message_reactions: true; message_reads: true };
}>;

export type Message = {
    id: bigint;
    conversation_id: string;
    content: string;
    created_at: Date;
    edited_at: Date | null;
    image_url: string | null;
    image_width: number | null;
    image_height: number | null;
    type: string;
    deleted: boolean;
    parent_id: bigint | null;
    sender: {
        id: bigint | null;
        username: string;
        avatar: string | null;
    } | null;
    // TODO: map sub-messages as replies so it's easier to understand queries
    messages: {
        id: bigint;
        content: string | null;
        image_url: string | null;
        sender: { id: bigint; username: string; avatar: string | null } | null;
    } | null;
    message_reactions:
        | {
              id: bigint;
              emoji: string;
              created_at: Date;
              profile_id: bigint;
              message_id: bigint;
          }[]
        | null;
    message_reads: { profile_id: bigint }[];
};

export type Member = {
    id: bigint;
    username: string;
    avatar: string | null;
};
