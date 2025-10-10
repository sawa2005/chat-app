import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import Image from "next/image";
import { Skeleton } from "./ui/skeleton";

export default function AvatarPreview({ size, src, username }: { size: number; src: string | null; username: string }) {
    const [displaySrc, setDisplaySrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(true); // whether we’re still deciding avatar vs fallback

    useEffect(() => {
        const supabase = createClient();
        const isBlobOrData = (s: string) => /^blob:|^data:/i.test(s);
        const isHttp = (s: string) => /^https?:\/\//i.test(s);

        let active = true;
        setChecking(true);
        setLoading(true);

        (async () => {
            if (!src) {
                if (active) setDisplaySrc(null);
                setChecking(false);
                return;
            }

            // blob/data/http → immediate preview (skip supabase check)
            if (isBlobOrData(src) || isHttp(src)) {
                if (active) setDisplaySrc(src);
                setChecking(false);
                return;
            }

            // otherwise, check Supabase storage path
            const { data } = supabase.storage.from("avatars").getPublicUrl(src);
            const publicUrl = data?.publicUrl;
            if (!publicUrl) {
                if (active) setDisplaySrc(null);
                setChecking(false);
                return;
            }

            try {
                const res = await fetch(publicUrl, { method: "HEAD" });
                if (active) setDisplaySrc(res.ok ? publicUrl : null);
            } catch {
                if (active) setDisplaySrc(null);
            } finally {
                setChecking(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [src, username]);

    const fallback = `https://api.dicebear.com/9.x/identicon/jpg?seed=${encodeURIComponent(username)}`;
    const imgSrc = displaySrc ?? (!checking ? fallback : null);

    return (
        <div
            style={{ minWidth: size, minHeight: size, position: "relative" }}
            className="flex items-center justify-center"
        >
            {(!imgSrc || loading) && (
                <Skeleton className="absolute inset-0 rounded-full" style={{ width: size, height: size }} />
            )}
            {imgSrc && (
                <Image
                    src={imgSrc}
                    alt={`${username} avatar`}
                    width={size}
                    height={size}
                    className={`rounded-full object-cover transition-opacity duration-300 ${
                        loading ? "opacity-0" : "opacity-100"
                    }`}
                    style={{ width: size, height: size }}
                    onLoad={() => setLoading(false)}
                    onError={() => setLoading(false)}
                />
            )}
        </div>
    );
}
