// lib/broadcast.ts
import { Member } from "@/lib/types";
import { createClient } from "@/lib/client";

const supabase = createClient();

type BroadcastPayload = {
    id: string;
    conversation_id: string;
    content: string;
    created_at: Date;
    sender: {
        id: string | null;
        username: string;
        avatar: string | null;
    } | null;
    image_url: string | null;
    type: string;
    parent_id: string | null;
    messages: {
        id: string;
        content: string | null;
        image_url: string | null;
        sender: { id: string; username: string; avatar: string | null } | null;
    } | null;
};

export async function broadcastMessage(
    conversationId: string,
    newMessage: {
        id: string | number | bigint;
        conversation_id: string | number | bigint;
        content?: string | null;
        created_at: string | Date;
        sender_id?: string | number | bigint | null;
        sender_username?: string; // fallback removed
        sender_avatar: string | null;
        image_url?: string | null;
        type?: string | null;
        parent_id: bigint | null;
        messages: {
            id: bigint;
            content: string | null;
            image_url: string | null;
            sender: { id: bigint; username: string; avatar: string | null } | null;
        } | null;
    },
    uploadedImageUrl?: string | null
) {
    const payload: BroadcastPayload = {
        id: newMessage.id.toString(),
        conversation_id: newMessage.conversation_id.toString(),
        content: newMessage.content ?? "",
        created_at: newMessage.created_at instanceof Date ? newMessage.created_at : new Date(newMessage.created_at),
        sender:
            newMessage.type === "info"
                ? null
                : {
                      id: newMessage.sender_id ? newMessage.sender_id.toString() : null,
                      username: newMessage.sender_username ?? "",
                      avatar: newMessage.sender_avatar ?? null,
                  },
        image_url: uploadedImageUrl ?? newMessage.image_url ?? null,
        type: newMessage.type ?? "message",
        parent_id: newMessage.parent_id ? newMessage.parent_id.toString() : null,
        messages: newMessage.messages
            ? {
                  id: newMessage.messages.id.toString(),
                  content: newMessage.messages.content,
                  image_url: newMessage.messages.image_url,
                  sender: newMessage.messages.sender
                      ? {
                            id: newMessage.messages.sender.id.toString(),
                            username: newMessage.messages.sender.username,
                            avatar: newMessage.messages.sender.avatar,
                        }
                      : null,
              }
            : null,
    };

    return supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: "message",
        payload,
    });
}

export async function broadcastMember(
    conversationId: string,
    member: Member | { id: bigint },
    action: "added" | "removed"
) {
    const payload = {
        ...member,
        id: member.id.toString(), // normalize bigint/number → string
    };

    return supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: action === "added" ? "member_added" : "member_removed",
        payload,
    });
}
