"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { sendMessage } from "@/app/conversation/create/actions";
import SendMessageForm from "./send-message-form";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import ChatImage from "@/components/chat-image";

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
    image_url: string | null;
};

function isConsecutiveMessage(prev: Message | undefined, current: Message, cutoffMinutes = 5) {
    if (!prev) return false;
    if (prev.sender.id !== current.sender.id) return false;

    const diffMs = current.created_at.getTime() - prev.created_at.getTime();
    return diffMs < cutoffMinutes * 60 * 1000;
}

export default function Messages({
    conversationId,
    currentUsername,
    currentProfileId,
}: {
    conversationId: string;
    currentUsername: string;
    currentProfileId: bigint;
}) {
    const { containerRef, scrollToBottom } = useChatScroll();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // TODO: add different margin for consecutive messages by the same user.
    // TODO: if height is too small to show messages, collapse header and members.

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        async function loadInitMessages() {
            const { data, error } = await supabase
                .from("messages")
                .select(
                    `id,
                    conversation_id,
                    content,
                    created_at,
                    image_url,
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
                            image_url: string | null;
                        }[]
                    ).map((msg) => ({
                        ...msg,
                        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
                        created_at: new Date(msg.created_at),
                    })) as Message[]
                );

                setLoading(false);
            }
        }
        loadInitMessages();

        const broadcastChannel = supabase.channel(`conversation-${conversationId}`);

        broadcastChannel
            .on("broadcast", { event: "message" }, (payload) => {
                const message = payload.payload as Message;

                message.created_at = new Date(message.created_at);

                setMessages((prev) =>
                    prev.find((m) => m.id.toString() === message.id.toString()) ? prev : [...prev, message]
                );
            })
            .subscribe();

        return () => {
            supabase.removeChannel(broadcastChannel);
        };
    }, [conversationId]);

    return (
        <div>
            <h2 className="text-lg font-semibold mt-4">Messages</h2>
            {loading ? (
                <div className="mt-4">
                    <Skeleton className="h-[50px] w-[50%] rounded-xl" />
                    <Skeleton className="h-[40px] w-[55%] rounded-xl mt-3" />
                    <Skeleton className="h-[60px] w-[53%] rounded-xl mt-5 ml-auto" />
                    <Skeleton className="h-[40px] w-[59%] rounded-xl mt-5" />
                    <Skeleton className="h-[40px] w-[43%] rounded-xl mt-5 ml-auto" />
                    <Skeleton className="h-[80px] w-[55%] rounded-xl mt-3 ml-auto" />
                </div>
            ) : (
                <div ref={containerRef} className="flex-1 max-h-[calc(100vh-400px)] pr-4 mt-5 overflow-y-auto">
                    <ul className="list-none">
                        {messages.map((message, i) => {
                            const prevMsg = messages[i - 1];
                            const isConsecutive = isConsecutiveMessage(prevMsg, message);

                            return (
                                <li
                                    key={message.id}
                                    className={
                                        "max-w-9/10" +
                                        (message.sender.username === currentUsername ? "ml-auto" : "") +
                                        (isConsecutive ? " mt-[-10px]" : " mt-5")
                                    }
                                >
                                    {!isConsecutive ? (
                                        <p
                                            className={
                                                (message.sender.username === currentUsername ? "text-right" : "") +
                                                " text-xs mb-1"
                                            }
                                        >
                                            {(message.sender.username === currentUsername
                                                ? "You"
                                                : message.sender.username) +
                                                " / " +
                                                message.created_at.toLocaleDateString() +
                                                " - " +
                                                message.created_at.toLocaleTimeString()}
                                        </p>
                                    ) : (
                                        <p
                                            className={
                                                (message.sender.username === currentUsername ? "text-right" : "") +
                                                " text-xs mb-1 hidden group-hover:block"
                                            }
                                        >
                                            {message.created_at.toLocaleTimeString()}
                                        </p>
                                    )}
                                    <div
                                        className={
                                            "group relative " +
                                            (message.sender.username !== currentUsername
                                                ? "bg-accent rounded-tl-none"
                                                : "rounded-tr-none ml-auto") +
                                            " rounded-xl mb-4 inset-shadow-sm/8 shadow-lg/8 w-fit break-words max-w-[80%] overflow-hidden"
                                        }
                                    >
                                        {message.content && <p className="py-2 px-4">{message.content}</p>}

                                        {message.image_url && (
                                            <ChatImage src={message.image_url} alt="Message attachment" />
                                        )}

                                        {isConsecutive && (
                                            <p
                                                className={
                                                    (message.sender.username === currentUsername ? "text-right" : "") +
                                                    " absolute -bottom-5 right-0 text-xs text-muted-foreground hidden group-hover:block"
                                                }
                                            >
                                                {message.created_at.toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            <SendMessageForm
                conversationId={conversationId}
                currentProfileId={currentProfileId}
                currentUsername={currentUsername}
                sendMessage={sendMessage}
                onNewMessage={(msg) =>
                    setMessages((prev) =>
                        prev.some((m) => m.id.toString() === msg.id.toString()) ? prev : [...prev, msg]
                    )
                }
            />
        </div>
    );
}
