import { prisma } from "@/lib/prisma";
import { getCurrentProfileId, getUsername } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Messages from "@/components/messages";
import Avatar from "@/components/avatar";
import ConversationTitle from "@/components/conversation-title";
import LeaveButton from "@/components/leave-button";

import { Ellipsis } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AddUserButton } from "@/components/add-user-button";

interface ConversationPageProps {
    params: Promise<{ id: string }>;
}

// TODO: add functionality for leaving conversations.
// TODO: add UI refresh on member add.
// TODO: broadcast info messages and changes like members / conversation title.
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
        <div className="font-sans">
            <div className="flex justify-between w-full">
                <ConversationTitle id={conversation.id} initialName={conversation.name} />
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-primary cursor-pointer mb-auto">
                            <Ellipsis size={20} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-w-56 w-fit font-sans">
                        <AddUserButton conversationId={conversation.id} addedByProfileId={currentProfileId} />
                        <LeaveButton conversationId={conversation.id} profileId={currentProfileId} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <h2 className="text-lg font-semibold">Members</h2>
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
