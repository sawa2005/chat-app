import { prisma } from "@/lib/prisma";
import { sendMessage } from "../create/actions";
import { getCurrentProfileId, getUsername } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        <div className="p-6 font-sans">
            <p className="text-xs font-mono text-muted-foreground">/ conversation</p>
            <h1 className="text-xl font-bold mb-4">{conversation.name ?? "(unnamed)"}</h1>

            <h2 className="text-lg font-semibold mt-4">Members</h2>
            <p className="text-xs font-mono text-muted-foreground">/ placeholder until avatars</p>
            <ul className="list-disc list-inside">
                {conversation.conversation_members.map((m) => (
                    <li key={m.profile_id}>{m.profiles?.username}</li>
                ))}
            </ul>

            <Messages conversationId={conversation.id} currentUsername={username} />

            <form
                action={async (formData) => {
                    // TODO: put this in a seperate file to make it neater
                    "use server";
                    const content = formData.get("content")?.toString();
                    if (!content) return;

                    await sendMessage(id, currentProfileId, content);
                }}
                className="flex gap-1 mt-6"
            >
                <Input name="content" type="text" placeholder="Type your message..." className="px-4 py-6" />
                <Button type="submit" className="cursor-pointer py-6">
                    Send
                </Button>
            </form>
        </div>
    );
}
