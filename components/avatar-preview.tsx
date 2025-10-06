import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";

export default function AvatarPreview({ size, src, username }: { size: number; src: string | null; username: string }) {
    const [displaySrc, setDisplaySrc] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const supabase = createClient();

        const isBlobOrData = (s: string) => /^blob:|^data:/i.test(s);
        const isHttp = (s: string) => /^https?:\/\//i.test(s);

        (async () => {
            if (!src) {
                if (!cancelled) setDisplaySrc(null); // <- skip if effect is stale/unmounted
                return;
            }

            // blob/data or full http(s) URL -> use directly
            if (isBlobOrData(src) || isHttp(src)) {
                if (!cancelled) setDisplaySrc(src);
                return;
            }

            // treat as storage path: use Supabase helper to build public url then check existence
            try {
                const { data } = supabase.storage.from("avatars").getPublicUrl(src);
                const publicUrl = data?.publicUrl;
                if (!publicUrl) {
                    if (!cancelled) setDisplaySrc(null);
                    return;
                }

                // check that the uploaded object is actually accessible before using it
                const res = await fetch(publicUrl, { method: "HEAD" });
                if (!cancelled && res.ok) {
                    setDisplaySrc(publicUrl);
                } else {
                    if (!cancelled) setDisplaySrc(null);
                }
            } catch {
                if (!cancelled) setDisplaySrc(null);
            }
        })();

        return () => {
            cancelled = true; // <- marks the async result as stale
        };
    }, [src, username]);

    const fallback = `https://api.dicebear.com/9.x/identicon/jpg?seed=${encodeURIComponent(username)}`;
    const imgSrc = displaySrc || fallback;

    return (
        <img
            src={imgSrc}
            alt={`${username} avatar`}
            title={username}
            width={size}
            height={size}
            className="rounded-full object-cover"
            style={{ width: size, height: size }}
        />
    );
}
