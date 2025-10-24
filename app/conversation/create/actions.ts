"use server";

import { getCurrentProfileId } from "@/app/login/actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { broadcastMember, broadcastMessage, broadcastNameChange, broadcastReaction } from "@/lib/broadcast";
import { createClient } from "@/lib/server";

import { Member } from "@/lib/types";

export async function getFirstUnreadIndex(conversationId: string, profileId: bigint) {
    // Calculate the index of the first unread message
    const [indexRow] = await prisma.$queryRaw<{ index: number | null }[]>`
    WITH ordered AS (
        SELECT id, sender_id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS zero_based_index
        FROM public.messages
        WHERE conversation_id = ${conversationId}::uuid
        ORDER BY created_at ASC
    )
    SELECT zero_based_index AS index
    FROM ordered o
    WHERE o.sender_id IS DISTINCT FROM ${profileId}
        AND NOT EXISTS (
            SELECT 1
            FROM public.message_reads r
            WHERE r.message_id = o.id AND r.profile_id = ${profileId}
        )
    ORDER BY o.zero_based_index
    LIMIT 1;
    `;

    const firstUnreadIndex =
        indexRow && indexRow.index !== null
            ? Number(indexRow.index) // convert BigInt to Number
            : null;

    console.log("First unread index calculated:", firstUnreadIndex);

    return firstUnreadIndex;
}

export async function markMessagesAsRead(conversationId: string, profileId: bigint) {
    console.log("markMessageAsRead:", conversationId, profileId);

    const unreadMessages = await prisma.messages.findMany({
        where: {
            conversation_id: conversationId,
            AND: [
                {
                    OR: [
                        { sender_id: { not: profileId } }, // normal messages
                        { sender_id: null }, // info messages
                    ],
                },
                {
                    NOT: {
                        message_reads: {
                            some: { profile_id: profileId }, // already read messages
                        },
                    },
                },
            ],
        },
        select: { id: true }, // only need id to mark as read
    });

    console.log("Unread messages fetched:", unreadMessages.length);

    if (unreadMessages.length > 0) {
        console.log(
            "Marking messages as read:",
            unreadMessages.map((m) => m.id.toString())
        );

        await prisma.message_reads.createMany({
            data: unreadMessages.map((msg) => ({ message_id: msg.id, profile_id: profileId })),
            skipDuplicates: true,
        });
    }
}

export async function getUsernameList(profileIds: bigint[]) {
    const profiles = await prisma.profiles.findMany({
        where: { id: { in: profileIds } },
        select: { id: true, username: true },
    });

    return Object.fromEntries(profiles.map((p) => [p.id.toString(), p.username]));
}

export async function addReaction(conversationId: string, messageId: bigint, profileId: bigint, emoji: string) {
    const existing = await prisma.message_reactions.findUnique({
        where: {
            message_id_profile_id_emoji: {
                message_id: messageId,
                profile_id: profileId,
                emoji,
            },
        },
    });

    if (existing) {
        return existing;
    }

    const addedReaction = await prisma.message_reactions.create({
        data: { message_id: messageId, profile_id: profileId, emoji },
    });

    broadcastReaction(conversationId, addedReaction, "added");

    return addedReaction;
}

export async function removeReaction(conversationId: string, messageId: bigint, profileId: bigint, emoji: string) {
    const removedReaction = await prisma.message_reactions.delete({
        where: { message_id_profile_id_emoji: { message_id: messageId, profile_id: profileId, emoji } },
    });

    console.log("Removed reaction:", removedReaction);

    broadcastReaction(conversationId, removedReaction, "removed");

    return removedReaction;
}

export async function loadInitMessages(conversationId: string) {
    try {
        const prismaMessages = await prisma.messages.findMany({
            where: { conversation_id: conversationId },
            orderBy: { created_at: "desc" },
            take: 20,
            select: {
                id: true,
                conversation_id: true,
                content: true,
                created_at: true,
                edited_at: true,
                image_url: true,
                type: true,
                deleted: true,
                sender: { select: { id: true, username: true, avatar: true } },
                messages: {
                    select: {
                        id: true,
                        content: true,
                        image_url: true,
                        sender: { select: { id: true, username: true } },
                    },
                },
                message_reactions: { select: { emoji: true, profile_id: true } },
                message_reads: { select: { profile_id: true } },
            },
        });

        if (prismaMessages) {
            const messages = prismaMessages.reverse().map((msg) => ({
                ...msg,
                // convert IDs to bigint
                id: BigInt(msg.id),
                sender: msg.sender
                    ? { id: BigInt(msg.sender.id), username: msg.sender.username, avatar: msg.sender.avatar }
                    : null,
                created_at: msg.created_at.toISOString(),
            }));

            return messages;
        }
    } catch (err) {
        console.error("Error loading messages:", err);
    }
}

