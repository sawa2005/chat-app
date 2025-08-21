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
            <div className="mt-4">
                <h2 className="text-xl font-semibold">Messages:</h2>
                <ul className="list-disc pl-5">
                    {messages.map((message) => (
                        <li className={message.sent_by !== "samuelward" ? "bg-accent" : undefined} key={message.id}>
                            {message.content}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
