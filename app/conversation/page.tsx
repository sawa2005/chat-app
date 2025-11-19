import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/server";
import Link from "next/link";
import { UnreadBadge } from "@/components/unread-badge";
import LastMessage from "@/components/last-message";
import { isOldMessage } from "@/lib/messages";

export default async function ConversationsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-6 text-destructive">You must be signed in to see your conversations.</div>;
    }

    const profile = await prisma.profiles.findUnique({
        where: { user_id: user.id },
    });

    if (!profile) {
        return <div className="p-6 text-destructive">Profile not found.</div>;
    }

    const conversations = (await prisma.conversations.findMany({
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
                where: {
                    deleted: false,
                },
                take: 1,
                orderBy: { created_at: "desc" },
                include: { sender: true },
            },
        },
    })).sort((a, b) => {
        const dateA = a.messages[0]?.created_at ?? a.created_at;
        const dateB = b.messages[0]?.created_at ?? b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return (
        <div className="py-6 max-w-2xl mt-3">
            <h2 className="text-2xl mb-4 font-semibold">Your Conversations</h2>

            {conversations.length === 0 && <p className="text-muted-foreground">No conversations yet.</p>}

            <ul className="space-y-4 w-100%">
                {conversations.map(async (c) => {
                    const lastMsg = c.messages[0];
                    console.log("lastMsg:", lastMsg);
                    let formattedLastMsg;
                    if (lastMsg) {
                        formattedLastMsg = {
                            ...lastMsg,
                            created_at: isOldMessage(new Date(lastMsg.created_at))
                                ? lastMsg.created_at.toLocaleDateString()
                                : new Date(lastMsg.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  }),
                            sender_name: lastMsg.sender?.username ?? null,
                        };
                    } else {
                        formattedLastMsg = null;
                    }

                    const unreadCount = await prisma.messages.count({
                        where: {
                            conversation_id: c.id,
                            NOT: { message_reads: { some: { profile_id: profile.id } } },
                            sender_id: { not: profile.id },
                        },
                    });
                    console.log("unreadCount:", unreadCount);

                    return (
                        <li key={c.id} className="border rounded-lg p-4 shadow-sm">
                            <Link href={`/conversation/${c.id}`} className="block">
                                <div className="flex justify-between">
                                    <h3 className="font-normal text-lg">
                                        {c.name ?? c.conversation_members.map((m) => m.profiles?.username).join(", ")}
                                    </h3>
                                    <UnreadBadge
                                        initialCounts={unreadCount}
                                        currentProfileId={profile.id}
                                        conversationId={c.id}
                                        memberCount={c.conversation_members.length}
                                    />
                                </div>
                                <LastMessage conversationId={c.id} initialMessage={formattedLastMsg} />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
