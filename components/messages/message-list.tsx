import { Message } from "@/lib/types";
import { MessageItem } from "./message-item";
import { Dispatch, SetStateAction } from "react";

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
    scrollToBottom: (smooth?: boolean) => void;
}

export function MessageList({ messages, ...rest }: MessageListProps) {
    return (
        <ul className="list-none">
            {messages.map((m, i) => {
                if (m.type === "info") {
                    return (
                        <li
                            key={m.id}
                            className="text-xs font-mono text-muted-foreground m-auto block w-fit my-10 text-center"
                        >
                            {m.content}
                        </li>
                    );
                }
                if (m.type === "message" && !m.deleted) {
                    return <MessageItem key={m.id} message={m} prevMessage={messages[i - 1]} {...rest} />;
                }
                return null;
            })}
        </ul>
    );
}
