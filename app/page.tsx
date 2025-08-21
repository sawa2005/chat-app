import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="font-sans flex flex-col justify-center m-auto w-fit mt-20">
            <h1 className="text-2xl font-bold">Welcome to the Chat App</h1>
            <p className="mt-4">This is a simple chat application built with Next.js.</p>
            <Button className="mt-6 w-100">Get Started</Button>
        </div>
    );
}
