"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function handleCreateConversation(formData: FormData) {
    const currentProfileId = BigInt(4); // TODO: replace with session variable

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
