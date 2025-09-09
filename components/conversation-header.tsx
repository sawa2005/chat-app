"use client";

import { useState } from "react";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { ChevronUp, Ellipsis } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { AddUserButton } from "@/components/add-user-button";
import Avatar from "@/components/avatar";
import ConversationTitle from "@/components/conversation-title";
import LeaveButton from "@/components/leave-button";

import { Prisma } from "@prisma/client";

type ConversationWithRelations = Prisma.conversationsGetPayload<{
    include: {
        conversation_members: {
            include: { profiles: true };
        };
        messages: {
            orderBy: { created_at: "asc" }; // orderBy doesn't affect type
            include: { sender: true };
        };
    };
}>;

type ConversationHeaderProps = {
    conversation: ConversationWithRelations;
    currentProfileId: bigint;
};

export default function ConversationHeader({ conversation, currentProfileId }: ConversationHeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isExpanded === false) {
        return (
            <div>
                <div className="flex justify-between w-full flex-1 min-h-0 h-min overflow-y-auto">
                    <ConversationTitle id={conversation.id} initialName={conversation.name} />
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-primary cursor-pointer mb-auto">
                                <Ellipsis size={20} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-w-56 w-fit font-sans">
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <AddUserButton conversationId={conversation.id} addedByProfileId={currentProfileId} />
                            </DropdownMenuItem>

                            <LeaveButton conversationId={conversation.id} profileId={currentProfileId} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <button
                    className="flex gap-1 items-center text-xs font-mono text-muted-foreground cursor-pointer hover:text-primary"
                    onClick={() => setIsExpanded((prev) => !prev)}
                >
                    expand <ChevronDown size={15} />
                </button>
            </div>
        );
    } else {
        return (
            <div>
                <div className="flex justify-between w-full">
                    <ConversationTitle id={conversation.id} initialName={conversation.name} />
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-primary cursor-pointer mb-auto">
                                <Ellipsis size={20} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-w-56 w-fit font-sans">
                            <AddUserButton conversationId={conversation.id} addedByProfileId={currentProfileId} />
                            <LeaveButton conversationId={conversation.id} profileId={currentProfileId} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <button
                    className="flex gap-1 items-center text-xs font-mono text-muted-foreground cursor-pointer hover:text-primary mb-3"
                    onClick={() => setIsExpanded((prev) => !prev)}
                >
                    collapse <ChevronUp size={15} />
                </button>
                <div>
                    <h2 className="text-lg font-semibold">Members</h2>
                    <p className="text-xs font-mono text-muted-foreground">
                        / {conversation.conversation_members.length} members
                    </p>
                    <div className="flex gap-3">
                        {conversation.conversation_members.map((m) => (
                            <Avatar
                                key={m.profile_id}
                                size={35}
                                avatarUrl={m.profiles.avatar}
                                username={m.profiles.username}
                            />
                        ))}
                    </div>
                    <h2 className="text-lg font-semibold mt-4">Messages</h2>
                </div>
            </div>
        );
    }
}
