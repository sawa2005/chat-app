// lib/broadcast.ts
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
    } | null;
    image_url: string | null;
    type: string;
};

export async function broadcastMessage(
    conversationId: string,
    newMessage: {
        id: string | number | bigint;
        conversation_id: string | number | bigint;
        content?: string | null;
        created_at: string | Date;
        sender_id?: string | number | bigint | null;
        username?: string; // fallback removed
        image_url?: string | null;
        type?: string | null;
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
                      username: newMessage.username ?? "",
                  },
        image_url: uploadedImageUrl ?? newMessage.image_url ?? null,
        type: newMessage.type ?? "message",
    };

    return supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: "message",
        payload,
    });
}
