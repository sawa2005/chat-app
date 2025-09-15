"use client";

import { createClient } from "@/lib/client";
import { useEffect, useState } from "react";
import { editMessage, sendMessage, deleteMessage } from "@/app/conversation/create/actions";
import SendMessageForm from "./send-message-form";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import ChatImage from "@/components/chat-image";
import TypingIndicator from "./typing-indicator";
import { Pen, Trash, X } from "lucide-react";
import { loadInitMessages } from "@/app/conversation/create/actions";

const supabase = createClient();

type Message = {
    id: bigint;
    conversation_id: string;
    content: string;
    created_at: Date;
    edited_at: Date | null;
    sender: {
        id: bigint | null;
        username: string;
    } | null;
    image_url: string | null;
    type: string;
    deleted: boolean;
};

function isConsecutiveMessage(prev: Message | undefined, current: Message, cutoffMinutes = 5) {
    if (!prev) return false;
    if (prev.type === "info" || current.type === "info") return false;
    if (!prev.sender) return false;
    if (prev.sender.id !== current.sender?.id) return false;

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
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [typers, setTypers] = useState<string[]>([]);

    // TODO: if height is too small to show messages, collapse header and members.
    // TODO: consider switching message hover text to on click instead.
    // TODO: split file into more components.
    // TODO: change date format to date if old and time if newer.

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
                        content: string;
                        created_at: string;
                        sender: { id: bigint; username: string }[] | { id: bigint; username: string };
                        image_url: string | null;
                        type: string;
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
                          }
                        : null,
                    image_url: payload.image_url ?? null,
                    type: payload.type ?? "message",
                    deleted: payload.deleted ?? false,
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
    }, [conversationId]);

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
                <div className="mt-4">
                    <Skeleton className="h-[50px] w-[50%] rounded-xl" />
                    <Skeleton className="h-[40px] w-[55%] rounded-xl mt-3" />
                    <Skeleton className="h-[60px] w-[53%] rounded-xl mt-5 ml-auto" />
                    <Skeleton className="h-[40px] w-[59%] rounded-xl mt-5" />
                    <Skeleton className="h-[40px] w-[43%] rounded-xl mt-5 ml-auto" />
                    <Skeleton className="h-[80px] w-[55%] rounded-xl mt-3 ml-auto" />
                </div>
            ) : (
                <div ref={containerRef} className="flex-1 min-h-0 pr-4 mt-5 overflow-y-auto">
                    <ul className="list-none">
                        {messages.map((message, i) => {
                            const isEditing = editingMessageId === message.id.toString();

                            if (message.type === "info") {
                                // console.log("info message:", message);
                                return (
                                    <li
                                        key={message.id}
                                        className="text-xs font-mono text-muted-foreground m-auto block w-fit my-10 text-center"
                                    >
                                        {message.content}
                                    </li>
                                );
                            } else if (message.type === "message" && message.deleted === false) {
                                // console.log("message:", message);
                                const prevMsg = messages[i - 1];
                                const isConsecutive = isConsecutiveMessage(prevMsg, message);

                                return (
                                    <li
                                        key={message.id}
                                        className={
                                            "relative group max-w-9/10 " +
                                            (message.sender?.username === currentUsername ? "ml-auto" : "") +
                                            (isConsecutive ? " mt-[-10px]" : " mt-5")
                                        }
                                    >
                                        {!isConsecutive ? (
                                            <div
                                                className={
                                                    (message.sender?.username === currentUsername
                                                        ? "text-right justify-end"
                                                        : "") + " text-xs mb-1 flex items-center"
                                                }
                                            >
                                                {message.sender?.username === currentUsername &&
                                                    (editingMessageId === null ? (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    handleDelete(message.id);
                                                                }}
                                                                className="
                                                            opacity-0 group-hover:opacity-100 mr-2
                                                            text-muted-foreground hover:text-primary cursor-pointer"
                                                                title="Delete Message"
                                                            >
                                                                <Trash size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessageId(message.id.toString());
                                                                    setEditContent(message.content);
                                                                }}
                                                                className="
                                                            opacity-0 group-hover:opacity-100 mr-2
                                                            text-muted-foreground hover:text-primary cursor-pointer"
                                                                title="Edit Message"
                                                            >
                                                                <Pen size={15} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingMessageId(null);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 mr-2 text-muted-foreground hover:text-red-800 cursor-pointer"
                                                            title="Edit Message"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    ))}
                                                {(message.sender?.username === currentUsername
                                                    ? "You"
                                                    : message.sender?.username) +
                                                    " / " +
                                                    message.created_at.toLocaleDateString() +
                                                    " - " +
                                                    message.created_at.toLocaleTimeString() +
                                                    (message.edited_at !== null ? " (edited)" : "")}
                                            </div>
                                        ) : (
                                            <div
                                                className={
                                                    (message.sender?.username === currentUsername ? "text-right" : "") +
                                                    " text-xs mb-1 hidden group-hover:flex justify-end items-center"
                                                }
                                            >
                                                {message.sender?.username === currentUsername &&
                                                    (editingMessageId === null ? (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    handleDelete(message.id);
                                                                }}
                                                                className="
                                                            opacity-0 group-hover:opacity-100 mr-2
                                                            text-muted-foreground hover:text-primary cursor-pointer"
                                                                title="Delete Message"
                                                            >
                                                                <Trash size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessageId(message.id.toString());
                                                                    setEditContent(message.content);
                                                                }}
                                                                className="
                                                            opacity-0 group-hover:opacity-100 mr-2
                                                            text-muted-foreground hover:text-primary cursor-pointer"
                                                                title="Edit Message"
                                                            >
                                                                <Pen size={15} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingMessageId(null);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-800 cursor-pointer"
                                                            title="Edit Message"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    ))}
                                                {message.created_at.toLocaleTimeString()}
                                            </div>
                                        )}

                                        {isEditing ? (
                                            <div
                                                className={
                                                    "group relative " +
                                                    (message.sender?.username !== currentUsername
                                                        ? "bg-accent rounded-tl-none"
                                                        : "rounded-tr-none ml-auto") +
                                                    " rounded-xl mb-4 inset-shadow-sm/8 shadow-lg/8 w-fit break-words max-w-[80%] overflow-hidden"
                                                }
                                            >
                                                <form
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        await editMessage(message.id, editContent);
                                                        setEditingMessageId(null);
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Escape") setEditingMessageId(null);
                                                        }}
                                                        className="py-2 px-4"
                                                    />
                                                </form>
                                            </div>
                                        ) : (
                                            <div
                                                className={
                                                    "group relative " +
                                                    (message.sender?.username !== currentUsername
                                                        ? "bg-accent rounded-tl-none"
                                                        : "rounded-tr-none ml-auto") +
                                                    " rounded-xl mb-4 inset-shadow-sm/8 shadow-lg/8 w-fit break-words max-w-[80%] overflow-hidden"
                                                }
                                            >
                                                {message.content && (
                                                    <div>
                                                        <p className="py-2 px-4">{message.content}</p>
                                                    </div>
                                                )}

                                                {message.image_url && (
                                                    <ChatImage
                                                        src={message.image_url}
                                                        alt="Message attachment"
                                                        onLoadingComplete={() => scrollToBottom(false)}
                                                    />
                                                )}

                                                {isConsecutive && (
                                                    <p
                                                        className={
                                                            (message.sender?.username === currentUsername
                                                                ? "text-right"
                                                                : "") +
                                                            " absolute -bottom-5 right-0 text-xs text-muted-foreground hidden group-hover:block"
                                                        }
                                                    >
                                                        {message.created_at.toLocaleTimeString()}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            }
                        })}
                    </ul>
                </div>
            )}
            <TypingIndicator users={typers} />
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
