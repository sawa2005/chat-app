import { Message } from "./messages";
import { Dispatch, SetStateAction } from "react";
import { ImageIcon, MessageSquareReply } from "lucide-react";
import ChatImage from "../chat-image";

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
}: {
    message: Message;
    isOwner: boolean;
    isEditing: boolean;
    editContent: string;
    setEditContent: Dispatch<SetStateAction<string>>;
    onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    isConsecutive: boolean;
    scrollToBottom: (smooth?: boolean) => void;
    setEditingMessageId: Dispatch<SetStateAction<string | null>>;
}) {
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
                    <div className="flex items-center bg-gray-100 py-1 px-2 rounded-full w-fit">
                        <span className="text-sm font-semibold mr-1">
                            {message.messages.sender?.username || "Unknown"}
                        </span>
                        <span className="text-sm text-gray-600 truncate max-w-[40vw]">
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
                className={`group relative ${
                    !isOwner ? "bg-accent rounded-tl-none" : "rounded-tr-none ml-auto"
                } rounded-xl mb-4 shadow-lg/8 w-fit break-words max-w-[80%]`}
            >
                {message.content && <p className="py-2 px-4">{message.content}</p>}
                {message.image_url && (
                    <ChatImage
                        src={message.image_url}
                        alt="Message attachment"
                        onLoadingComplete={() => scrollToBottom(false)}
                    />
                )}
            </div>
        </>
    );
}
