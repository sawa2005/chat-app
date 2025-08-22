import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "./login/actions";
import Link from "next/link";

export default async function Home() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    // if (error || !data?.user) {
    //     redirect("/login");
    // }

    const currentUserEmail = data.user?.email;

    const messages = await prisma.messages.findMany();
    console.log(messages);

    return (
        <div className="font-sans flex flex-col justify-center m-auto w-fit mt-20">
            <h1 className="text-2xl font-bold">Welcome to the Chat App</h1>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Messages:</h2>
                <ul className="list-none">
                    {messages.map((message) => (
                        <li key={message.id}>
                            <p className={(message.sent_by === "samuelward" ? "text-right" : "") + " text-xs mb-1"}>
                                {message.sent_by +
                                    " - " +
                                    message.created_at.toLocaleDateString() +
                                    " / " +
                                    message.created_at.toLocaleTimeString()}
                            </p>
                            <div
                                className={
                                    (message.sent_by !== "samuelward"
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
            </div>
        </div>
    );
}
