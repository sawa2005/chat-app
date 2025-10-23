"use client";

import { createClient } from "@/lib/client";
import { useEffect, useState, useRef } from "react";
import {
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    loadInitMessages,
    getFirstUnreadIndex,
    loadMoreMessages,
    getMessageIds,
} from "@/app/conversation/create/actions";
import SendMessageForm from "./send-message-form";
import { useChatScroll, useIsScrollOnTop } from "@/hooks/use-chat-scroll";
import TypingIndicator from "../typing-indicator";
import SkeletonList from "./skeleton-list";
import { MessageList } from "./message-list";
import emojiRegex from "emoji-regex";
import type { Message } from "@/lib/types";
import { Spinner } from "../ui/spinner";

const supabase = createClient();

// Returns true if the string contains only emojis
export function isEmojiOnly(message: string) {
    const regex = emojiRegex();
    const stripped = message.replace(/\s/g, "");
    const matched = stripped.match(regex);
    return matched !== null && matched.join("") === stripped;
}

// TODO: scroll force with images loading but only if the user hasn't scrolled the page yet.
// TODO: re-fetch messages when user re-focuses browser.
// TODO: if user is scrolled more than box height away from bottom, don't mark new messages as read.
// TODO: if user is scrolled high enough, display back to bottom button.
// TODO: custom scroll bar styles.
// TODO: list profile pictures of users who have read a message.

