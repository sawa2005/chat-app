"use client";

import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import { sendMessage, deleteMessage } from "@/app/conversation/create/actions";
import SendMessageForm from "./send-message-form";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import TypingIndicator from "../typing-indicator";
import { loadInitMessages } from "@/app/conversation/create/actions";
import SkeletonList from "./skeleton-list";
import { MessageList } from "./message-list";
import emojiRegex from "emoji-regex";

const supabase = createClient();

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
};

// Returns true if the string contains only emojis
export function isEmojiOnly(message: string) {
    const regex = emojiRegex();
    const stripped = message.replace(/\s/g, "");
    const matched = stripped.match(regex);
    return matched !== null && matched.join("") === stripped;
}

export function isConsecutiveMessage(prev: Message | undefined, current: Message, cutoffMinutes = 5) {
    if (!prev) return false;
    if (prev.type === "info" || current.type === "info") return false;
    if (!prev.sender) return false;
    if (prev.sender.id !== current.sender?.id) return false;
    if (prev.messages?.id !== current.messages?.id) return false;

    const diffMs = current.created_at.getTime() - prev.created_at.getTime();
    return diffMs < cutoffMinutes * 60 * 1000;
}

export default function Messages({
    conversationId,
    currentUsername,
    currentProfileId,
    currentUserAvatar,
}: {
    conversationId: string;
    currentUsername: string;
    currentProfileId: bigint;
    currentUserAvatar: string | null;
}) {
    const { containerRef, scrollToBottom } = useChatScroll();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [typers, setTypers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<bigint | null>(null);

    // TODO: if height is too small to show messages, collapse header and members.
    // TODO: consider switching message hover text to on click instead.

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom, loading, typers]);

    useEffect(() => {
        const getMessages = async () => {
            const messages = await loadInitMessages(conversationId);

            setMessages(
                (
                    messages as {
                        id: bigint;
                        conversation_id: string;
                        content: string | null;
                        created_at: string;
                        edited_at: string | null;
                        image_url: string | null;
                        type: string;
                        deleted: boolean;
                        sender:
                            | { id: bigint; username: string; avatar: string | null }[]
                            | { id: bigint; username: string; avatar: string | null };
                        parent_id: bigint | null;
                        messages: {
                            id: bigint;
                            content: string | null;
                            image_url: string | null;
                            sender: { id: bigint; username: string; avatar: string } | null;
                        } | null;
                    }[]
                ).map((msg) => ({
                    ...msg,
                    sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
                    created_at: new Date(msg.created_at),
                })) as Message[]
            );

            setLoading(false);
        };

        getMessages().catch(console.error);

        const channel = supabase
            .channel(`conversation-${conversationId}`)
            .on("broadcast", { event: "message" }, ({ payload }) => {
                console.log("New Message broadcast:", payload);

                const message: Message = {
                    id: BigInt(payload.id),
                    conversation_id: payload.conversation_id,
                    content: payload.content ?? "",
                    created_at: new Date(payload.created_at),
                    edited_at: payload.edited_at ? new Date(payload.edited_at) : null,
                    sender: payload.sender
                        ? {
                              id: payload.sender.id ? BigInt(payload.sender.id) : null,
                              username: payload.sender.username ?? "",
                              avatar: payload.sender.avatar ?? null,
                          }
                        : null,
                    image_url: payload.image_url ?? null,
                    type: payload.type ?? "message",
                    deleted: payload.deleted ?? false,
                    parent_id: payload.parent_id ? BigInt(payload.parent_id) : null,
                    messages: payload.messages
                        ? {
                              id: BigInt(payload.messages.id),
                              content: payload.messages.content,
                              image_url: payload.messages.image_url,
                              sender: payload.messages.sender
                                  ? {
                                        id: BigInt(payload.messages.sender.id),
                                        username: payload.messages.sender.username,
                                        avatar: payload.messages.sender.avatar,
                                    }
                                  : null,
                          }
                        : null,
                };

                setMessages((prev) => (prev.find((m) => m.id === message.id) ? prev : [...prev, message]));
            })
            .on("broadcast", { event: "message_edited" }, ({ payload }) => {
                console.log("Message edited:", payload);

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === BigInt(payload.id)
                            ? {
                                  ...m,
                                  content: payload.content ?? m.content,
                                  edited_at: payload.edited_at ? new Date(payload.edited_at) : m.edited_at,
                              }
                            : m
                    )
                );
            })
            .on("broadcast", { event: "message_deleted" }, ({ payload }) => {
                console.log("Message deleted:", payload);

                setMessages((prev) => prev.map((m) => (m.id === BigInt(payload.id) ? { ...m, deleted: true } : m)));
            })
            .on("broadcast", { event: "user_typing" }, ({ payload }) => {
                console.log("User typing broadcast received:", payload);

                const name = payload.username as string;

                if (name === currentUsername) return;

                setTypers((prev) => {
                    // Add user, remove after 3 s
                    if (prev.includes(name)) return prev;
                    setTimeout(() => setTypers((p) => p.filter((n) => n !== name)), 3000);
                    return [...prev, name];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentUsername]);

    function handleNewMessage(msg: Message) {
        setMessages((prev) => {
            // Skip if the message already exists
            if (prev.some((m) => m.id === msg.id)) return prev;

            return [
                ...prev,
                {
                    ...msg,
                    messages: msg.parent_id ? msg.messages ?? null : null,
                },
            ];
        });
    }

    function handleDelete(messageId: bigint) {
        deleteMessage(messageId)
            .then(() => {
                setMessages((prev) => prev.filter((m) => m.id !== messageId));
            })
            .catch((err) => console.error("Delete failed:", err));
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-5">
            {loading ? (
                <SkeletonList />
            ) : (
                <div ref={containerRef} className="flex-1 min-h-0 pr-4 mt-5 overflow-y-auto overflow-x-hidden">
                    <MessageList
                        messages={messages}
                        currentUsername={currentUsername}
                        currentProfileId={currentProfileId}
                        editingMessageId={editingMessageId}
                        editContent={editContent}
                        setEditContent={setEditContent}
                        setEditingMessageId={setEditingMessageId}
                        handleDelete={handleDelete}
                        setReplyTo={setReplyTo}
                        scrollToBottom={scrollToBottom}
                    />
                </div>
            )}

            <TypingIndicator users={typers} />

            <SendMessageForm
                conversationId={conversationId}
                currentProfileId={currentProfileId}
                currentUsername={currentUsername}
                currentUserAvatar={currentUserAvatar}
                sendMessage={sendMessage}
                onNewMessage={handleNewMessage}
                replyTo={replyTo ?? null}
                setReplyTo={setReplyTo}
            />
        </div>
    );
}
