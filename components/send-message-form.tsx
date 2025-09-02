"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { sendMessage } from "@/app/conversation/create/actions";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type SendMessageFormProps = {
    conversationId: string;
    currentProfileId: bigint;
    currentUsername: string;
    sendMessage: typeof sendMessage; // pass server action from parent
    onNewMessage: (message: {
        id: bigint;
        conversation_id: string;
        content: string;
        created_at: Date;
        sender: {
            id: bigint;
            username: string;
        };
    }) => void;
};

export default function SendMessageForm({
    conversationId,
    currentProfileId,
    currentUsername,
    sendMessage,
    onNewMessage,
}: SendMessageFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [content, setContent] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim()) return;

        setIsPending(true);
        const newMessage = await sendMessage(conversationId, currentProfileId, content);

        onNewMessage({
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            content: newMessage.content ?? "",
            created_at: new Date(newMessage.created_at),
            sender: {
                id: newMessage.sender_id,
                username: currentUsername,
            },
        });

        // Broadcast the message to all clients in the conversation
        supabase.channel(`conversation-${conversationId}`).send({
            type: "broadcast",
            event: "message",
            payload: {
                id: newMessage.id.toString(),
                conversation_id: newMessage.conversation_id.toString(),
                content: newMessage.content ?? "",
                created_at: new Date(newMessage.created_at),
                sender: {
                    id: newMessage.sender_id.toString(),
                    username: currentUsername,
                },
            },
        });

        setContent(""); // clear field
        setIsPending(false);
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-1 mt-6">
            <Input
                name="content"
                type="text"
                placeholder="Type your message..."
                className="px-4 py-6"
                disabled={isPending}
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <Button type="submit" className="cursor-pointer py-6" disabled={isPending}>
                {isPending ? "Sending..." : "Send"}
            </Button>
        </form>
    );
}
