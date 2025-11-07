"use client";

import Image from "next/image";
import { useState, memo, useEffect } from "react";
import { Skeleton } from "./ui/skeleton";

interface ChatImageProps {
    src: string;
    alt: string;
    width: number | null;
    height: number | null;
    onLoadingComplete?: (e: HTMLImageElement) => void;
    editing?: boolean;
}

// TODO: fix placeholders so they are the same size as the actual image to prevent layout shift

const ChatImage = memo(function ChatImage({ src, width, height, alt, onLoadingComplete, editing }: ChatImageProps) {
    // TODO: wipe database and remove fallback sizing logic
    const [fallbackWidth, setFallbackWidth] = useState<number>();
    const [fallbackHeight, setFallbackHeight] = useState<number>();
    const [ratio, setRatio] = useState<number | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (width && height) {
            setRatio(width / height);
        } else if (fallbackWidth && fallbackHeight) {
            setRatio(fallbackWidth / fallbackHeight);
        }
    }, [width, height, fallbackWidth, fallbackHeight]);

    return (
        <a href={src} target="_blank" className="cursor-pointer block">
            <div
                style={{ aspectRatio: ratio ?? "1 / 1" }}
                className={`${editing ? "rounded-b-xl" : "rounded-xl"} relative w-full overflow-hidden`}
            >
                {!loaded && <Skeleton className="absolute inset-0 w-full h-full" />}
                <Image
                    src={src}
                    alt={alt}
                    width={width || fallbackWidth || 250}
                    height={height || fallbackHeight || 250}
                    className={`${loaded ? "opacity-100" : "opacity-0"} object-cover transition-opacity duration-300`}
                    unoptimized
                    onLoad={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        setFallbackWidth(target.naturalWidth);
                        setFallbackHeight(target.naturalHeight);
                        setLoaded(true);

                        if (onLoadingComplete) {
                            onLoadingComplete(target);
                        }
                    }}
                />
            </div>
        </a>
    );
});

export default ChatImage;
