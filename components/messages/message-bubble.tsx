import { isEmojiOnly } from "@/lib/messages";
import { Dispatch, SetStateAction, RefObject, useRef, useCallback, useEffect } from "react";
import { ImageIcon, MessageSquareReply } from "lucide-react";
import ChatImage from "../chat-image";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { renderMessageContent } from "@/lib/render-helpers";
import { AutoSizingTextarea } from "../auto-sizing-textarea";

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
    messageItemWidth,
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
    messageItemWidth?: number;
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

    const bubbleClasses = cn(
        "relative w-fit rounded-xl overflow-hidden mb-2 max-w-full whitespace-pre-wrap wrap-break-word shadow-accent-foreground inset-shadow-accent",
        isOwner ? "ml-auto rounded-tr-none" : "rounded-tl-none",
        isEditing ? "bg-accent shadow-lg/8" : !emojiOnly && "shadow-lg/5 inset-shadow-sm",
        emojiOnly && !isEditing && (isOwner ? "-mr-4" : "-mr-4"),
        !emojiOnly && !isOwner && !isEditing && "bg-accent"
    );

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
                style={{ maxWidth: message.image_width ? `${message.image_width}px` : undefined }}
                className={bubbleClasses}
            >
                {isEditing ? (
                    <form ref={editFormRef} onSubmit={onSubmitEdit}>
                        <AutoSizingTextarea
                            ref={textAreaRef}
                            className="min-w-0 px-4 py-2 w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none overflow-hidden"
                            sizerClassName="fixed w-fit py-2 px-4"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    setEditingMessageId(null);
                                }
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    editFormRef.current?.requestSubmit();
                                }
                            }}
                            autoComplete="none"
                            maxWidth={messageItemWidth}
                            imageWidth={message.image_width ? message.image_width : undefined}
                        />
                    </form>
                ) : (
                    // Default view when not editing
                    message.content && (
                        <p className={cn(emojiOnly ? "text-5xl" : "text-sm", "box-border px-4 py-2")}>
                            {renderMessageContent(message.content)}
                        </p>
                    )
                )}

                {message.image_url && (
                    <div>
                        <ChatImage
                            src={message.image_url}
                            width={message.image_width}
                            height={message.image_height}
                            alt="Message attachment"
                            onLoadingComplete={onImageLoadCallback}
                            editing={isEditing}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