// TODO: consider switching message hover text to on click instead.
// TODO: number of unread messages in tab title.

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
    const [initialLoad, setInitialLoad] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [firstUnreadIndex, setFirstUnreadIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageCount, setImageCount] = useState(0);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [typers, setTypers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<bigint | null>(null);
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
    const [userHasScrolled, setUserHasScrolled] = useState(false);
    const [hasDoneInitialScroll, setHasDoneInitialScroll] = useState(false);
    const scrollStateRef = useRef({ scrollPos: 0, scrollHeight: 0 });
    const isProgrammaticScroll = useRef(false);
    const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const hasTriggeredLoadRef = useRef(false);

    const isAtTop = useIsScrollOnTop(containerRef, loading || isLoadingMore);

    // Handle image loading completion
    const handleImageLoad = () => {
        console.log("Image loaded, hasDoneInitialScroll:", hasDoneInitialScroll, "userHasScrolled:", userHasScrolled);
        // Scroll with same parameters as initial load if user hasn't scrolled
        if (!userHasScrolled) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Use force=true for initial scroll, smooth=false for subsequent images
                    const isInitialScroll = !hasDoneInitialScroll;
                    console.log("Scrolling due to image load, isInitialScroll:", isInitialScroll);
                    scrollToBottom(
                        !isInitialScroll, // smooth: false for initial, true for subsequent
                        true, // force: always true for images
                        true, // isImage: true
                        undefined,
                        (value) => {
                            isProgrammaticScroll.current = value;
                        }
                    );

                    if (isInitialScroll) {
                        setHasDoneInitialScroll(true);
                    }
                });
            });
        }
    };

    useEffect(() => {
        console.log("imageLoading:", imageLoading);
    }, [imageLoading]);

    useEffect(() => {
        console.log("imageCount:", imageCount);
    }, [imageCount]);

    useEffect(() => {
        console.log(
            "isAtTop:",
            isAtTop,
            "isLoadingMore:",
            isLoadingMore,
            "allMessagesLoaded:",
            allMessagesLoaded,
            "initialLoad:",
            initialLoad
        );
    }, [isAtTop, isLoadingMore, allMessagesLoaded, initialLoad]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            scrollStateRef.current = {
                scrollPos: container.scrollTop,
                scrollHeight: container.scrollHeight,
            };

            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            console.log(
                "Scroll event - isProgrammaticScroll:",
                isProgrammaticScroll.current,
                "distanceFromBottom:",
                distanceFromBottom,
                "userHasScrolled:",
                userHasScrolled
            );

            // Only track user scrolling, not programmatic scrolling
            if (!isProgrammaticScroll.current) {
                if (initialLoad) setInitialLoad(false);

                // Clear existing debounce timeout
                if (scrollDebounceRef.current) {
                    clearTimeout(scrollDebounceRef.current);
                }

                // Debounce the scroll state change
                scrollDebounceRef.current = setTimeout(() => {
                    if (distanceFromBottom > 100) {
                        // Increased threshold to 100px
                        console.log("Setting userHasScrolled to true due to distance:", distanceFromBottom);
                        setUserHasScrolled(true);
                    } else if (distanceFromBottom <= 20) {
                        // Increased reset threshold to 20px
                        console.log("Setting userHasScrolled to false due to distance:", distanceFromBottom);
                        setUserHasScrolled(false);
                    }
                }, 150); // 150ms debounce
            } else {
                console.log("Ignoring scroll event - programmatic scroll detected");
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
            if (scrollDebounceRef.current) {
                clearTimeout(scrollDebounceRef.current);
            }
        };
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (isAtTop && !isLoadingMore && !allMessagesLoaded && !initialLoad && !hasTriggeredLoadRef.current) {
            console.log(
                "Loading more messages - isAtTop:",
                isAtTop,
                "isLoadingMore:",
                isLoadingMore,
                "allMessagesLoaded:",
                allMessagesLoaded,
                "initialLoad:",
                initialLoad
            );

            // Set the flag to prevent multiple loads
            hasTriggeredLoadRef.current = true;

            const getMoreMessages = async () => {
                setIsLoadingMore(true);

                try {
                    const firstMessageId = messages[0]?.id;
                    if (!firstMessageId) {
                        setIsLoadingMore(false);
                        hasTriggeredLoadRef.current = false;
                        return;
                    }

                    const newMessages = await loadMoreMessages(conversationId, firstMessageId);

                    if (!newMessages || newMessages.length === 0) {
                        console.log("No more messages to load");
                        setAllMessagesLoaded(true);
                        setIsLoadingMore(false);
                        return;
                    }

                    const formatted = (
                        newMessages as {
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
                    })) as Message[];

                    console.log("loading more messages:", newMessages);

                    setMessages((prevMessages) => {
                        const updatedMessages = [...formatted, ...prevMessages];

                        // Count images and set loading state for the updated messages
                        const imageMessages = updatedMessages.filter(
                            (message) => message.image_url !== null && message.deleted !== true
                        );
                        if (imageMessages.length === 0) {
                            setImageLoading(false);
                        } else {
                            setImageCount(imageMessages.length);
                            setImageLoading(true);
                        }

                        return updatedMessages;
                    });
                } catch (error) {
                    console.error("Error loading more messages:", error);
                    setIsLoadingMore(false);
                    hasTriggeredLoadRef.current = false;
                }
            };
            getMoreMessages();
        }
    }, [isAtTop, conversationId, isLoadingMore, allMessagesLoaded, initialLoad]);

    // Restore scroll position after more loaded messages
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !scrollStateRef.current.scrollHeight || !isLoadingMore) return;

        const { scrollPos, scrollHeight } = scrollStateRef.current;
        const newScrollHeight = container.scrollHeight;
        const heightDifference = newScrollHeight - scrollHeight;

        container.scrollTop = scrollPos + heightDifference;
        setIsLoadingMore(false);
        hasTriggeredLoadRef.current = false;

        (async () => {
            const messageIds = await getMessageIds(conversationId);
            console.log(messageIds);

            // Check if all messages have loaded using current messages state
            const firstMessageId = messages[0]?.id;
            if (firstMessageId && messageIds[0] && firstMessageId === messageIds[0]) {
                setAllMessagesLoaded(true);
            }
        })();
    }, [messages]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setFirstUnreadIndex(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    // Initial scroll - handle both cases
    useEffect(() => {
        if (!loading && !hasDoneInitialScroll) {
            console.log(
                "Initial scroll check - imageCount:",
                imageCount,
                "loading:",
                loading,
                "hasDoneInitialScroll:",
                hasDoneInitialScroll
            );
            if (imageCount === 0) {
                // No images, scroll immediately
                console.log("No images, scrolling immediately");
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        scrollToBottom(false, false, false, undefined, (value) => {
                            isProgrammaticScroll.current = value;
                        });
                        setHasDoneInitialScroll(true);
                    });
                });
            } else {
                // Has images, set up multiple fallback mechanisms
                console.log("Has images, setting up fallback mechanisms");

                // Primary fallback: timeout
                const fallbackTimeout = setTimeout(() => {
                    if (!hasDoneInitialScroll) {
                        console.log("Fallback scroll triggered - images may not have loaded properly");
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                // Force scroll to absolute bottom
                                scrollToBottom(false, true, false, undefined, (value) => {
                                    isProgrammaticScroll.current = value;
                                });
                                setHasDoneInitialScroll(true);
                            });
                        });
                    }
                }, 1000); // 1 second fallback - more aggressive

                // Secondary fallback: MutationObserver to watch for image changes
                const container = containerRef.current;
                let mutationTimeout: NodeJS.Timeout;

                if (container) {
                    const observer = new MutationObserver(() => {
                        if (!hasDoneInitialScroll) {
                            clearTimeout(mutationTimeout);
                            mutationTimeout = setTimeout(() => {
                                console.log("MutationObserver fallback scroll triggered");
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        scrollToBottom(false, true, false, undefined, (value) => {
                                            isProgrammaticScroll.current = value;
                                        });
                                        setHasDoneInitialScroll(true);
                                    });
                                });
                            }, 500); // Wait 500ms after DOM changes
                        }
                    });

                    observer.observe(container, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ["style", "class"],
                    });

                    return () => {
                        clearTimeout(fallbackTimeout);
                        clearTimeout(mutationTimeout);
                        observer.disconnect();
                    };
                }

                return () => clearTimeout(fallbackTimeout);
            }
        }
    }, [loading, imageCount, hasDoneInitialScroll, scrollToBottom, containerRef]);

    // Scroll on new messages
    useEffect(() => {
        requestAnimationFrame(() => {
            scrollToBottom(true, false, false, undefined, (value) => {
                isProgrammaticScroll.current = value;
            });
        });
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (!conversationId || !currentProfileId) return;

        // Reset scroll state for new conversation
        setUserHasScrolled(false);
        setInitialLoad(true);
        setHasDoneInitialScroll(false);

        let isMounted = true;

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

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                markMessagesAsRead(conversationId, currentProfileId).catch(console.error);
            }
        };
        window.addEventListener("visibilitychange", handleVisibilityChange);

        const getMessages = async () => {
            const messages = await loadInitMessages(conversationId);
            console.log("loading inital messages:", messages);

            if (!isMounted) return;

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

            // Count images and set loading state
            const imageMessages =
                messages?.filter((message) => message.image_url !== null && message.deleted !== true) ?? [];
            if (imageMessages.length === 0) {
                setImageLoading(false);
            } else {
                setImageCount(imageMessages.length);
                setImageLoading(true);
            }
        };
        getMessages().catch(console.error);

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
                console.log("Received new message:", message);
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
            .on("broadcast", { event: "reaction_added" }, ({ payload }) => {
                console.log("Reaction added broadcast received:", payload);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === BigInt(payload.message_id)
                            ? {
                                  ...m,
                                  message_reactions: [
                                      ...(m.message_reactions ?? []),
                                      {
                                          ...payload,
                                          id: BigInt(payload.id),
                                          profile_id: BigInt(payload.profile_id),
                                          message_id: BigInt(payload.message_id),
                                      },
                                  ],
                              }
                            : m
                    )
                );
            })
            .on("broadcast", { event: "reaction_removed" }, ({ payload }) => {
                console.log("Reaction removed broadcast received:", payload);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === BigInt(payload.message_id)
                            ? {
                                  ...m,
                                  message_reactions: (m.message_reactions ?? []).filter(
                                      (r) => r.id !== BigInt(payload.id)
                                  ),
                              }
                            : m
                    )
                );
            })
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
                    {isLoadingMore && (
                        <div className="m-auto w-fit py-5">
                            <Spinner />
                        </div>
                    )}
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
                        containerRef={containerRef}
                        scrollToBottom={scrollToBottom}
                        conversationId={conversationId}
                        firstUnreadIndex={firstUnreadIndex}
                        initialLoad={initialLoad}
                        imageCount={imageCount}
                        setImageLoading={setImageLoading}
                        onImageLoad={handleImageLoad}
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
                setFirstUnreadIndex={setFirstUnreadIndex}
            />
        </div>
    );
}
