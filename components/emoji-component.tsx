"use client";

import * as React from "react";
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from "@/components/ui/emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmojiComponentProps {
    onEmojiSelect: (emoji: string) => void;
    closeOnSelect?: boolean;
}

export default function EmojiComponent({ onEmojiSelect, closeOnSelect = true }: EmojiComponentProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = (emojiObj: { emoji: string }) => {
        const shiftHeld = window.event instanceof MouseEvent && window.event.shiftKey;

        onEmojiSelect(emojiObj.emoji);

        if (closeOnSelect && !shiftHeld) {
            setIsOpen(false);
        }
    };

    return (
        <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-primary cursor-pointer">
                    <Smile size={20} />
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
