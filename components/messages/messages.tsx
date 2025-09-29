"use client";

import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import {
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    loadInitMessages,
    getFirstUnreadIndex,
} from "@/app/conversation/create/actions";
import SendMessageForm from "./send-message-form";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import TypingIndicator from "../typing-indicator";
import SkeletonList from "./skeleton-list";
import { MessageList } from "./message-list";
import emojiRegex from "emoji-regex";
import type { Message } from "@/lib/types";

const supabase = createClient();

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
    const [firstUnreadIndex, setFirstUnreadIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [typers, setTypers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<bigint | null>(null);

    // TODO: if height is too small to show messages, collapse header and members.
    // TODO: consider switching message hover text to on click instead.
    // TODO: add functionality to clear new message indicator on key press or message send.

    // TODO: don't scroll for reactions changing, or maybe scroll to the message in question.
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom, loading, typers]);

    useEffect(() => {}, [conversationId, currentProfileId]);

    useEffect(() => {
        if (!conversationId || !currentProfileId) return;

        let isMounted = true;

        // 1️⃣ Fetch initial unread index and mark messages as read
        const initUnread = async () => {
            try {
                const initialIndex = await getFirstUnreadIndex(conversationId, currentProfileId);
                if (!isMounted) return;

                // Freeze the unread index in state
                setFirstUnreadIndex(initialIndex !== null ? Number(initialIndex) : null);

                // Mark messages as read in DB (UI state remains)
                await markMessagesAsRead(conversationId, currentProfileId);
            } catch (err) {
                console.error(err);
            }
        };
        initUnread();

        // 2️⃣ Optional: mark messages as read again when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                markMessagesAsRead(conversationId, currentProfileId).catch(console.error);
            }
        };
        window.addEventListener("visibilitychange", handleVisibilityChange);

        // 3️⃣ Load initial messages
        const getMessages = async () => {
            const messages = await loadInitMessages(conversationId);
            if (!isMounted) return;

            // ⬇️ Keep your original setMessages block EXACTLY as you wrote it
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

        // 4️⃣ Subscribe to Supabase message events
        const channel = supabase
            .channel(`conversation-${conversationId}`)
            .on("broadcast", { event: "message" }, ({ payload }) => {
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
                    message_reactions: payload.message_reactions ?? null,
                    message_reads: payload.message_reads ?? [],
                };
                setMessages((prev) => (prev.find((m) => m.id === message.id) ? prev : [...prev, message]));
            })
            // ...keep your other .on handlers unchanged...
            .subscribe();

        return () => {
            isMounted = false;
            window.removeEventListener("visibilitychange", handleVisibilityChange);
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentProfileId, currentUsername]);

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
                        conversationId={conversationId}
                        firstUnreadIndex={firstUnreadIndex}
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