export async function loadMoreMessages(conversationId: string, beforeMessageId: bigint) {
    try {
        const prismaMessages = await prisma.messages.findMany({
            where: {
                conversation_id: conversationId,
                id: { lt: beforeMessageId },
            },
            orderBy: { created_at: "desc" },
            take: 20,
            select: {
                id: true,
                conversation_id: true,
                content: true,
                created_at: true,
                edited_at: true,
                image_url: true,
                type: true,
                deleted: true,
                sender: { select: { id: true, username: true, avatar: true } },
                messages: {
                    select: {
                        id: true,
                        content: true,
                        image_url: true,
                        sender: { select: { id: true, username: true } },
                    },
                },
                message_reactions: { select: { emoji: true, profile_id: true } },
                message_reads: { select: { profile_id: true } },
            },
        });

        if (prismaMessages) {
            const messages = prismaMessages.reverse().map((msg) => ({
                ...msg,
                // convert IDs to bigint
                id: BigInt(msg.id),
                sender: msg.sender
                    ? { id: BigInt(msg.sender.id), username: msg.sender.username, avatar: msg.sender.avatar }
                    : null,
                created_at: msg.created_at.toISOString(),
            }));

            return messages;
        }
    } catch (err) {
        console.error("Error loading more messages:", err);
    }
}

export async function editMessage(messageId: bigint, newContent: string) {
    const updated = await prisma.messages.update({
        where: { id: messageId },
        data: { content: newContent, edited_at: new Date() },
    });

    const supabase = await createClient();
    const broadcast = await supabase.channel(`conversation-${updated.conversation_id}`).send({
        type: "broadcast",
        event: "message_edited",
        payload: {
            id: updated.id.toString(),
            content: updated.content,
            edited_at: updated.edited_at,
        },
    });

    console.log("Message edit broadcasted:", broadcast);

    return updated;
}

export async function deleteMessage(messageId: bigint) {
    const msg = await prisma.messages.update({
        where: { id: messageId },
        data: { deleted: true },
    });

    const supabase = await createClient();

    if (msg.image_url) {
        const filePath = msg.image_url.replace(/^.*\/storage\/v1\/object\/public\/chat-uploads\//, "");
        console.log("Attempting to delete image path:", filePath);

        const { data, error } = await supabase.storage.from("chat-uploads").remove([filePath]);
        console.log("Delete result:", { data, error });
    }

    const broadcast = await supabase.channel(`conversation-${msg.conversation_id}`).send({
        type: "broadcast",
        event: "message_deleted",
        payload: { id: msg.id.toString() },
    });

    console.log("Message delete broadcasted:", broadcast);

    return msg;
}

export async function getMessageIds(conversationId: string): Promise<bigint[]> {
    const rawIds = await prisma.messages.findMany({
        where: { conversation_id: conversationId },
        select: {
            id: true,
        },
    });

    return Array.from(rawIds, (i) => i.id);
}

export async function getConversationMembers(conversationId: string): Promise<Member[]> {
    const members = await prisma.conversation_members.findMany({
        where: { conversation_id: conversationId },
        include: {
            profiles: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            },
        },
    });

    return members
        .map((m) => m.profiles)
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => ({
            id: p.id,
            username: p.username,
            avatar: p.avatar,
        }));
}

export async function addMemberToConversation(conversationId: string, username: string, addedBy: bigint) {
    const newUser = await prisma.profiles.findUnique({ where: { username } });
    if (!newUser) {
        throw new Error(`User with username: '${username}' not found.`);
    }

    const existing = await prisma.conversation_members.findFirst({
        where: {
            conversation_id: conversationId,
            profile_id: newUser.id,
        },
    });

    if (existing) throw new Error(`${newUser.username} is already in the conversation.`);

    await prisma.conversation_members.create({
        data: {
            conversation_id: conversationId,
            profile_id: newUser.id,
        },
    });

    const addedByUser = await prisma.profiles.findUnique({ where: { id: addedBy } });

    const msg = await prisma.messages.create({
        data: {
            conversation_id: conversationId,
            content: `${addedByUser?.username} added ${newUser.username} to the conversation.`,
            type: "info",
        },
    });

    const msgWithParent = {
        ...msg,
        messages: null,
        sender_avatar: null,
    };

    await broadcastMessage(conversationId, msgWithParent);

    const member = {
        id: newUser.id,
        username: newUser.username,
        avatar: newUser.avatar,
    };

    await broadcastMember(conversationId, member, "added");
}

export async function deleteConversation(conversationId: string) {
    const response = await prisma.conversations.delete({ where: { id: conversationId } });
    console.log("Deleted conversation:", response);
}

