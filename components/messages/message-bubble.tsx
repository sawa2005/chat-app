import { isEmojiOnly } from "./messages";
import { Dispatch, SetStateAction, ReactNode, RefObject, useRef, useCallback, useEffect } from "react";
import { ImageIcon, MessageSquareReply } from "lucide-react";
import ChatImage from "../chat-image";
import emojiRegex from "emoji-regex";
import type { Message } from "@/lib/types";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";

// TODO: move these functions to lib or utils folder

function linkifyMessage(text: string) {
    // Regex to match URLs (simple version)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, idx) => {
        if (urlRegex.test(part)) {
            return (
                <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {part}
                </a>
            );
        } else {
            return part;
        }
    });
}

export function renderMessageContent(text: string) {
    const regex = emojiRegex();
    const result: ReactNode[] = [];
    let lastIndex = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
        // Push text before the emoji
        if (match.index > lastIndex) {
            result.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
        }

        const emoji = match[0];

        // Wrap the emoji in a span with emoji-specific font
        result.push(
            <span key={match.index} className="emoji">
                {emoji}
            </span>
        );

        lastIndex = regex.lastIndex;
    }

    // Push remaining text
    if (lastIndex < text.length) {
        result.push(<span key={lastIndex}>{linkifyMessage(text.slice(lastIndex))}</span>);
    }

    return result;
}

export function MessageBubble({
    message,
    isOwner,
    isEditing,
    editContent,
    setEditContent,
    onSubmitEdit,
    scrollToBottom,
    initialLoad,
    setEditingMessageId,
    onImageLoad,
}: {
    message: Message;
    isOwner: boolean;
    isEditing: boolean;
    editContent: string;
    setEditContent: Dispatch<SetStateAction<string>>;
    onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    isConsecutive: boolean;
    scrollToBottom: (
        smooth?: boolean,
        force?: boolean,
        isImage?: boolean,
        imageHeight?: number,
        setProgrammaticScroll?: (value: boolean) => void
    ) => void;
    initialLoad: boolean;
    setEditingMessageId: Dispatch<SetStateAction<string | null>>;
    containerRef: RefObject<HTMLDivElement | null>;
    onImageLoad?: () => void;
}) {
    const emojiOnly = message.content ? isEmojiOnly(message.content) : false;
    const editFormRef = useRef<HTMLFormElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const onImageLoadCallback = useCallback(
        (img: HTMLImageElement) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    console.log("Loaded image..");
                    onImageLoad?.();
                    if (!initialLoad) {
                        scrollToBottom(true, false, true, img.naturalHeight);
                    }
                });
            });
        },
        [initialLoad, onImageLoad, scrollToBottom]
    );

    // Focus textarea and move cursor to end when entering edit mode
    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            const t = textAreaRef.current;
            t.focus();
            t.setSelectionRange(t.value.length, t.value.length);
        }
    }, [isEditing]);

    return (
        <>
            {/* Reply bubble */}
            {message.messages && (
                <div className={`${isOwner ? "ml-auto" : ""} flex items-center w-fit mb-2 gap-1`}>
                    <div className="flex items-center bg-secondary py-1 px-2 rounded-full w-fit max-w-80">
                        <span className="text-sm font-semibold mr-1">
                            {message.messages.sender?.username || "Unknown"}
                        </span>
                        <span className="text-sm truncate max-w-full">
                            {message.messages.content === "" ? (
                                message.messages.image_url ? (
                                    <ImageIcon className="text-muted-foreground" size={15} />
                                ) : (
                                    ""
                                )
                            ) : (
                                message.messages.content
                            )}
                        </span>
                    </div>
                    <MessageSquareReply size={18} className="text-accent-foreground" />
                </div>
            )}

            {/* Unified message bubble */}
            <div
                className={cn(
                    "relative rounded-xl overflow-hidden mb-2 w-fit wrap-break-word max-w-[80%] shadow-accent-foreground inset-shadow-foreground-muted",
                    isOwner ? "ml-auto rounded-tr-none" : "rounded-tl-none",
                    isEditing
                        ? "bg-accent shadow-lg/8"
                        : emojiOnly
                        ? "text-5xl"
                        : "text-sm shadow-lg/5 inset-shadow-sm",
                    emojiOnly && !isEditing && (isOwner ? "-mr-4" : "-mr-4"),
                    !emojiOnly && !isOwner && !isEditing && "bg-accent"
                )}
            >
                {isEditing ? (
                    <form ref={editFormRef} onSubmit={onSubmitEdit}>
                        <Textarea
                            ref={textAreaRef}
                            className="px-4 grow break-words h-min min-h-0 max-h-[25vh] overflow-y-auto overflow-x-hidden resize-none focus-visible:outline-none focus-visible:ring-0 border-0 rounded-none"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditingMessageId(null);
                                } else if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    editFormRef.current?.requestSubmit();
                                }
                            }}
                            autoComplete="none"
                        />
                    </form>
                ) : (
                    message.content && (
                        <p className="py-2 px-4 message-content whitespace-pre-wrap">
                            {renderMessageContent(message.content)}
                        </p>
                    )
                )}

                {message.image_url && (
                    <ChatImage
                        src={message.image_url}
                        alt="Message attachment"
                        onLoadingComplete={onImageLoadCallback}
                        editing={isEditing}
                    />
                )}
            </div>
        </>
    );
}
