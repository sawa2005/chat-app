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

export function AddUserButton({
    conversationId,
    addedByProfileId,
}: {
    conversationId: string;
    addedByProfileId: bigint;
}) {
    const [username, setUsername] = useState("");
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleAdd = () => {
        startTransition(async () => {
            try {
                await addMemberToConversation(conversationId, username, addedByProfileId);
                setUsername("");
                setOpen(false);
            } catch (err) {
                // TODO: show this error in the frontend.
                console.error("Failed to add user:", err);
            }
        });
    };

    return (
        <DropdownMenuItem asChild className="cursor-pointer">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        Add User
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] font-sans">
                    <DialogHeader>
                        <DialogTitle>Add user</DialogTitle>
                        <DialogDescription className="text-xs font-mono text-muted-foreground">
                            / enter a single username and click add to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-3">
                        <Label className="mb-2">Username</Label>
                        <Input name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="cursor-pointer">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button onClick={handleAdd} disabled={isPending || !username.trim()} className="cursor-pointer">
                            {isPending ? "Adding..." : "Add"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DropdownMenuItem>
    );
}
