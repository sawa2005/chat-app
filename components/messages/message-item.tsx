import { Message } from "@/lib/types";
import { RefObject, Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import { isConsecutiveMessage } from "@/utils/messages";
import { MessageHeader } from "./message-header";
import { MessageBubble } from "./message-bubble";
import { editMessage, addReaction, removeReaction } from "@/app/conversation/create/actions";
import { ReactionBar } from "../reaction-bar";

export function MessageItem({
    message,
    prevMessage,
    currentUsername,
    currentProfileId,
    handleDelete,
    setReplyTo,
    scrollToBottom,
    initialLoad,
    conversationId,
    containerRef,
    onImageLoad,
}: {
    message: Message;
    prevMessage: Message;
    currentUsername: string;
    currentProfileId: bigint;
    setReplyTo: Dispatch<SetStateAction<bigint | null>>;
    conversationId: string;
    handleDelete: (messageId: bigint) => void;
    scrollToBottom: (smooth?: boolean, force?: boolean, isImage?: boolean, imageHeight?: number) => void;
    initialLoad: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    onImageLoad?: () => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content ?? "");
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    if (!message.sender) return;

    const isOwner = message.sender.username === currentUsername;
    const isConsecutive = isConsecutiveMessage(prevMessage, message);

    const hasReacted = (emoji: string) => {
        return message.message_reactions?.some((r) => r.emoji === emoji && r.profile_id === currentProfileId);
    };

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 300);
    };

    return (
        <div
            className={`relative max-w-9/10 ${isOwner ? "ml-auto" : ""} ${isConsecutive ? "" : " mt-5"}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <MessageHeader
                createdAt={message.created_at}
                editedAt={message.edited_at}
                username={message.sender.username}
                avatar={message.sender.avatar}
                isConsecutive={isConsecutive}
                isHovered={isHovered}
                isPopoverOpen={isPopoverOpen}
                isOwner={message.sender?.id === currentProfileId}
                isEditing={isEditing}
                onDelete={() => handleDelete(message.id)}
                onEdit={() => {
                    setIsEditing(true);
                    setEditContent(message.content ?? "");
                }}
                onCancelEdit={() => setIsEditing(false)}
                onReply={() => setReplyTo(message.id)}
                onReactionSelect={async (emoji: string) =>
                    await addReaction(conversationId, message.id, currentProfileId, emoji)
                }
                onPopoverOpenChange={setIsPopoverOpen}
            />

            <MessageBubble
                message={message}
                isOwner={isOwner}
                isEditing={isEditing}
                editContent={editContent}
                setEditContent={setEditContent}
                onSubmitEdit={async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
                    e?.preventDefault();
                    await editMessage(message.id, editContent);
                    setIsEditing(false);
                }}
                isConsecutive={isConsecutive}
                scrollToBottom={scrollToBottom}
                initialLoad={initialLoad}
                containerRef={containerRef}
                setEditingMessageId={() => setIsEditing(false)}
                onImageLoad={onImageLoad}
            />

            {message.message_reactions && message.message_reactions.length > 0 && (
                <ReactionBar
                    reactionData={message.message_reactions}
                    onToggle={(emoji) => {
                        const userReaction = message.message_reactions?.find(
                            (r) => r.emoji === emoji && r.profile_id === currentProfileId
                        );
                        return hasReacted(emoji)
                            ? userReaction && removeReaction(conversationId, message.id, currentProfileId, emoji)
                            : addReaction(conversationId, message.id, currentProfileId, emoji);
                    }}
                    isOwner={isOwner}
                    currentProfileId={currentProfileId}
                />
            )}
        </div>
    );
}
