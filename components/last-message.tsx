"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Image as ImageIcon } from "lucide-react";
import { isOldMsg } from "@/utils";

const supabase = createClient();

type MessagePreview = {
    content: string | null;
    created_at: string;
    sender_name: string | null;
    image_url: string | null;
    type: string | null;
};

export default function LastMessage({
    conversationId,
    initialMessage,
}: {
    conversationId: string;
    initialMessage: MessagePreview | null;
}) {
    const [lastMessage, setLastMessage] = useState<MessagePreview | null>(initialMessage);

    useEffect(() => {
        const channel = supabase
            .channel(`conversation-${conversationId}`)
            .on("broadcast", { event: "message" }, ({ payload }) => {
                setLastMessage({
                    content: payload.content ?? "",
                    created_at: isOldMsg(new Date(payload.created_at))
                        ? payload.created_at
                        : new Date(payload.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                          }),
                    sender_name: payload.sender?.username ?? null,
                    image_url: payload.image_url ?? null,
                    type: payload.type ?? "message",
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    if (!lastMessage) {
        return <p className="text-sm text-muted-foreground font-mono">No messages yet.</p>;
    }

    return lastMessage && lastMessage.type === "message" ? (
        <div className="flex justify-between w-full max-w-full">
            <div className="flex just w-full max-w-[70%] items-center gap-1">
                <p className="text-sm text-muted-foreground truncate max-w-[95%] overflow-hidden">
                    <span className="font-medium">{lastMessage.sender_name}:</span> {lastMessage.content}
                </p>
                {lastMessage.image_url && <ImageIcon className="text-muted-foreground" size={15} />}
            </div>
            <p className="text-sm text-muted-foreground font-mono">{lastMessage.created_at}</p>
        </div>
    ) : (
        lastMessage && lastMessage.type === "info" && (
            <div className="flex justify-between w-full max-w-full">
                <div className="flex just w-full max-w-[70%] items-center gap-1">
                    <p className="text-sm text-muted-foreground truncate max-w-[95%] overflow-hidden">
                        {lastMessage.content}
                    </p>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{lastMessage.created_at}</p>
            </div>
        )
    );
}
