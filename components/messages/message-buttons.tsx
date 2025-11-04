import { X, Trash, Pen, Reply } from "lucide-react";
import { ReactionButton } from "../reaction-button";

export function MessageActions({
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
    if (isEditing) {
        return (
            <button
                onClick={onCancelEdit}
                className="text-muted-foreground hover:text-red-800 cursor-pointer"
                title="Cancel Edit"
            >
                <X size={20} />
            </button>
        );
    }

    return (
        <div className={`${isHovered || isPopoverOpen ? "flex" : "hidden"} gap-1`}>
            {isOwner && (
                <>
                    <button
                        onClick={onDelete}
                        className="text-muted-foreground hover:text-primary cursor-pointer"
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
            <button onClick={onReply} className="text-muted-foreground hover:text-primary cursor-pointer" title="Reply">
                <Reply size={15} />
            </button>
        </div>
    );
}
