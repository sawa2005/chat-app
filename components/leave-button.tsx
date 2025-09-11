"use client";

import { useTransition } from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { leaveConversation } from "@/app/conversation/create/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

interface LeaveButtonProps {
    conversationId: string;
    profileId: bigint;
}

export default function LeaveButton({ conversationId, profileId }: LeaveButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleLeave = async () => {
        startTransition(async () => {
            try {
                await leaveConversation(conversationId, profileId);

                window.location.href = "/";
            } catch (err) {
                console.error("Failed to leave conversation:", err);
            }
        });
    };

    return (
        <DropdownMenuItem asChild className="cursor-pointer">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full text-red-700 justify-start cursor-pointer hover:border-none px-4"
                    >
                        Leave Conversation
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="font-sans">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="font-mono text-xs pb-3">
                            Are you sure you want to leave? A member of the conversation will have to add you back if
                            you change your mind.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer hover:bg-red-700"
                            onClick={handleLeave}
                            disabled={isPending}
                        >
                            {isPending ? "Leaving..." : "Leave Conversation"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DropdownMenuItem>
    );
}
