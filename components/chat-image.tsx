import Image from "next/image";
import { useState } from "react";

interface ChatImageProps {
    src: string;
    alt: string;
}

export default function ChatImage({ src, alt }: ChatImageProps) {
    const [width, setWidth] = useState<number>();
    const [height, setHeight] = useState<number>();

    return (
        <a href={src} target="_blank" className="cursor-pointer">
            <Image
                src={src}
                alt={alt}
                width={width || 0}
                height={height || 0}
                className="rounded-b-xl"
                unoptimized
                onLoad={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    setWidth(target.naturalWidth);
                    setHeight(target.naturalHeight);
                }}
            />
        </a>
    );
}
