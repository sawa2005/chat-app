"use client";

import { createClient } from "@/lib/client";
import { useEffect, useState, useRef, useCallback } from "react";
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
import type {
    Message,
    BroadcastPayload,
    BroadcastReactionPayload,
    BroadcastMessageEditedPayload,
    BroadcastMessageDeletedPayload,
} from "@/lib/types";
import { Spinner } from "../ui/spinner";
import { cn } from "@/utils";

const supabase = createClient();

// TODO: custom scroll bar styles.
// TODO: list profile pictures of users who have read a message.
// TODO: no country flags in emoji picker.

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
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);
    const [firstUnreadIndex, setFirstUnreadIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [imageCount, setImageCount] = useState(0);
    const [allImagesLoaded, setAllImagesLoaded] = useState(false);
    const [typers, setTypers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<bigint | null>(null);
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const [hasEverScrolledUp, setHasEverScrolledUp] = useState(false);
    const [isScrollable, setIsScrollable] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const checkScrollable = () => {
                setIsScrollable(container.scrollHeight > container.clientHeight);
            };
            checkScrollable();
            const resizeObserver = new ResizeObserver(checkScrollable);
            resizeObserver.observe(container);
            return () => resizeObserver.disconnect();
        }
    }, [messages, containerRef]);

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
    const handleImageLoad = useCallback(() => {
        setImageCount((prev) => prev - 1);
        // Scroll with same parameters as initial load if user hasn't scrolled
        if (!userHasScrolled && firstUnreadIndex === null) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Use force=true for initial scroll, smooth=false for subsequent images
                    const isInitialScroll = !hasDoneInitialScroll;
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
    }, [userHasScrolled, firstUnreadIndex, hasDoneInitialScroll, scrollToBottom, setHasDoneInitialScroll]);

    useEffect(() => {
        if (imageCount === 0) {
            setAllImagesLoaded(true);
        }
    }, [imageCount]);

    useEffect(() => {
        if (unreadCount > 0) {
            setTitle(`(${unreadCount}) ${conversationName}`);
        } else {
            setTitle(conversationName);
        }
    }, [unreadCount, conversationName, setTitle]);

    useEffect(() => {
        const index = messages.findIndex(
            (message) =>
                message.sender?.id !== currentProfileId &&
                !message.message_reads.some((read) => read.profile_id === currentProfileId)
        );
        setFirstUnreadIndex(index !== -1 ? index : null);
    }, [messages, currentProfileId]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            scrollStateRef.current = {
                scrollPos: container.scrollTop,
                scrollHeight: container.scrollHeight,
            };

            // Only track user scrolling, not programmatic scrolling
            if (!isProgrammaticScroll.current) {
                if (initialLoad) setInitialLoad(false);

                // Clear existing debounce timeout
                if (scrollDebounceRef.current) {
                    clearTimeout(scrollDebounceRef.current);
                }

                // Debounce the scroll state change
                scrollDebounceRef.current = setTimeout(() => {
                    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                    if (distanceFromBottom > 100) {
                        // Increased threshold to 100px
                        setUserHasScrolled(true);
                        setHasEverScrolledUp(true);
                    } else {
                        // Increased reset threshold to 20px
                        setUserHasScrolled(false);
                    }
                }, 150); // 150ms debounce
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
        const getMoreMessages = async () => {
            setIsLoadingMore(true);
            hasTriggeredLoadRef.current = true;

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

                    if (imageMessages.length > 0) {
                        setImageCount(imageMessages.length);
                    }

                    return updatedMessages;
                });

                requestAnimationFrame(() => {
                    const container = containerRef.current;
                    if (container) {
                        const { scrollPos, scrollHeight } = scrollStateRef.current;
                        const newScrollHeight = container.scrollHeight;
                        const heightDifference = newScrollHeight - scrollHeight;

                        container.scrollTop = scrollPos + heightDifference;
                        setIsLoadingMore(false);
                        hasTriggeredLoadRef.current = false;
                    }
                });

                const messageIds = await getMessageIds(conversationId);
                console.log(messageIds);

                // Check if all messages have loaded using current messages state
                if (firstMessageId && messageIds[0] && firstMessageId === messageIds[0]) {
                    setAllMessagesLoaded(true);
                }
            } catch (error) {
                console.error("Error loading more messages:", error);
                setIsLoadingMore(false);
                hasTriggeredLoadRef.current = false;
            }
        };

        if (isAtTop && !isLoadingMore && !allMessagesLoaded && !initialLoad && !hasTriggeredLoadRef.current) {
            getMoreMessages();
        }
    }, [isAtTop, conversationId, isLoadingMore, allMessagesLoaded, initialLoad, messages, containerRef]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && allImagesLoaded) {
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
    }, [allImagesLoaded, conversationId, currentProfileId]);

    // Initial scroll - handle both cases
    useEffect(() => {
        if (!loading && !hasDoneInitialScroll) {
            if (firstUnreadIndex !== null) {
                // Has unread messages
                if (imageCount === 0) {
                    // No images, scroll immediately
                    const unreadElement = document.getElementById(`message-item-${messages[firstUnreadIndex].id}`);
                    if (unreadElement) {
                        unreadElement.scrollIntoView({ behavior: "auto", block: "center" });
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
    }, [loading, imageCount, hasDoneInitialScroll, firstUnreadIndex, messages, scrollToBottom, containerRef]);

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
        const canMarkAsRead = hasEverScrolledUp || !isScrollable;
        if (!userHasScrolled && hasDoneInitialScroll && allImagesLoaded && canMarkAsRead) {
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
    }, [
        userHasScrolled,
        hasDoneInitialScroll,
        allImagesLoaded,
        hasEverScrolledUp,
        isScrollable,
        conversationId,
        currentProfileId,
    ]);

    useEffect(() => {
        if (!conversationId || !currentProfileId) return;

        // Reset scroll state for new conversation
        setUserHasScrolled(false);
        setInitialLoad(true);
        setHasDoneInitialScroll(false);

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
                    setAllImagesLoaded(true);
                } else {
                    setImageCount(imageMessages.length);
                    setAllImagesLoaded(false);
                }
            } catch (err) {
                console.error(err);
            }
        };
        init();

        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible") {
                if (!userHasScrolledRef.current && allImagesLoaded) {
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
                    setIsLoadingMore(true);
                    const messageIds = messagesRef.current.map((m) => m.id);
                    const lastMessageId =
                        messagesRef.current.length > 0
                            ? messagesRef.current[messagesRef.current.length - 1].id
                            : BigInt(0);
                    const newMessages = await refetchMessages(conversationId, messageIds, lastMessageId);

                    if (newMessages) {
                        setMessages((prevMessages) => {
                            const messageMap = new Map<string, Message>();

                            // Populate map with existing messages
                            prevMessages.forEach((msg) => messageMap.set(msg.id.toString(), msg));

                            // Merge in new/updated messages
                            newMessages.forEach((msg) => {
                                const messageWithDate = {
                                    ...msg,
                                    created_at: new Date(msg.created_at),
                                } as Message;
                                messageMap.set(msg.id.toString(), messageWithDate);
                            });

                            // Return sorted array
                            return Array.from(messageMap.values()).sort(
                                (a, b) => a.created_at.getTime() - b.created_at.getTime()
                            );
                        });
                    }
                    // This should be called regardless of whether new messages were found
                    setIsLoadingMore(false);
                }
            }
        };
        window.addEventListener("visibilitychange", handleVisibilityChange);

        const channel = supabase
            .channel(`conversation-${conversationId}`)
            .on("broadcast", { event: "message" }, ({ payload }: { payload: BroadcastPayload }) => {
                const message: Message = {
                    ...payload,
                    id: BigInt(payload.id),
                    created_at: new Date(payload.created_at),
                    sender:
                        payload.sender && payload.sender.id
                            ? {
                                  ...payload.sender,
                                  id: BigInt(payload.sender.id),
                              }
                            : null,
                    parent_id: payload.parent_id ? BigInt(payload.parent_id) : null,
                    messages: payload.messages
                        ? {
                              ...payload.messages,
                              id: BigInt(payload.messages.id),
                              sender: payload.messages.sender
                                  ? {
                                        ...payload.messages.sender,
                                        id: BigInt(payload.messages.sender.id),
                                    }
                                  : null,
                          }
                        : null,
                    // These are statically set as they are always the same for new messages
                    edited_at: null,
                    deleted: false,
                    message_reactions: [],
                    message_reads: [],
                };
                setMessages((prev) => (prev.find((m) => m.id === message.id) ? prev : [...prev, message]));
                if (userHasScrolledRef.current || document.visibilityState !== "visible") {
                    setHasNewMessage(true);
                }
                setUnreadCount((prev) => prev + 1);
                console.log("Received new message:", message);
            })
            .on("broadcast", { event: "message_edited" }, ({ payload }: { payload: BroadcastMessageEditedPayload }) => {
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
            .on(
                "broadcast",
                { event: "message_deleted" },
                ({ payload }: { payload: BroadcastMessageDeletedPayload }) => {
                    console.log("Message deleted:", payload);

                    setMessages((prev) => prev.map((m) => (m.id === BigInt(payload.id) ? { ...m, deleted: true } : m)));
                }
            )
            .on("broadcast", { event: "user_typing" }, ({ payload }: { payload: { username: string } }) => {
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
            .on("broadcast", { event: "reaction_added" }, ({ payload }: { payload: BroadcastReactionPayload }) => {
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
            .on("broadcast", { event: "reaction_removed" }, ({ payload }: { payload: BroadcastReactionPayload }) => {
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
    }, [conversationId, currentProfileId, currentUsername, allImagesLoaded, initialUnreadCount]);

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
        if (msg.sender?.id === currentProfileId) {
            setFirstUnreadIndex(null);
            markMessagesAsRead(conversationId, currentProfileId);
        }
        if (!userHasScrolledRef.current) {
            setHasNewMessage(false);
        }
    }

    const handleDelete = useCallback((messageId: bigint) => {
        deleteMessage(messageId)
            .then(() => {
                setMessages((prev) => prev.filter((m) => m.id !== messageId));
            })
            .catch((err) => console.error("Delete failed:", err));
    }, []);

    function handleScrollToBottom() {
        setHasNewMessage(false);
        if (unreadCount > 0 && firstUnreadIndex !== null) {
            const unreadElement = document.getElementById(`message-item-${messages[firstUnreadIndex].id}`);
            if (unreadElement) {
                unreadElement.scrollIntoView({ behavior: "auto", block: "center" });
                setUserHasScrolled(true);
            }
        } else {
            scrollToBottom(true, true);
        }
    }

    return (
        <div className="relative flex flex-col flex-1 min-h-0 gap-5">
            {loading ? (
                <SkeletonList />
            ) : (
                <>
                    {userHasScrolled && (
                        <div className="absolute top-0 z-10 w-full">
                            <BackToBottom onClick={() => handleScrollToBottom()} hasNewMessage={hasNewMessage} />
                        </div>
                    )}
                    <div
                        ref={containerRef}
                        className={cn(
                            userHasScrolled ? "mt-12" : "mt-5",
                            "relative flex-1 min-h-0 pr-4 overflow-y-auto overflow-x-hidden",
                            "hover:scrollbar-thumb-foreground scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted"
                        )}
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
                            handleDelete={handleDelete}
                            setReplyTo={setReplyTo}
                            containerRef={containerRef}
                            scrollToBottom={scrollToBottom}
                            conversationId={conversationId}
                            firstUnreadIndex={firstUnreadIndex}
                            initialLoad={initialLoad}
                            imageCount={imageCount}
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
                scrollToBottom={scrollToBottom}
            />
        </div>
    );
}
