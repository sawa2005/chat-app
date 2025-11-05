import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch } from "./ui/emoji-picker";
import { SmilePlus } from "lucide-react";
import { useState } from "react";

export function ReactionButton({
    onEmojiSelect,
    onOpenChange,
}: {
    onEmojiSelect: (emoji: string) => void;
    onOpenChange?: (open: boolean) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (emojiObj: { emoji: string }) => {
        onEmojiSelect(emojiObj.emoji);
        setIsOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (onOpenChange) {
            onOpenChange(open);
        }
    };

    return (
        <Popover onOpenChange={handleOpenChange} open={isOpen}>
            <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-primary cursor-pointer" title="React">
                    <SmilePlus size={15} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0 m-5 will-change-transform will-change-opacity rounded-lg!" forceMount>
                <EmojiPicker className="emoji-picker h-[342px] font-sans rounded-lg!" onEmojiSelect={handleSelect}>
                    <EmojiPickerSearch />
                    <EmojiPickerContent />
                    <EmojiPickerFooter className="font-mono" />
                </EmojiPicker>
            </PopoverContent>
        </Popover>
    );
}
