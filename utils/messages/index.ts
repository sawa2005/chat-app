import { Message } from "@/lib/types";
import emojiRegex from "emoji-regex";
import { cn } from "..";

export function isConsecutiveMessage(prev: Message | undefined, current: Message, cutoffMinutes = 5) {
    if (!prev) return false;
    if (prev.type === "info" || current.type === "info") return false;
    if (!prev.sender) return false;
    if (prev.sender.id !== current.sender?.id) return false;
    if (prev.messages?.id !== current.messages?.id) return false;

    const diffMs = current.created_at.getTime() - prev.created_at.getTime();
    return diffMs < cutoffMinutes * 60 * 1000;
}

// Returns true if the string contains only emojis
export function isEmojiOnly(message: string) {
    const regex = emojiRegex();
    const stripped = message.replace(/\s/g, "");
    const matched = stripped.match(regex);
    return matched !== null && matched.join("") === stripped;
}

export function isOldMessage(msgDate: Date) {
    const currentDate = new Date();

    const milliDiff = currentDate.getTime() - msgDate.getTime();
    const hoursDiff = Math.floor(milliDiff / (1000 * 60 * 60));

    if (hoursDiff >= 24) {
        return true;
    } else {
        return false;
    }
}

export function getMessageHeaderClasses(isOwner: boolean, isConsecutive: boolean) {
    const baseClasses = "justify-end text-xs mb-1 flex items-center gap-2";
    const ownerClasses = isOwner ? "text-right" : "flex-row-reverse";
    const consecutiveClasses = isConsecutive ? "mt-0" : "mt-5";

    return cn(baseClasses, ownerClasses, consecutiveClasses);
}
