import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ConversationsPage from "./conversation/page";
import PrivatePage from "./private/page";

export default async function Home() {
    await PrivatePage();

    const messages = await prisma.messages.findMany();
    console.log(messages);

    return (
        <div className="font-sans flex flex-col justify-center m-auto mt-20">
            <h1 className="text-7xl font-bold">Welcome to the Chat App</h1>
            <div className="mt-6">
                <ConversationsPage />
                <Button className="cursor-pointer mb-5">
                    <Link href="/conversation/create">+ &nbsp; Create New Conversation</Link>
                </Button>
            </div>
        </div>
    );
}
