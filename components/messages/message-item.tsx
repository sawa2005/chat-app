import { Message } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import { isConsecutiveMessage } from "./messages";
import { MessageActions } from "./message-buttons";
import { MessageBubble } from "./message-bubble";
import { editMessage, addReaction, removeReaction } from "@/app/conversation/create/actions";
import Avatar from "../avatar";
import { getAvatarUrlById } from "@/app/login/actions";
import { ReactionBar } from "../reaction-bar";

export function MessageItem({
    message,
    prevMessage,
    currentUsername,
    currentProfileId,
    editingMessageId,
    editContent,
    setEditContent,
    setEditingMessageId,
    handleDelete,
    setReplyTo,
    scrollToBottom,
}: {
    message: Message;
    prevMessage: Message;
    currentUsername: string;
    currentProfileId: bigint;
    editingMessageId: string | null;
    setEditingMessageId: Dispatch<SetStateAction<string | null>>;
    editContent: string;
    setEditContent: Dispatch<SetStateAction<string>>;
    setReplyTo: Dispatch<SetStateAction<bigint | null>>;
    handleDelete: (messageId: bigint) => void;
    scrollToBottom: (smooth?: boolean) => void;
}) {
    if (!message.sender) return;

    const isOwner = message.sender.username === currentUsername;
    const isEditing = editingMessageId === message.id.toString();
    const isConsecutive = isConsecutiveMessage(prevMessage, message);

    const headerClasses = !isConsecutive
        ? `${isOwner ? "text-right" : "flex-row-reverse"} justify-end text-xs mb-1 flex items-center gap-2`
        : `${
              isOwner ? "text-right" : "flex-row-reverse justify-end"
          } mt-5 mb-1 text-xs hidden group-hover:flex justify-end items-center gap-2`;

    const msgOld = (msgDate: Date) => {
        const currentDate = new Date();

        const milliDiff = currentDate.getTime() - msgDate.getTime();
        const hoursDiff = Math.floor(milliDiff / (1000 * 60 * 60));

        if (hoursDiff >= 24) {
            return true;
        } else {
            return false;
        }
    };

    const hasReacted = (emoji: string) => {
        return message.message_reactions?.some((r) => r.emoji === emoji && r.profile_id === currentProfileId);
    };

    return (
        <li className={`relative group max-w-9/10 ${isOwner ? "ml-auto" : ""} ${isConsecutive ? "" : " my-5"}`}>
            <div className={headerClasses}>
                <MessageActions
                    isOwner={message.sender?.id === currentProfileId}
                    isEditing={isEditing}
                    onDelete={() => handleDelete(message.id)}
                    onEdit={() => {
                        setEditingMessageId(message.id.toString());
                        setEditContent(message.content);
                    }}
                    onCancelEdit={() => setEditingMessageId(null)}
                    onReply={() => setReplyTo(message.id)}
                    onReactionSelect={async (emoji: string) => await addReaction(message.id, currentProfileId, emoji)}
                />
                {message.edited_at && "(edited)"}
                {!isConsecutive && (
                    <div className={`flex gap-2 items-center ${!isOwner && "flex-row-reverse"}`}>
                        <div>
                            {msgOld(message.created_at)
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
                {isConsecutive &&
                    (msgOld(message.created_at)
                        ? new Date(message.created_at).toISOString().slice(0, 10)
                        : message.created_at.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                          }))}
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
                    setEditingMessageId(null);
                }}
                isConsecutive={isConsecutive}
                scrollToBottom={scrollToBottom}
                setEditingMessageId={setEditingMessageId}
            />

            {message.message_reactions && message.message_reactions.length > 0 && (
                <ReactionBar
                    reactionData={message.message_reactions}
                    onToggle={(emoji) => {
                        const userReaction = message.message_reactions?.find(
                            (r) => r.emoji === emoji && r.profile_id === currentProfileId
                        );
                        return hasReacted(emoji)
                            ? userReaction && removeReaction(userReaction.id)
                            : addReaction(message.id, currentProfileId, emoji);
                    }}
                    isOwner={isOwner}
                    currentProfileId={currentProfileId}
                />
            )}
        </li>
    );
}
