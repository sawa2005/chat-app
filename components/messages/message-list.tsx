import { Message } from "@/lib/types";
import { MessageItem } from "./message-item";
import React, { RefObject, Dispatch, SetStateAction, useEffect } from "react";
interface MessageListProps {
    messages: Message[];
    currentUsername: string;
    currentProfileId: bigint;
    editingMessageId: string | null;
    editContent: string;
    setEditContent: Dispatch<SetStateAction<string>>;
    setEditingMessageId: Dispatch<SetStateAction<string | null>>;
    setReplyTo: Dispatch<SetStateAction<bigint | null>>;
    conversationId: string;
    handleDelete: (id: bigint) => void;
    scrollToBottom: (smooth?: boolean, force?: boolean, isImage?: boolean, imageHeight?: number) => void;
    firstUnreadIndex: number | null;
    containerRef: RefObject<HTMLDivElement | null>;
}

export function MessageList({ messages, firstUnreadIndex, ...rest }: MessageListProps) {
    useEffect(() => {
        console.log("First unread index:", firstUnreadIndex);
    }, [firstUnreadIndex]);

    if (messages.length === 0) {
        return <div className="text-center text-sm text-gray-500 my-10">No messages yet. Start the conversation!</div>;
    }

    const newMessageComponent = (
        <li className="relative my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-2 text-xs text-gray-500 font-mono">New Messages</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </li>
    );

    return (
        <ul className="list-none">
            {messages.map((m, i) => {
                if (m.type === "info") {
                    return (
                        <React.Fragment key={m.id}>
                            {i === firstUnreadIndex && newMessageComponent}
                            <li className="text-xs font-mono text-muted-foreground m-auto block w-fit my-10 text-center">
                                {m.content}
                            </li>
                        </React.Fragment>
                    );
                }
                if (m.type === "message" && !m.deleted) {
                    return (
                        <React.Fragment key={m.id}>
                            {i === firstUnreadIndex && newMessageComponent}
                            <MessageItem message={m} prevMessage={messages[i - 1]} {...rest} />
                        </React.Fragment>
                    );
                }
                return null;
            })}
        </ul>
    );
}
