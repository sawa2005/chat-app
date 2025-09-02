import { prisma } from "@/lib/prisma";
import { getCurrentProfileId, getUsername } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Messages from "@/components/messages";
interface ConversationPageProps {
    params: Promise<{ id: string }>;
}

// TODO: add functionality for editing conversation name.
// TODO: add functionality for adding members to conversations.

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
            <p className="text-xs font-mono text-muted-foreground">/ conversation</p>
            <h1 className="text-xl font-bold mb-4">{conversation.name ?? "(unnamed)"}</h1>

            <h2 className="text-lg font-semibold mt-4">Members</h2>
            <p className="text-xs font-mono text-muted-foreground">/ placeholder until avatars</p>
            <ul className="list-disc list-inside">
                {conversation.conversation_members.map((m) => (
                    <li key={m.profile_id}>{m.profiles?.username}</li>
                ))}
            </ul>

            <Messages conversationId={conversation.id} currentUsername={username} currentProfileId={currentProfileId} />
        </div>
    );
}
