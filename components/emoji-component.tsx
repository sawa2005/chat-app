"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from "@/components/ui/emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Smile } from "lucide-react";

interface EmojiComponentProps {
    onEmojiSelect: (emoji: string) => void;
    closeOnSelect?: boolean;
}

export default function EmojiComponent({ onEmojiSelect, closeOnSelect = true }: EmojiComponentProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [shiftHeld, setShiftHeld] = React.useState(false);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => e.shiftKey && setShiftHeld(true);
        const handleKeyUp = (e: KeyboardEvent) => !e.shiftKey && setShiftHeld(false);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const handleSelect = (emojiObj: { emoji: string; label: string }) => {
        onEmojiSelect(emojiObj.emoji);

        if (closeOnSelect && !shiftHeld) {
            setIsOpen(false);
        }
    };

    return (
        <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
                <button className="absolute right-11 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary cursor-pointer">
                    <Smile size={20} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0 will-change-transform will-change-opacity" forceMount>
                <EmojiPicker className="h-[342px]" onEmojiSelect={handleSelect}>
                    <EmojiPickerSearch />
                    <EmojiPickerContent />
                    <EmojiPickerFooter />
                </EmojiPicker>
            </PopoverContent>
        </Popover>
    );
}
