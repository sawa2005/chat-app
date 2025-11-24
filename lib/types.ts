import { Prisma } from "../generated/prisma/client";
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

export type BroadcastNewMessage = {
    id: string | number | bigint;
    conversation_id: string | number | bigint;
    content?: string | null;
    created_at: string | Date;
    sender_id?: string | number | bigint | null;
    sender_username?: string;
    sender_avatar: string | null;
    image_url?: string | null;
    image_height?: number | null;
    image_width?: number | null;
    type?: string | null;
    parent_id: bigint | null;
    messages: {
        id: bigint;
        content: string | null;
        image_url: string | null;
        sender: { id: bigint; username: string; avatar: string | null } | null;
    } | null;
};

export type BroadcastPayload = {
    id: string;
    conversation_id: string;
    content: string;
    created_at: string;
    sender: {
        id: string | null;
        username: string;
        avatar: string | null;
    } | null;
    image_url: string | null;
    image_height: number | null;
    image_width: number | null;
    type: string;
    parent_id: string | null;
    messages: {
        id: string;
        content: string | null;
        image_url: string | null;
        sender: { id: string; username: string; avatar: string | null } | null;
    } | null;
};

export type BroadcastReactionPayload = Omit<Reaction, "id" | "profile_id" | "message_id"> & {
    id: string;
    profile_id: string;
    message_id: string;
};

export type BroadcastMessageEditedPayload = {
    id: string;
    content: string;
    edited_at: string;
};

export type BroadcastMessageDeletedPayload = {
    id: string;
};
