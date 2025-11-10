import { isEmojiOnly } from "./messages";
import { Dispatch, SetStateAction, RefObject, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { ImageIcon, MessageSquareReply } from "lucide-react";
import ChatImage from "../chat-image";
import type { Message } from "@/lib/types";
import { Textarea } from "../ui/textarea";
import { cn } from "@/utils";
import { renderMessageContent } from "@/utils/render-helpers";

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
    const bubbleRef = useRef<HTMLParagraphElement>(null);

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

    // Adjust edit textarea height & width based on bubble size
    useLayoutEffect(() => {
        if (isEditing && bubbleRef.current && textAreaRef.current) {
            if (CSS.supports("field-sizing", "content")) return;

            const size = bubbleRef.current.getBoundingClientRect();
            const ts = textAreaRef.current.style;

            ts.width = `${size.width}px`;
            ts.height = `${size.height}px`;
        }
    });

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
                    "relative rounded-xl overflow-hidden mb-2 w-fit break-words max-w-[80%] shadow-accent-foreground inset-shadow-foreground-muted",
                    isOwner ? "ml-auto rounded-tr-none" : "rounded-tl-none",
                    isEditing ? "bg-accent shadow-lg/8" : !emojiOnly && "shadow-lg/5 inset-shadow-sm",
                    emojiOnly && !isEditing && (isOwner ? "-mr-4" : "-mr-4"),
                    !emojiOnly && !isOwner && !isEditing && "bg-accent"
                )}
            >
                {isEditing && (
                    <form ref={editFormRef} onSubmit={onSubmitEdit} className="relative">
                        {/* Visible Textarea */}
                        <Textarea
                            ref={textAreaRef}
                            className={cn(
                                !CSS.supports("field-sizing", "content")
                                    ? "absolute top-0 left-0 z-10 leading-snug py-3"
                                    : "py-2",
                                "min-w-0 w-full px-4 field-sizing-content whitespace-pre-wrap bg-transparent resize-none border-0 focus-visible:ring-0 focus-visible:outline-none"
                            )}
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
                        />
                    </form>
                )}
                {message.content && (
                    // Message content (used as a fallback for sizing the textarea when editing)
                    <p
                        ref={bubbleRef}
                        className={cn(
                            isEditing && !CSS.supports("field-sizing", "content") ? "invisible py-3" : "py-2",
                            isEditing && CSS.supports("field-sizing", "content") && "hidden",
                            emojiOnly && !isEditing ? "text-5xl" : "text-sm",
                            "box-border px-4 whitespace-pre-wrap"
                        )}
                    >
                        {isEditing ? renderMessageContent(editContent) : renderMessageContent(message.content)}
                    </p>
                )}

                {message.image_url && (
                    <ChatImage
                        src={message.image_url}
                        width={message.image_width}
                        height={message.image_height}
                        alt="Message attachment"
                        onLoadingComplete={onImageLoadCallback}
                        editing={isEditing}
                    />
                )}
            </div>
        </>
    );
}
