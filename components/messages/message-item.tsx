import { Message } from "./messages";
import { Dispatch, SetStateAction } from "react";
import { isConsecutiveMessage } from "./messages";
import { MessageActions } from "./message-buttons";
import { MessageBubble } from "./message-bubble";
import { editMessage } from "@/app/conversation/create/actions";

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
    const isOwner = message.sender?.username === currentUsername;
    const isEditing = editingMessageId === message.id.toString();
    const isConsecutive = isConsecutiveMessage(prevMessage, message);

    const headerClasses = !isConsecutive
        ? `${isOwner ? "text-right justify-end" : "flex-row-reverse justify-end"} text-xs mb-1 flex items-center gap-2`
        : `${isOwner ? "text-right" : ""} text-xs mb-1 hidden group-hover:flex justify-end items-center`;

    return (
        <li
            className={`relative group max-w-9/10 ${isOwner ? "ml-auto" : ""} ${
                isConsecutive ? " mt-[-10px]" : " mt-5"
            }`}
        >
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
                />
                {!isConsecutive && (
                    <>
                        {(isOwner ? "You" : message.sender?.username) +
                            " / " +
                            message.created_at.toLocaleDateString() +
                            " - " +
                            message.created_at.toLocaleTimeString() +
                            (message.edited_at ? " (edited)" : "")}
                    </>
                )}
                {isConsecutive && message.created_at.toLocaleTimeString()}
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
        </li>
    );
}
