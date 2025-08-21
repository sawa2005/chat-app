import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function Home() {
    const messages = await prisma.messages.findMany();
    console.log(messages);

    return (
        <div className="font-sans flex flex-col justify-center m-auto w-fit mt-20">
            <h1 className="text-2xl font-bold">Welcome to the Chat App</h1>
            <p className="mt-4">This is a simple chat application built with Next.js.</p>
            <Button className="mt-6 w-100">This is a button</Button>
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Messages:</h2>
                <ul className="list-none">
                    {messages.map((message) => (
                        <li key={message.id}>
                            <p className="text-xs mb-1">
                                {message.created_at.toLocaleDateString() +
                                    " / " +
                                    message.created_at.toLocaleTimeString()}
                            </p>
                            <div
                                className={
                                    (message.sent_by !== "samuelward" ? "bg-accent" : undefined) +
                                    " p-2 rounded-xl mb-4 inset-shadow-sm/8 shadow-lg/8"
                                }
                            >
                                {message.sent_by + " - " + message.content}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
