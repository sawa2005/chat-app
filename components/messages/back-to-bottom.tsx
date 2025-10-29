import { ChevronDown } from "lucide-react";

export function BackToBottom({ onClick, hasNewMessage }: { onClick: () => void; hasNewMessage: boolean }) {
    return (
        <button
            className="font-mono w-full bg-accent text-xs p-2 pr-5 rounded-b-lg mt-2 cursor-pointer flex gap-2 items-center justify-end shadow-lg/10"
            onClick={onClick}
        >
            {hasNewMessage && <span className="w-2 h-2 bg-accent-foreground rounded-full"></span>}
            <ChevronDown size={15} />
            {hasNewMessage ? "new messages" : "back to bottom"}
        </button>
    );
}
