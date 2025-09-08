"use client";

import { useTransition } from "react";
import { leaveConversation } from "@/app/conversation/create/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

interface LeaveButtonProps {
    conversationId: string;
    profileId: bigint;
}

// TODO: use shadcn alert dialog instead of confirm.

export default function LeaveButton({ conversationId, profileId }: LeaveButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleLeave = async () => {
        if (
            !confirm(
                "Are you sure you want to leave? A member of the conversation will have to add you back if you change your mind."
            )
        )
            return;

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
            <Button
                variant="ghost"
                className="w-full text-red-700 justify-start cursor-pointer hover:border-none px-4"
                onClick={handleLeave}
                disabled={isPending}
            >
                {isPending ? "Leaving..." : "Leave Conversation"}
            </Button>
        </DropdownMenuItem>
    );
}
