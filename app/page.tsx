import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConversationsPage from "./conversation/page";

export default async function Home() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect("/login");
    }

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
