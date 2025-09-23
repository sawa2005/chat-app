import { Prisma } from "@prisma/client";

export type Reaction = Prisma.message_reactionsGetPayload<{
    select: { id: true; created_at: true; emoji: true; message_id: true; profile_id: true };
}>;

export type Message = {
    id: bigint;
    conversation_id: string;
    content: string;
    created_at: Date;
    edited_at: Date | null;
    image_url: string | null;
    type: string;
    deleted: boolean;
    parent_id: bigint | null;
    sender: {
        id: bigint | null;
        username: string;
        avatar: string | null;
    } | null;
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
};

export type Member = {
    id: bigint;
    username: string;
    avatar: string | null;
};
