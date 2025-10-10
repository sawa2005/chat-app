import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import Image from "next/image";
import { Skeleton } from "./ui/skeleton";

export default function AvatarPreview({ size, src, username }: { size: number; src: string | null; username: string }) {
    const [displaySrc, setDisplaySrc] = useState<string | null | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const supabase = createClient();

        (async () => {
            setLoading(true); // start loading whenever src changes

            // 1. No src at all → no image
            if (!src) {
                if (!cancelled) {
                    setDisplaySrc(null);
                    setLoading(false);
                }
                return;
            }

            // 3. Otherwise, treat as Supabase storage path
            try {
                const { data } = supabase.storage.from("avatars").getPublicUrl(src);
                const publicUrl = data?.publicUrl;

                if (!publicUrl) {
                    if (!cancelled) {
                        setDisplaySrc(null);
                        setLoading(false);
                    }
                    return;
                }

                // Check if actually accessible
                const res = await fetch(publicUrl, { method: "HEAD" });

                if (!cancelled) {
                    if (res.ok) {
                        setDisplaySrc(publicUrl);
                    } else {
                        setDisplaySrc(null);
                    }
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setDisplaySrc(null);
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [src, username]);

    const fallback = `https://api.dicebear.com/9.x/identicon/jpg?seed=${encodeURIComponent(username)}`;
    const imgSrc = displaySrc ?? fallback;

    return (
        <div className="min-w-[100px] relative">
            {loading && <Skeleton className={`absolute z-100 rounded-full`} style={{ width: size, height: size }} />}
            <Image
                src={imgSrc}
                alt={`${username} avatar`}
                title={username}
                width={size}
                height={size}
                className={`${
                    loading ? "opacity-0" : "opacity-100"
                } transition-all ease-in-out duration-1000 rounded-full object-cover`}
                style={{ width: size, height: size }}
                onLoad={() => {
                    if (displaySrc !== undefined) setLoading(false);
                }}
            />
        </div>
    );
}
