import { useCallback, useRef } from "react";

export function useChatScroll() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((smooth = true, force = false, isImage = false, imageHeight?: number) => {
        const container = containerRef.current;
        if (!container) return;

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        if (isImage && imageHeight) {
            // Scroll if image is larger than remaining scrollable height OR is forced
            if (distanceFromBottom <= imageHeight || force) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: smooth ? "smooth" : "auto",
                });
            }
        } else {
            // Scroll if within pixel threshold for normal messages
            const threshold = 200;
            if (distanceFromBottom <= threshold || force) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: smooth ? "smooth" : "auto",
                });
            }
        }
    }, []);

    return { containerRef, scrollToBottom };
}
