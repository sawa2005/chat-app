"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { handleCreateConversation } from "@/app/conversation/create/actions";

export function CreateConversationForm({
    errorKey,
    missingUsers,
}: {
    errorKey: string | null;
    missingUsers: string[];
}) {
    const [usernames, setUsernames] = useState("");
    const [duplicates, setDuplicates] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsernames(value);

        const list = value
            .split(",")
            .map((u) => u.trim().toLowerCase())
            .filter(Boolean);

        const dupes = list.filter((u, i) => list.indexOf(u) !== i);
        setDuplicates([...new Set(dupes)]);
    };

    return (
        <form action={handleCreateConversation} className="font-sans flex flex-col gap-3 p-5 max-w-md m-auto mt-10">
            <div className="flex flex-col gap-1">
                <Label htmlFor="selected-profile-names">Who do you want to message?</Label>
                <p className="text-xs font-mono text-muted-foreground">
                    / for a group, seperate usernames with a comma - (,).
                </p>
                {duplicates.length > 0 && (
                    <div className="text-xs font-mono text-destructive mb-1">
                        Duplicate usernames: {duplicates.join(", ")}
                    </div>
                )}
                {errorKey === "missing_usernames" && (
                    <div className="text-xs font-mono text-destructive mb-1">
                        The following usernames were not found: {missingUsers.join(", ")}
                    </div>
                )}
                <Input
                    id="selected-profile-names"
                    name="selected-profile-names"
                    type="text"
                    value={usernames}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="group-name">What do you want to call this conversation?</Label>
                <p className="text-xs font-mono text-muted-foreground">
                    / by default, it will be the same as selected usernames.
                </p>
                <Input id="group-name" name="group-name" type="text" placeholder={usernames} />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="first-message">What do you want to say?</Label>
                <p className="text-xs font-mono text-muted-foreground">
                    / this will be the first message in this conversation.
                </p>
                <Textarea id="first-message" name="first-message" required />
            </div>
            <div className="flex gap-1">
                <Button className="cursor-pointer" disabled={duplicates.length > 0}>
                    Create conversation
                </Button>
            </div>
        </form>
    );
}
