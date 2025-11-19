import emojiRegex from "emoji-regex";
import { ReactNode } from "react";

function linkifyMessage(text: string) {
    // Regex to match URLs (simple version)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, idx) => {
        if (urlRegex.test(part)) {
            return (
                <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {part}
                </a>
            );
        } else {
            return part;
        }
    });
}

export function renderMessageContent(text: string) {
    const regex = emojiRegex();
    const result: ReactNode[] = [];
    let lastIndex = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
        // Push text before the emoji
        if (match.index > lastIndex) {
            result.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
        }

        const emoji = match[0];

        // Wrap the emoji in a span with emoji-specific font
        result.push(
            <span key={match.index} className="emoji">
                {emoji}
            </span>
        );

        lastIndex = regex.lastIndex;
    }

    // Push remaining text
    if (lastIndex < text.length) {
        result.push(<span key={lastIndex}>{linkifyMessage(text.slice(lastIndex))}</span>);
    }

    return result;
}
