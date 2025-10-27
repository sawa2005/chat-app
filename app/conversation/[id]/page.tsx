import { prisma } from "@/lib/prisma";
import { getCurrentProfileId, getUsername } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Messages from "@/components/messages/messages";
import ConversationHeader from "@/components/conversation-header";
import { isValidUUID } from "@/lib/utils";

interface ConversationPageProps {
    params: Promise<{ id: string }>;
}

// TODO: maybe add notifications.
// TODO: maybe add embeds/previews for links.

export default async function ConversationPage({ params }: ConversationPageProps) {
    const { id } = await params;
    const currentProfileId = await getCurrentProfileId();

    if (!currentProfileId) return null;

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        redirect("/login");
    }

    const username = await getUsername(userData.user.id);

    if (!username) {
        redirect("/login");
    }

    if (!isValidUUID(id)) {
        return <div className="p-6 text-red-500 font-sans text-center">Invalid conversation id.</div>;
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
        return <div className="p-6 text-red-500 font-sans text-center">Conversation not found.</div>;
    }

    // Get current user's avatar from Prisma
    const currentUser = await prisma.profiles.findUnique({
        where: { id: currentProfileId },
        select: { id: true, avatar: true },
    });

    const unreadCount = await prisma.messages.count({
        where: {
            conversation_id: id,
            NOT: { message_reads: { some: { profile_id: currentUser?.id } } },
            sender_id: { not: currentUser?.id },
        },
    });

    const currentUserAvatar = currentUser?.avatar ?? null;

    return (
        <div className="font-sans flex flex-col h-[85vh]">
            <ConversationHeader conversation={conversation} currentProfileId={currentProfileId} />
            <Messages
                conversationId={conversation.id}
                conversationName={conversation.name}
                currentUsername={username}
                currentProfileId={currentProfileId}
                currentUserAvatar={currentUserAvatar}
                initialUnreadCount={unreadCount ?? null}
            />
        </div>
    );
}
