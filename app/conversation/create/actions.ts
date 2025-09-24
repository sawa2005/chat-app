"use server";

import { getCurrentProfileId } from "@/app/login/actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { broadcastMember, broadcastMessage, broadcastReaction } from "@/lib/broadcast";
import { createClient } from "@/lib/server";

import { Member, Reaction } from "@/lib/types";

export async function addReaction(conversationId: string, messageId: bigint, profileId: bigint, emoji: string) {
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
            orderBy: { created_at: "asc" },
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
            },
        });

        if (prismaMessages) {
            const messages = prismaMessages.map((msg) => ({
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

    await prisma.messages.create({
        data: {
            conversation_id: conversationId,
            content: `${profile.username} changed the conversation name to '${newName}'.`,
            type: "info",
        },
    });

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

    if (!selectedProfileNames.length || !firstMessage) {
        throw new Error("Missing required fields");
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
