import { isEmojiOnly } from "./messages";
import { Dispatch, SetStateAction, ReactNode, RefObject } from "react";
import { ImageIcon, MessageSquareReply } from "lucide-react";
import ChatImage from "../chat-image";
import emojiRegex from "emoji-regex";
import type { Message } from "@/lib/types";

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
    isConsecutive,
    scrollToBottom,
    setEditingMessageId,
    containerRef,
}: {
    message: Message;
    isOwner: boolean;
    isEditing: boolean;
    editContent: string;
    setEditContent: Dispatch<SetStateAction<string>>;
    onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    isConsecutive: boolean;
    scrollToBottom: (smooth?: boolean, force?: boolean, isImage?: boolean, imageHeight?: number) => void;
    setEditingMessageId: Dispatch<SetStateAction<string | null>>;
    containerRef: RefObject<HTMLDivElement | null>;
}) {
    const emojiOnly = isEmojiOnly(message.content);

    if (isEditing) {
        return (
            <div
                className={`group relative ${
                    !isOwner ? "bg-accent rounded-tl-none" : "rounded-tr-none ml-auto"
                } rounded-xl mb-4 shadow-lg/8 w-fit max-w-[80%]`}
            >
                <form onSubmit={onSubmitEdit}>
                    <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === "Escape" && setEditingMessageId(null)}
                        className="py-2 px-4"
                    />
                </form>
            </div>
        );
    }

    return (
        <>
            {message.messages && (
                <div className={`${isOwner ? "ml-auto" : ""} flex items-center w-fit mb-2 gap-1`}>
                    <div className="flex items-center bg-gray-100 py-1 px-2 rounded-full w-fit max-w-80">
                        <span className="text-sm font-semibold mr-1">
                            {message.messages.sender?.username || "Unknown"}
                        </span>
                        <span className="text-sm text-gray-600 truncate max-w-[100%]">
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
                    <MessageSquareReply size={18} className="text-gray-300" />
                </div>
            )}

            <div
                className={`group relative rounded-xl mb-2 w-fit break-words max-w-[80%] 
                ${emojiOnly ? "text-5xl" : "text-sm shadow-lg/5 inset-shadow-sm "} 
                ${emojiOnly && (isOwner ? "mr-[-1rem]" : "ml-[-1rem]")} 
                ${!emojiOnly && !isOwner && "bg-accent"} 
                ${!isOwner ? "rounded-tl-none" : "rounded-tr-none ml-auto"}`}
            >
                {message.content && (
                    <p className="py-2 px-4 message-content">{renderMessageContent(message.content)}</p>
                )}
                {message.image_url && (
                    <ChatImage
                        src={message.image_url}
                        alt="Message attachment"
                        onLoadingComplete={(img: HTMLImageElement) => {
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    console.log("Loaded image..");
                                    scrollToBottom(true, false, true, img.naturalHeight);
                                });
                            });
                        }}
                    />
                )}
            </div>
        </>
    );
}
