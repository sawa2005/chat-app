import { useCallback, useRef } from "react";

export function useChatScroll() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((smooth = true, threshold = 500, force = false) => {
        const container = containerRef.current;
        if (!container) return;

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        // Only scroll if we're within the threshold
        if (distanceFromBottom <= threshold || force === true) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: smooth ? "smooth" : "auto",
            });
        }
    }, []);

    return { containerRef, scrollToBottom };
}
