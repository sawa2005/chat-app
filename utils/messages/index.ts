import { Message } from "@/lib/types";
import emojiRegex from "emoji-regex";

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
