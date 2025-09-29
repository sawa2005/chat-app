"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

const supabase = createClient();

export function UnreadBadge({
    initialCounts,
    currentProfileId,
    conversationId,
    memberCount,
}: {
    initialCounts: number;
    currentProfileId: bigint;
    conversationId: string;
    memberCount: number;
}) {
    const [unreadCount, setUnreadCount] = useState(initialCounts);

    useEffect(() => {
        const channel = supabase
            .channel(`conversation-${conversationId}`)
            .on("broadcast", { event: "message" }, ({ payload }) => {
                if (payload.sender?.id !== currentProfileId.toString()) {
                    setUnreadCount((prev) => prev + 1);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentProfileId, conversationId]);

    return unreadCount > 0 ? (
        <div className="flex items-center bg-red-500 text-white rounded-full px-2 py-0.5 mb-1 text-xs font-semibold">
            {unreadCount}
        </div>
    ) : (
        <p className="text-sm text-muted-foreground">{memberCount} members</p>
    );
}
