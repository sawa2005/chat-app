import { useCallback, useRef } from "react";

export function useChatScroll() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((smooth = true) => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
        });
    }, []);

    return { containerRef, scrollToBottom };
}
