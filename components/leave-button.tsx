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

import { deleteConversation, leaveConversation } from "@/app/conversation/create/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

interface LeaveButtonProps {
    conversationId: string;
    profileId: bigint;
    memberCount: number;
}

export default function LeaveButton({ conversationId, profileId, memberCount }: LeaveButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleLeave = async () => {
        startTransition(async () => {
            try {
                if (memberCount <= 1) {
                    await deleteConversation(conversationId);
                } else {
                    await leaveConversation(conversationId, profileId);
                }

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
                        className="w-full text-destructive justify-start cursor-pointer hover:border-none px-4"
                    >
                        Leave Conversation
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="font-sans">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        {memberCount <= 1 ? (
                            <AlertDialogDescription className="font-mono text-xs pb-3">
                                Are you sure you want to leave? If you leave this conversation it will be deleted since
                                you are the last member.
                            </AlertDialogDescription>
                        ) : (
                            <AlertDialogDescription className="font-mono text-xs pb-3">
                                Are you sure you want to leave? A member of the conversation will have to add you back
                                if you change your mind.
                            </AlertDialogDescription>
                        )}
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
