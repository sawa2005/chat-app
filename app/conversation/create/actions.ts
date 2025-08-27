"use server";

import { prisma } from "@/lib/prisma";

export async function createConversation(
    currentProfileId: bigint,
    selectedProfileIds: bigint[],
    selectedProfileNames: string[],
    firstMessage: string,
    groupName: string
) {
    if (!selectedProfileIds.length || !firstMessage) {
        throw new Error("Missing required fields");
    }

    if (selectedProfileIds.length === 1 && !selectedProfileNames[0]) {
        throw new Error("Missing selected profile name for 1-on-1 conversation");
    }

    const conversation = await prisma.conversations.create({
        data: {
            name: selectedProfileIds.length > 1 ? groupName : selectedProfileNames[0],
            conversation_members: {
                create: [...selectedProfileIds.map((uid) => ({ profile_id: uid })), { profile_id: currentProfileId }],
            },
            messages: {
                create: {
                    content: firstMessage,
                    sender_id: currentProfileId,
                },
            },
        },
        include: {
            conversation_members: { include: { profiles: true } },
            messages: { include: { sender: true } },
        },
    });

    return conversation;
}

export async function sendMessage(conversationId: string, senderId: bigint, content: string) {
    const message = await prisma.messages.create({
        data: {
            conversation_id: conversationId,
            sender_id: senderId,
            content,
        },
    });

    return message;
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
