import { prisma } from "@/lib/prisma";
import { getCurrentProfileId, getUsername } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Messages from "@/components/messages";
import Avatar from "@/components/avatar";
import ConversationTitle from "@/components/conversation-title";
interface ConversationPageProps {
    params: Promise<{ id: string }>;
}

// TODO: add functionality for adding members to conversations.
// TODO: add info messages when conversation is edited (title, members etc.)

export default async function ConversationPage({ params }: ConversationPageProps) {
    const { id } = await params;
    const currentProfileId = await getCurrentProfileId();

    if (!currentProfileId) return null; // TODO: handle this neater

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        redirect("/login");
    }

    const username = await getUsername(userData.user.id);

    if (!username) {
        redirect("/login");
    }

    const conversation = await prisma.conversations.findUnique({
        where: { id },
        include: {
            conversation_members: {
                include: { profiles: true },
            },
            messages: {
                orderBy: { created_at: "asc" },
                include: { sender: true },
            },
        },
    });

    if (!conversation) {
        return <div className="p-6 text-red-500">Conversation not found.</div>;
    }

    return (
        <div className="font-sans">
            <ConversationTitle id={conversation.id} initialName={conversation.name} />

            <h2 className="text-lg font-semibold mt-4">Members</h2>
            <p className="text-xs font-mono text-muted-foreground">
                / {conversation.conversation_members.length} members
            </p>
            <div className="flex gap-3">
                {conversation.conversation_members.map((m) => (
                    <Avatar key={m.profile_id} size={35} avatarUrl={m.profiles.avatar} username={m.profiles.username} />
                ))}
            </div>

            <Messages conversationId={conversation.id} currentUsername={username} currentProfileId={currentProfileId} />
        </div>
    );
}
