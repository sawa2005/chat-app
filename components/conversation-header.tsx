"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Ellipsis } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AddUserButton } from "@/components/add-user-button";
import Avatar from "@/components/avatar";
import ConversationTitle from "@/components/conversation-title";
import LeaveButton from "@/components/leave-button";
import { Skeleton } from "@/components/ui/skeleton";

import { type Prisma as PrismaClient } from "../generated/prisma/client"; // Updated import path

import { getConversationMembers } from "@/app/conversation/create/actions";
import { createClient } from "@/lib/client";

import type { Member } from "@/lib/types";

type ConversationWithRelations = PrismaClient.conversationsGetPayload<{
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
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [name, setName] = useState(conversation.name);
    const supabase = createClient();

    useEffect(() => {
        const fetchMembers = async () => {
            const members = await getConversationMembers(conversation.id);
            setMembers(members);
            console.log("setMembers:", members);
            setLoadingMembers(false);
        };

        fetchMembers();
    }, [conversation.id]);

    useEffect(() => {
        const channel = supabase
            .channel(`conversation-${conversation.id}`)
            .on("broadcast", { event: "member_added" }, ({ payload }) => {
                console.log("Member added!");
                setMembers((prev) => [
                    ...prev,
                    {
                        ...payload,
                        id: payload.id.toString(), // normalize to string
                    } as Member,
                ]);
            })
            .on("broadcast", { event: "member_removed" }, ({ payload }) => {
                console.log("Member removed!");
                setMembers((prev) => prev.filter((m) => m.id.toString() !== payload.id.toString()));
            })
            .on("broadcast", { event: "name_edited" }, ({ payload }) => {
                console.log("Conversation name edit received:", payload);
                setName(payload.name);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation.id, supabase, setMembers]);

    return (
        <div>
            <div className={`flex justify-between w-full ${!isExpanded ? "flex-1 min-h-0 h-min overflow-y-auto" : ""}`}>
                <ConversationTitle id={conversation.id} name={name} setName={setName} initialName={conversation.name} />
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

                        <LeaveButton
                            conversationId={conversation.id}
                            profileId={currentProfileId}
                            memberCount={members.length}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <button
                className={`flex gap-1 items-center text-xs font-mono text-muted-foreground cursor-pointer hover:text-primary ${
                    isExpanded ? "mb-3" : ""
                }`}
                onClick={() => setIsExpanded((prev) => !prev)}
            >
                {isExpanded ? "collapse" : "expand"} {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {isExpanded && (
                <div>
                    <h2 className="text-lg font-semibold">Members</h2>
                    <p className="text-xs font-mono text-muted-foreground">
                        / {loadingMembers ? "loading..." : `${members.length} members`}
                    </p>
                    <div className="flex gap-3 mt-3">
                        {!loadingMembers ? (
                            members.map((m) => (
                                <Avatar key={m.id} size={35} avatarUrl={m.avatar} username={m.username} />
                            ))
                        ) : (
                            <>
                                <Skeleton className="h-9 w-9 rounded-full mt-2" />
                                <Skeleton className="h-9 w-9 rounded-full mt-2" />
                                <Skeleton className="h-9 w-9 rounded-full mt-2" />
                            </>
                        )}
                    </div>
                    <h2 className="text-lg font-semibold mt-4">Messages</h2>
                </div>
            )}
        </div>
    );
}
