"use client";

import { useState, useTransition } from "react";
import { addMemberToConversation } from "@/app/conversation/create/actions";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// TODO: fix dialog narrowing the page behind.
// TODO: style dialog.

export function AddUserButton({
    conversationId,
    addedByProfileId,
}: {
    conversationId: string;
    addedByProfileId: bigint;
}) {
    const [username, setUsername] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleAdd = () => {
        startTransition(async () => {
            try {
                await addMemberToConversation(conversationId, username, addedByProfileId);
                setUsername("");
            } catch (err) {
                // TODO: show this error in the frontend.
                console.error("Failed to add user:", err);
            }
        });
    };

    return (
        <DropdownMenuItem asChild className="cursor-pointer">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        Add User
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add user to this conversation.</DialogTitle>
                        <DialogDescription>Enter a single username and click add to confirm.</DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label>Username</Label>
                        <Input name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleAdd} disabled={isPending || !username.trim()}>
                            {isPending ? "Adding..." : "Add"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DropdownMenuItem>
    );
}
