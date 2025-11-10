// lib/broadcast.ts
import { Member, Reaction, BroadcastPayload, BroadcastNewMessage } from "@/lib/types";
import { createClient } from "@/lib/client";

const supabase = createClient();

type BroadcastPayloadToSend = Omit<BroadcastPayload, "created_at"> & { created_at: Date };

export async function broadcastMessage(conversationId: string, newMessage: BroadcastNewMessage) {
    const payload: BroadcastPayloadToSend = {
        id: newMessage.id.toString(),
        conversation_id: newMessage.conversation_id.toString(),
        content: newMessage.content ?? "",
        created_at: new Date(newMessage.created_at),
        sender:
            newMessage.type === "info"
                ? null
                : {
                      id: newMessage.sender_id ? newMessage.sender_id.toString() : null,
                      username: newMessage.sender_username ?? "",
                      avatar: newMessage.sender_avatar ?? null,
                  },
        image_url: newMessage.image_url ?? null,
        image_height: newMessage.image_height ?? null,
        image_width: newMessage.image_width ?? null,
        type: newMessage.type ?? "message",
        parent_id: newMessage.parent_id ? newMessage.parent_id.toString() : null,
        messages: newMessage.messages
            ? {
                  ...newMessage.messages,
                  id: newMessage.messages.id.toString(),
                  sender: newMessage.messages.sender
                      ? {
                            ...newMessage.messages.sender,
                            id: newMessage.messages.sender.id.toString(),
                        }
                      : null,
              }
            : null,
    };

    console.log("Broadcasting message:", payload);

    return supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: "message",
        payload,
    });
}

export async function broadcastReaction(conversationId: string, reaction: Reaction, action: "added" | "removed") {
    const payload = {
        ...reaction,
        id: reaction.id.toString(), // normalize bigint/number → string
        profile_id: reaction.profile_id.toString(),
        message_id: reaction.message_id.toString(),
    };

    return supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: action === "added" ? "reaction_added" : "reaction_removed",
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

export async function broadcastNameChange(conversationId: string, newName: string) {
    const payload = {
        id: conversationId,
        name: newName,
    };

    console.log("Broadcasting conversation name change:", payload);

    return supabase.channel(`conversation-${conversationId}`).send({
        type: "broadcast",
        event: "name_edited",
        payload,
    });
}
