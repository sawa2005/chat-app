import { prisma } from "@/lib/prisma";
import { sendMessage } from "../create/actions";
import { getCurrentProfileId } from "@/app/login/actions";

interface ConversationPageProps {
    params: { id: string };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
    const { id } = params;
    const currentProfileId = await getCurrentProfileId();

    if (!currentProfileId) return null; // TODO: handle this neater

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
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Conversation: {conversation.name ?? "(unnamed)"}</h1>

            <h2 className="text-lg font-semibold mt-4">Members</h2>
            <ul className="list-disc list-inside">
                {conversation.conversation_members.map((m) => (
                    <li key={m.profile_id}>{m.profiles?.username}</li>
                ))}
            </ul>

            <h2 className="text-lg font-semibold mt-4">Messages</h2>
            <ul className="space-y-2">
                {conversation.messages.map((msg) => (
                    <li key={msg.id}>
                        <span className="font-semibold">{msg.sender.username}:</span> {msg.content}
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
                className="flex gap-2 mt-4"
            >
                <input
                    name="content"
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 border rounded px-2 py-1"
                />
                <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
                    Send
                </button>
            </form>
        </div>
    );
}
