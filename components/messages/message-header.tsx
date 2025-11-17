import { X, Trash, Pen, Reply } from "lucide-react";
import { ReactionButton } from "../reaction-button";
import { getMessageHeaderClasses, isOldMessage } from "@/utils/messages";
import Avatar from "../avatar";
import { cn } from "@/utils";

export function MessageHeader({
    createdAt,
    editedAt,
    username,
    avatar,
    isConsecutive,
    isOwner,
    isEditing,
    isHovered,
    isPopoverOpen,
    onDelete,
    onEdit,
    onCancelEdit,
    onReply,
    onReactionSelect,
    onPopoverOpenChange,
}: {
    createdAt: Date;
    editedAt: Date | null;
    username: string;
    avatar: string | null;
    isConsecutive: boolean;
    isOwner: boolean;
    isEditing: boolean;
    isHovered: boolean;
    isPopoverOpen: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onCancelEdit: () => void;
    onReply: () => void;
    onReactionSelect: (emoji: string) => void;
    onPopoverOpenChange: (open: boolean) => void;
}) {
    const showActions = isHovered || isPopoverOpen;
    const showInfo = !isConsecutive || isHovered || isPopoverOpen;

    // Define header classes based on message ownership and consecutiveness
    const headerClasses = getMessageHeaderClasses(isOwner, isConsecutive);

    if (isEditing) {
        return (
            <div className={cn(headerClasses)}>
                <button
                    onClick={onCancelEdit}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                    title="Cancel Edit"
                >
                    <X size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className={cn(headerClasses, "overflow-hidden")}>
            <div
                className={cn(
                    "flex gap-1 transition-all duration-300",
                    showActions ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                {isOwner && (
                    <>
                        <button
                            onClick={onDelete}
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete"
                        >
                            <Trash size={15} />
                        </button>
                        <button
                            onClick={onEdit}
                            className="text-muted-foreground hover:text-primary cursor-pointer"
                            title="Edit"
                        >
                            <Pen size={15} />
                        </button>
                    </>
                )}
                <ReactionButton onOpenChange={onPopoverOpenChange} onEmojiSelect={onReactionSelect} />
                <button
                    onClick={onReply}
                    className="text-muted-foreground hover:text-primary cursor-pointer"
                    title="Reply"
                >
                    <Reply size={15} />
                </button>
            </div>
            <div
                className={cn(
                    isOwner ? "text-right" : "flex-row-reverse",
                    "flex gap-1 transition-all duration-300",
                    showInfo ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                {editedAt && "(edited)"}
                {!isConsecutive && (
                    <div className={`flex gap-2 items-center ${!isOwner && "flex-row-reverse"}`}>
                        <div>
                            {isOldMessage(createdAt)
                                ? createdAt.toISOString().slice(0, 10)
                                : createdAt.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  })}
                        </div>
                        <div>{isOwner ? "You" : username}</div>
                        <Avatar size={15} avatarUrl={avatar} username={username} />
                    </div>
                )}
                {isConsecutive && (
                    <div>
                        {isOldMessage(createdAt)
                            ? createdAt.toISOString().slice(0, 10)
                            : createdAt.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })}
                    </div>
                )}
            </div>
        </div>
    );
}
