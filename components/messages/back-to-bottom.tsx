import { ChevronDown } from "lucide-react";

export function BackToBottom({ onClick }: { onClick: () => void }) {
    return (
        <button
            className="font-mono w-full bg-accent text-xs p-2 pr-5 rounded-b-lg mt-2 cursor-pointer flex gap-2 items-center justify-end shadow-lg/10"
            onClick={onClick}
        >
            <ChevronDown size={15} />
            back to bottom
        </button>
    );
}
