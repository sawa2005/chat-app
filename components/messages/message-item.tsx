import { Message } from "@/lib/types";
import { RefObject, Dispatch, SetStateAction, useState } from "react";
import { getMessageHeaderClasses, isConsecutiveMessage, isOldMessage } from "@/utils/messages";
import { MessageActions } from "./message-buttons";
import { MessageBubble } from "./message-bubble";
import { editMessage, addReaction, removeReaction } from "@/app/conversation/create/actions";
import Avatar from "../avatar";
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

    if (!message.sender) return;

    const isOwner = message.sender.username === currentUsername;
    const isConsecutive = isConsecutiveMessage(prevMessage, message);

    const showActions = isHovered || isPopoverOpen;

    // Define header classes based on message ownership and consecutiveness
    const headerClasses = getMessageHeaderClasses(isOwner, isConsecutive, showActions);

    const hasReacted = (emoji: string) => {
        return message.message_reactions?.some((r) => r.emoji === emoji && r.profile_id === currentProfileId);
    };

    return (
        <li
            className={`relative max-w-9/10 ${isOwner ? "ml-auto" : ""} ${isConsecutive ? "" : " mt-5"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`${headerClasses}`}>
                <MessageActions
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
                {message.edited_at && "(edited)"}
                {!isConsecutive && (
                    <div className={`flex gap-2 items-center ${!isOwner && "flex-row-reverse"}`}>
                        <div>
                            {isOldMessage(message.created_at)
                                ? new Date(message.created_at).toISOString().slice(0, 10)
                                : message.created_at.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })}
                        </div>
                        <div>{isOwner ? "You" : message.sender?.username}</div>
                        <Avatar size={15} avatarUrl={message.sender?.avatar} username={message.sender?.username} />
                    </div>
                )}
                {isConsecutive && (
                    <div>
                        {isOldMessage(message.created_at)
                            ? new Date(message.created_at).toISOString().slice(0, 10)
                            : message.created_at.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })}
                    </div>
                )}
            </div>

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
        </li>
    );
}
