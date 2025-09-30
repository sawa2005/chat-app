"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "./ui/skeleton";

interface ChatImageProps {
    src: string;
    alt: string;
    onLoadingComplete?: (e: HTMLImageElement) => void;
}

export default function ChatImage({ src, alt, onLoadingComplete }: ChatImageProps) {
    const [width, setWidth] = useState<number>();
    const [height, setHeight] = useState<number>();
    const [loaded, setLoaded] = useState(false);

    const ratio = width && height ? width / height : undefined;

    return (
        <a href={src} target="_blank" className="cursor-pointer block">
            <div style={{ aspectRatio: ratio ?? "1 / 1" }} className="relative w-full overflow-hidden rounded-xl">
                {!loaded && <Skeleton className="absolute inset-0 w-full h-full" />}
                <Image
                    src={src}
                    alt={alt}
                    width={width || 1}
                    height={height || 1}
                    className={`${
                        loaded ? "opacity-100" : "opacity-0"
                    } rounded-xl object-cover transition-opacity duration-300`}
                    unoptimized
                    onLoad={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        setWidth(target.naturalWidth);
                        setHeight(target.naturalHeight);
                        setLoaded(true);
                    }}
                    onLoadingComplete={onLoadingComplete}
                />
            </div>
        </a>
    );
}
