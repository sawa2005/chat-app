import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";

export default async function ConversationsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-6 text-red-500">You must be signed in to see your conversations.</div>;
    }

    const profile = await prisma.profiles.findUnique({
        where: { user_id: user.id },
    });

    if (!profile) {
        return <div className="p-6 text-red-500">Profile not found.</div>;
    }

    const conversations = await prisma.conversations.findMany({
        where: {
            conversation_members: {
                some: {
                    profile_id: profile.id,
                },
            },
        },
        include: {
            conversation_members: {
                include: { profiles: true },
            },
            messages: {
                take: 1,
                orderBy: { created_at: "desc" },
                include: { sender: true },
            },
        },
        orderBy: { created_at: "desc" },
    });

    return (
        <div className="py-6 max-w-2xl mt-3">
            <h2 className="text-2xl mb-4 font-semibold">Your Conversations</h2>

            {conversations.length === 0 && <p className="text-muted-foreground">No conversations yet.</p>}

            <ul className="space-y-4 w-100%">
                {conversations.map((c) => {
                    const lastMsg = c.messages[0];
                    console.log("lastMsg:", lastMsg);
                    return (
                        <li key={c.id} className="border rounded-lg p-4 shadow-sm">
                            <Link href={`/conversation/${c.id}`} className="block">
                                <div className="flex justify-between">
                                    <h3 className="font-normal text-lg">
                                        {c.name ?? c.conversation_members.map((m) => m.profiles?.username).join(", ")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {c.conversation_members.length} members
                                    </p>
                                </div>

                                {lastMsg && lastMsg.type === "message" && (
                                    <div className="flex justify-between w-full max-w-full">
                                        <div className="flex just w-full max-w-[70%] items-center gap-1">
                                            <p className="text-sm text-muted-foreground truncate max-w-[95%] overflow-hidden">
                                                <span className="font-medium">{lastMsg.sender?.username}:</span>{" "}
                                                {lastMsg.content}
                                            </p>
                                            {lastMsg.image_url && (
                                                <ImageIcon className="text-muted-foreground" size={15} />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {/* TODO: time when today, date when older */}
                                            {lastMsg.created_at.toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {lastMsg && lastMsg.type === "info" && (
                                    <div className="flex justify-between w-full max-w-full">
                                        <div className="flex just w-full max-w-[70%] items-center gap-1">
                                            <p className="text-sm text-muted-foreground truncate max-w-[95%] overflow-hidden">
                                                {lastMsg.content}
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {/* TODO: time when today, date when older */}
                                            {lastMsg.created_at.toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
