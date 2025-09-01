import { prisma } from "@/lib/prisma";
import { sendMessage } from "../create/actions";
import { getCurrentProfileId, getUsername } from "@/app/login/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface ConversationPageProps {
    params: { id: string };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
    const { id } = params;
    const currentProfileId = await getCurrentProfileId();

    if (!currentProfileId) return null; // TODO: handle this neater

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        redirect("/login");
    }

    const username = await getUsername(userData.user.id);

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

            <h2 className="text-lg font-semibold mt-4">Messages</h2>
            <ul className="list-none">
                {conversation.messages.map((message) => (
                    <li
                        key={message.id}
                        className={"max-w-9/10 " + (message.sender.username === username ? "ml-auto" : "")}
                    >
                        <p className={(message.sender.username === username ? "text-right" : "") + " text-xs mb-1"}>
                            {(message.sender.username === username ? "You" : message.sender.username) +
                                " - " +
                                message.created_at.toLocaleDateString() +
                                " / " +
                                message.created_at.toLocaleTimeString()}
                        </p>
                        <div
                            className={
                                (message.sender.username !== username
                                    ? "bg-accent rounded-tl-none"
                                    : "rounded-tr-none ml-auto") +
                                " py-2 px-4 rounded-xl mb-4 inset-shadow-sm/8 shadow-lg/8 w-fit"
                            }
                        >
                            {message.content}
                        </div>
                    </li>
                ))}
            </ul>

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
