import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function CreateConversationPage() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect("/login");
    }

    return (
        <div className="font-sans flex flex-col justify-center m-auto w-fit mt-20">
            <h1 className="text-2xl font-bold">Create a New Conversation</h1>
            <p className="mt-4">This is a placeholder page for creating a new conversation.</p>
            {/* Future form elements for creating a conversation will go here */}
        </div>
    );
}
