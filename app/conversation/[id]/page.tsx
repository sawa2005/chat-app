import { prisma } from "@/lib/prisma";

interface ConversationPageProps {
    params: { id: string };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
    const id = params.id;

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
        </div>
    );
}