export async function leaveConversation(conversationId: string, profileId: bigint) {
    await prisma.conversation_members.delete({
        where: {
            conversation_id_profile_id: {
                conversation_id: conversationId,
                profile_id: profileId,
            },
        },
    });

    const user = await prisma.profiles.findUnique({ where: { id: profileId } });

    const msg = await prisma.messages.create({
        data: {
            conversation_id: conversationId,
            content: `${user?.username} left the conversation.`,
            type: "info",
        },
    });

    const msgWithParent = {
        ...msg,
        messages: null,
        sender_avatar: null,
    };

    await broadcastMessage(conversationId, msgWithParent);
    await broadcastMember(conversationId, { id: profileId }, "removed");
}

export async function updateConversationName(conversationId: string, newName: string) {
    const profileId = await getCurrentProfileId();

    if (newName === "") return;
    if (!profileId) throw new Error("Unauthorized");

    const profile = await prisma.profiles.findUnique({
        where: { id: profileId },
        select: { username: true },
    });
    if (!profile) throw new Error("Profile not found");

    const updated = await prisma.conversations.update({
        where: { id: conversationId },
        data: { name: newName },
    });

    const msg = await prisma.messages.create({
        data: {
            conversation_id: conversationId,
            content: `${profile.username} changed the conversation name to '${newName}'.`,
            type: "info",
        },
    });

    const msgWithParent = {
        ...msg,
        messages: null,
        sender_avatar: null,
    };

    await broadcastMessage(conversationId, msgWithParent);
    await broadcastNameChange(conversationId, newName);

    return updated;
}

export async function handleCreateConversation(formData: FormData) {
    const currentProfileId = await getCurrentProfileId();
    if (!currentProfileId) throw new Error("Not authenticated or profile missing");

    const selectedProfileNames =
        formData
            .get("selected-profile-names")
            ?.toString()
            .split(",")
            .map((s) => s.trim()) ?? [];

    const groupName = formData.get("group-name")?.toString() ?? undefined;
    const firstMessage = formData.get("first-message")?.toString() ?? "";
    const missingUsernames: string[] = [];

    if (!selectedProfileNames.length || !firstMessage) {
        throw new Error("Missing required fields");
    }

    for (const username of selectedProfileNames) {
        const profile = await prisma.profiles.findFirst({ where: { username } });
        if (!profile) missingUsernames.push(username);
    }

    if (missingUsernames.length > 0) {
        redirect(
            `/conversation/create?error=missing_usernames&users=${encodeURIComponent(missingUsernames.join(","))}`
        );
    }

    const selectedProfiles = await prisma.profiles.findMany({
        where: { username: { in: selectedProfileNames } },
        select: { id: true },
    });

    const selectedProfileIds = selectedProfiles.map((p) => p.id);

    const conversationId = await createConversation(
        currentProfileId,
        selectedProfileIds,
        selectedProfileNames,
        firstMessage,
        groupName
    );

    redirect(`/conversation/${conversationId}`);
}

export async function createConversation(
    currentProfileId: bigint,
    selectedProfileIds: bigint[],
    selectedProfileNames: string[],
    firstMessage: string,
    groupName?: string
) {
    const conversationName = groupName && groupName.trim().length > 0 ? groupName : selectedProfileNames.join(", ");

    const conversation = await prisma.conversations.create({
        data: {
            name: conversationName,
        },
    });

    const memberIds = [currentProfileId, ...selectedProfileIds];

    await prisma.conversation_members.createMany({
        data: memberIds.map((id) => ({
            conversation_id: conversation.id,
            profile_id: id,
        })),
    });

    await prisma.messages.create({
        data: {
            conversation_id: conversation.id,
            sender_id: currentProfileId,
            content: firstMessage,
        },
    });

    return conversation.id;
}

export async function sendMessage(
    conversationId: string,
    senderId: bigint,
    senderUsername: string,
    senderAvatar: string | null,
    content: string,
    imageUrl: string | null,
    parentId: bigint | null
) {
    const message = await prisma.messages.create({
        data: {
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            image_url: imageUrl,
            parent_id: parentId ?? null,
        },
        include: {
            sender: { select: { id: true, username: true, avatar: true } },
            messages: {
                // include parent message info if it exists
                select: {
                    id: true,
                    content: true,
                    image_url: true,
                    sender: { select: { id: true, username: true, avatar: true } },
                },
            },
        },
    });

    return {
        ...message,
        sender: {
            id: senderId,
            username: senderUsername,
            avatar: senderAvatar,
        },
    };
}

export async function getUserConversations(profileId: bigint) {
    const conversations = await prisma.conversations.findMany({
        where: {
            conversation_members: { some: { profile_id: profileId } },
        },
        include: {
            conversation_members: { include: { profiles: true } },
            messages: true,
        },
    });

    return conversations;
}
