"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Message = {
    id: bigint;
    conversation_id: string;
    content: string;
    created_at: Date;
    sender: {
        id: bigint;
        username: string;
    };
};

export default function Messages({
    conversationId,
    currentUsername,
}: {
    conversationId: string;
    currentUsername: string;
}) {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        console.log("messages: ", messages);
    }, [messages, setMessages]);

    useEffect(() => {
        async function loadInitMessages() {
            const { data, error } = await supabase
                .from("messages")
                .select(
                    `id,
                    conversation_id,
                    content,
                    created_at,
                    sender:profiles!fk_messages_sender (
                        id,
                        username
                    )`
                )
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (error || data === null) {
                console.log("Error loading messages:", { data, error });
                return;
            }

            if (data) {
                setMessages(
                    (
                        data as {
                            id: bigint;
                            conversation_id: string;
                            content: string;
                            created_at: string;
                            sender: { id: bigint; username: string }[] | { id: bigint; username: string };
                        }[]
                    ).map((msg) => ({
                        ...msg,
                        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
                        created_at: new Date(msg.created_at),
                    })) as Message[]
                );
            }
        }
        loadInitMessages();

        // listen for realtime changes
        const channel = supabase
            .channel("messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    return (
        <div>
            <h2 className="text-lg font-semibold mt-4">Messages</h2>
            <ul className="list-none">
                {messages.map((message) => (
                    <li
                        key={message.id}
                        className={"max-w-9/10 " + (message.sender.username === currentUsername ? "ml-auto" : "")}
                    >
                        <p
                            className={
                                (message.sender.username === currentUsername ? "text-right" : "") + " text-xs mb-1"
                            }
                        >
                            {(message.sender.username === currentUsername ? "You" : message.sender.username) +
                                " / " +
                                message.created_at.toLocaleDateString() +
                                " - " +
                                message.created_at.toLocaleTimeString()}
                        </p>
                        <div
                            className={
                                (message.sender.username !== currentUsername
                                    ? "bg-accent rounded-tl-none"
                                    : "rounded-tr-none ml-auto") +
                                " py-2 px-4 rounded-xl mb-4 inset-shadow-sm/8 shadow-lg/8 w-fit"
                            }
                        >
                            {message.content}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
