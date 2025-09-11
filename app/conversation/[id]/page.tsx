import { prisma } from "@/lib/prisma";
import { getCurrentProfileId, getUsername } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Messages from "@/components/messages";
import ConversationHeader from "@/components/conversation-header";

interface ConversationPageProps {
    params: Promise<{ id: string }>;
}

// TODO: add typing indicators.
// TODO: add reactions.
// TODO: add reply functionality.
// TODO: add read messages and notifications.

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
        <div className="font-sans flex flex-col h-[85vh]">
            <ConversationHeader conversation={conversation} currentProfileId={currentProfileId} />
            <Messages conversationId={conversation.id} currentUsername={username} currentProfileId={currentProfileId} />
        </div>
    );
}
