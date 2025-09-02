import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUsername, logout } from "./login/actions";
import Link from "next/link";
import ConversationsPage from "./conversation/page";

// TODO: add consistent page content width and responsive behavior.

export default async function Home() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect("/login");
    }

    const username = await getUsername(data.user.id);

    const messages = await prisma.messages.findMany();
    console.log(messages);

    return (
        <div className="font-sans flex flex-col justify-center m-auto mt-20">
            <h1 className="text-2xl font-bold">Welcome to the Chat App</h1>
            <div className="mt-6">
                <ConversationsPage />
                <Button className="cursor-pointer mb-5">
                    <Link href="/conversation/create">+ &nbsp; Create New Conversation</Link>
                </Button>
            </div>
        </div>
    );
}
