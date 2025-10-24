import { useCallback, useRef, useState, useEffect } from "react";

export function useChatScroll() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(
        (
            smooth = true,
            force = false,
            isImage = false,
            imageHeight?: number,
            setProgrammaticScroll?: (value: boolean) => void
        ) => {
            const container = containerRef.current;
            if (!container) return;

            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

            if (isImage && imageHeight) {
                // Scroll if image is larger than remaining scrollable height OR is forced
                if (distanceFromBottom <= imageHeight || force) {
                    setProgrammaticScroll?.(true);
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: smooth ? "smooth" : "auto",
                    });
                    // Reset flag after a short delay to allow scroll event to be processed
                    setTimeout(() => setProgrammaticScroll?.(false), 300);
                }
            } else {
                // Scroll if within pixel threshold for normal messages
                const threshold = 200;
                if (distanceFromBottom <= threshold || force) {
                    setProgrammaticScroll?.(true);
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: smooth ? "smooth" : "auto",
                    });
                    // Reset flag after a short delay to allow scroll event to be processed
                    setTimeout(() => setProgrammaticScroll?.(false), 300);
                }
            }
        },
        []
    );

    return { containerRef, scrollToBottom };
}

export const useIsScrollOnTop = (
    ref: React.RefObject<HTMLDivElement | null>,
    loading: boolean
): boolean => {
    const [isAtTop, setIsAtTop] = useState(false);

    useEffect(() => {
        const target = ref?.current || window;
        const handleScroll = () => {
            if (ref?.current && !loading) {
                const atTop = ref.current.scrollTop === 0;
                setIsAtTop(atTop);
            } else {
                return;
            }
        };
        handleScroll();
        target.addEventListener("scroll", handleScroll);
        return () => {
            target.removeEventListener("scroll", handleScroll);
        };
    }, [ref, loading]);

    return isAtTop;
};
