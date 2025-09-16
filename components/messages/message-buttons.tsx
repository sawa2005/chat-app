import { X, Trash, Pen, Reply } from "lucide-react";

export function MessageActions({
    isOwner,
    isEditing,
    onDelete,
    onEdit,
    onCancelEdit,
    onReply,
}: {
    isOwner: boolean;
    isEditing: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onCancelEdit: () => void;
    onReply: () => void;
}) {
    if (isEditing) {
        return (
            <button
                onClick={onCancelEdit}
                className="opacity-0 group-hover:opacity-100 mr-2 text-muted-foreground hover:text-red-800 cursor-pointer"
                title="Cancel Edit"
            >
                <X size={20} />
            </button>
        );
    }

    return (
        <div className="flex gap-1">
            {isOwner && (
                <>
                    <button
                        onClick={onDelete}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary cursor-pointer"
                        title="Delete"
                    >
                        <Trash size={15} />
                    </button>
                    <button
                        onClick={onEdit}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary cursor-pointer"
                        title="Edit"
                    >
                        <Pen size={15} />
                    </button>
                </>
            )}
            <button
                onClick={onReply}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary cursor-pointer"
                title="Reply"
            >
                <Reply size={15} />
            </button>
        </div>
    );
}
