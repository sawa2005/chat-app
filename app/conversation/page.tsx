import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

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
        <div className="py-6 max-w-2xl">
            <h1 className="text-xl font-bold mb-4">Your Conversations</h1>

            {conversations.length === 0 && <p className="text-muted-foreground">No conversations yet.</p>}

            <ul className="space-y-4 w-100%">
                {conversations.map((c) => {
                    const lastMsg = c.messages[0];
                    return (
                        <li key={c.id} className="border rounded-lg p-4 shadow-sm">
                            <Link href={`/conversation/${c.id}`} className="block">
                                <h2 className="font-semibold text-lg">
                                    {c.name ?? c.conversation_members.map((m) => m.profiles?.username).join(", ")}
                                </h2>
                                {lastMsg && (
                                    <p className="text-sm text-muted-foreground w-full max-w-full truncate">
                                        <span className="font-medium">{lastMsg.sender.username}:</span>{" "}
                                        {lastMsg.content}
                                    </p>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
