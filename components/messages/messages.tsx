import { createClient } from "@/lib/client";
import { useEffect, useState, useRef } from "react";
import {
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    loadInitMessages,
    loadMoreMessages,
    getMessageIds,
    refetchMessages,
} from "@/app/conversation/create/actions";
import SendMessageForm from "./send-message-form";
import { useChatScroll, useIsScrollOnTop } from "@/hooks/use-chat-scroll";
import { useTabTitle } from "@/hooks/use-tab-title";
import TypingIndicator from "../typing-indicator";
import SkeletonList from "./skeleton-list";
import { MessageList } from "./message-list";
import { BackToBottom } from "./back-to-bottom";
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

// TODO: re-fetch messages when user re-focuses browser.
// TODO: custom scroll bar styles.
// TODO: list profile pictures of users who have read a message.
// TODO: consider switching message hover text to on click instead.

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
    conversationName,
    currentUsername,
    currentProfileId,
    currentUserAvatar,
    initialUnreadCount,
}: {
    conversationId: string;
    conversationName: string;
    currentUsername: string;
    currentProfileId: bigint;
    currentUserAvatar: string | null;
    initialUnreadCount: number | null;
}) {
    const { containerRef, scrollToBottom } = useChatScroll();
    const [initialLoad, setInitialLoad] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [firstUnreadIndex, setFirstUnreadIndex] = useState<number | null>(null);
    const [firstUnreadIndexCalculated, setFirstUnreadIndexCalculated] = useState(false);
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
    const userHasScrolledRef = useRef(userHasScrolled);
    useEffect(() => {
        userHasScrolledRef.current = userHasScrolled;
    }, [userHasScrolled]);

    const [hasDoneInitialScroll, setHasDoneInitialScroll] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount ?? 0);
    const setTitle = useTabTitle(conversationName);
    const scrollStateRef = useRef({ scrollPos: 0, scrollHeight: 0 });
    const isProgrammaticScroll = useRef(false);
    const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const hasTriggeredLoadRef = useRef(false);

    const isAtTop = useIsScrollOnTop(containerRef, loading || isLoadingMore);

    // Handle image loading completion
    const handleImageLoad = () => {
        /* console.log("Image loaded, hasDoneInitialScroll:", hasDoneInitialScroll, "userHasScrolled:", userHasScrolled); */
        // Scroll with same parameters as initial load if user hasn't scrolled
        if (!userHasScrolled && firstUnreadIndex === null) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Use force=true for initial scroll, smooth=false for subsequent images
                    const isInitialScroll = !hasDoneInitialScroll;
                    /* console.log("Scrolling due to image load, isInitialScroll:", isInitialScroll); */
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
        if (unreadCount > 0) {
            setTitle(`(${unreadCount}) ${conversationName}`);
        } else {
            setTitle(conversationName);
        }
    }, [unreadCount, conversationName, setTitle]);

    useEffect(() => {
        if (messages.length > 0) {
            const index = messages.findIndex(
                (message) =>
                    message.sender?.id !== currentProfileId &&
                    !message.message_reads.some((read) => read.profile_id === currentProfileId)
            );
            setFirstUnreadIndex(index !== -1 ? index : null);
            setFirstUnreadIndexCalculated(true);
        }
    }, [messages, currentProfileId]);

    /* useEffect(() => {
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
    }, [isAtTop, isLoadingMore, allMessagesLoaded, initialLoad]); */

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            scrollStateRef.current = {
                scrollPos: container.scrollTop,
                scrollHeight: container.scrollHeight,
            };

            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            /* console.log(
                "Scroll event - isProgrammaticScroll:",
                isProgrammaticScroll.current,
                "distanceFromBottom:",
                distanceFromBottom,
                "userHasScrolled:",
                userHasScrolled
            ); */

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
                        /* console.log("Setting userHasScrolled to true due to distance:", distanceFromBottom); */
                        setUserHasScrolled(true);
                    } else if (distanceFromBottom <= 20) {
                        // Increased reset threshold to 20px
                        /* console.log("Setting userHasScrolled to false due to distance:", distanceFromBottom); */
                        setUserHasScrolled(false);
                    }
                }, 150); // 150ms debounce
            } else {
                /* console.log("Ignoring scroll event - programmatic scroll detected"); */
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
            /* console.log(
                "Loading more messages - isAtTop:",
                isAtTop,
                "isLoadingMore:",
                isLoadingMore,
                "allMessagesLoaded:",
                allMessagesLoaded,
                "initialLoad:",
                initialLoad
            ); */

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

                    const formatted = newMessages.map((msg) => ({
                        ...msg,
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
                setUnreadCount(0);
                markMessagesAsRead(conversationId, currentProfileId);

                // Optimistically update the messages state
                setMessages((prevMessages) =>
                    prevMessages.map((message) => ({
                        ...message,
                        message_reads: [...message.message_reads, { profile_id: currentProfileId }],
                    }))
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    // Initial scroll - handle both cases
    useEffect(() => {
        if (!loading && !hasDoneInitialScroll && firstUnreadIndexCalculated) {
            if (firstUnreadIndex !== null) {
                // Has unread messages
                if (imageCount === 0) {
                    // No images, scroll immediately
                    const unreadElement = document.getElementById(`message-item-${messages[firstUnreadIndex].id}`);
                    if (unreadElement) {
                        unreadElement.scrollIntoView({ behavior: "auto", block: "center" });
                        setUserHasScrolled(true);
                    }
                    setHasDoneInitialScroll(true);
                } else {
                    // Has images, use fallbacks to scroll to unread
                    const unreadElementId = `message-item-${messages[firstUnreadIndex].id}`;

                    const performScroll = () => {
                        const unreadElement = document.getElementById(unreadElementId);
                        if (unreadElement) {
                            unreadElement.scrollIntoView({ behavior: "auto", block: "center" });
                        }
                        setHasDoneInitialScroll(true);
                    };

                    // Primary fallback: timeout
                    const fallbackTimeout = setTimeout(() => {
                        if (!hasDoneInitialScroll) {
                            performScroll();
                        }
                    }, 1000);

                    // Secondary fallback: MutationObserver
                    const container = containerRef.current;
                    let mutationTimeout: NodeJS.Timeout;

                    if (container) {
                        const observer = new MutationObserver(() => {
                            if (!hasDoneInitialScroll) {
                                clearTimeout(mutationTimeout);
                                mutationTimeout = setTimeout(() => {
                                    performScroll();
                                }, 500);
                            }
                        });

                        observer.observe(container, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: ["style", "class", "src"],
                        });

                        return () => {
                            clearTimeout(fallbackTimeout);
                            clearTimeout(mutationTimeout);
                            observer.disconnect();
                        };
                    }

                    return () => clearTimeout(fallbackTimeout);
                }
            } else {
                // No unread messages
                if (imageCount === 0) {
                    // No images, scroll to bottom immediately
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            scrollToBottom(false, true, false, undefined, (value) => {
                                isProgrammaticScroll.current = value;
                            });
                            setUserHasScrolled(false);
                            setHasDoneInitialScroll(true);
                        });
                    });
                } else {
                    // Has images, use fallbacks to scroll to bottom
                    const performScrollToBottom = () => {
                        scrollToBottom(false, true, false, undefined, (value) => {
                            isProgrammaticScroll.current = value;
                        });
                        setHasDoneInitialScroll(true);
                    };

                    // Primary fallback: timeout
                    const fallbackTimeout = setTimeout(() => {
                        if (!hasDoneInitialScroll) {
                            performScrollToBottom();
                        }
                    }, 1000);

                    // Secondary fallback: MutationObserver
                    const container = containerRef.current;
                    let mutationTimeout: NodeJS.Timeout;

                    if (container) {
                        const observer = new MutationObserver(() => {
                            if (!hasDoneInitialScroll) {
                                clearTimeout(mutationTimeout);
                                mutationTimeout = setTimeout(() => {
                                    performScrollToBottom();
                                }, 500);
                            }
                        });

                        observer.observe(container, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: ["style", "class", "src"],
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
        }
    }, [
        loading,
        imageCount,
        hasDoneInitialScroll,
        firstUnreadIndexCalculated,
        firstUnreadIndex,
        messages,
        scrollToBottom,
        containerRef,
    ]);

    // Scroll on new messages
    useEffect(() => {
        if (hasDoneInitialScroll) {
            requestAnimationFrame(() => {
                scrollToBottom(true, false, false, undefined, (value) => {
                    isProgrammaticScroll.current = value;
                });
            });
        }
    }, [messages, scrollToBottom, hasDoneInitialScroll]);

    useEffect(() => {
        if (!userHasScrolled && !initialLoad) {
            markMessagesAsRead(conversationId, currentProfileId);
            setUnreadCount(0);

            // Optimistically update the messages state
            setMessages((prevMessages) =>
                prevMessages.map((message) => ({
                    ...message,
                    message_reads: [...message.message_reads, { profile_id: currentProfileId }],
                }))
            );
        }
    }, [userHasScrolled, conversationId, currentProfileId, initialLoad]);

    useEffect(() => {
        if (!conversationId || !currentProfileId) return;

        // Reset scroll state for new conversation
        setUserHasScrolled(false);
        setInitialLoad(true);
        setHasDoneInitialScroll(false);
        setFirstUnreadIndexCalculated(false);

        let isMounted = true;

        const init = async () => {
            try {
                const messages = await loadInitMessages(conversationId, initialUnreadCount ?? undefined);
                console.log("loading inital messages:", messages);

                if (!isMounted || !messages) return;

                setMessages(
                    messages.map((msg) => ({
                        ...msg,
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
            } catch (err) {
                console.error(err);
            }
        };
        init();

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible") {
                if (!userHasScrolledRef.current) {
                    setUnreadCount(0);
                    markMessagesAsRead(conversationId, currentProfileId).catch(console.error);

                    // Optimistically update the messages state
                    setMessages((prevMessages) =>
                        prevMessages.map((message) => ({
                            ...message,
                            message_reads: [...message.message_reads, { profile_id: currentProfileId }],
                        }))
                    );
                } else {
                    const messageIds = messages.map((m) => m.id);
                    const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : BigInt(0);
                    const newMessages = await refetchMessages(conversationId, messageIds, lastMessageId);

                    if (newMessages) {
                        const newMessagesMap = new Map(newMessages.map((m) => [m.id.toString(), m]));
                        setMessages((prevMessages) => {
                            const updatedMessages = prevMessages.map((pm) => {
                                const newMsg = newMessagesMap.get(pm.id.toString());
                                return newMsg ? { ...pm, ...newMsg, created_at: new Date(newMsg.created_at) } : pm;
                            });
                            const existingIds = new Set(updatedMessages.map((m) => m.id.toString()));
                            const newerMessages = newMessages.filter((nm) => !existingIds.has(nm.id.toString()));
                            return [
                                ...updatedMessages,
                                ...newerMessages.map((nm) => ({ ...nm, created_at: new Date(nm.created_at) })),
                            ];
                        });
                    }
                }
            }
        };
        window.addEventListener("visibilitychange", handleVisibilityChange);

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
                setUnreadCount((prev) => prev + 1);
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
        <div className="relative flex flex-col flex-1 min-h-0 gap-5">
            {loading ? (
                <SkeletonList />
            ) : (
                <>
                    {userHasScrolled && (
                        <div className="absolute top-0 z-10 w-full">
                            <BackToBottom onClick={() => scrollToBottom(true, true)} />
                        </div>
                    )}
                    <div
                        ref={containerRef}
                        className={`${
                            userHasScrolled ? "mt-12" : "mt-5"
                        } relative flex-1 min-h-0 pr-4 overflow-y-auto overflow-x-hidden`}
                    >
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
                </>
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
                scrollToBottom={scrollToBottom}
            />
        </div>
    );
}
