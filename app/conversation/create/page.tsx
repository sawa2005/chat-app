import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createConversation, handleCreateConversation } from "./actions";

export default async function CreateConversationPage() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect("/login");
    }

    return (
        <div className="font-sans flex flex-col justify-center m-auto w-fit mt-20">
            <h1 className="text-2xl font-bold">Create a New Conversation</h1>
            <form action={handleCreateConversation} className="font-sans flex flex-col gap-3 p-5 max-w-md m-auto mt-10">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="selected-profile-names">Who do you want to message?</Label>
                    <p className="text-xs font-mono text-muted-foreground">
                        / for a group, seperate usernames with a comma - (,).
                    </p>
                    <Input id="selected-profile-names" name="selected-profile-names" type="text" required />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="group-name">What do you want to call this conversation?</Label>
                    <p className="text-xs font-mono text-muted-foreground">
                        / by default, it will be the same as selected usernames.
                    </p>
                    <Input id="group-name" name="group-name" type="text" required />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="first-message">What do you want to say?</Label>
                    <p className="text-xs font-mono text-muted-foreground">
                        / this will be the first message in this conversation.
                    </p>
                    <Textarea id="first-message" name="first-message" required />
                </div>
                <div className="flex gap-1">
                    <Button className="cursor-pointer">Create conversation</Button>
                </div>
            </form>
        </div>
    );
}
