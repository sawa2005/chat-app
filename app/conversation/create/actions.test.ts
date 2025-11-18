import { vi, describe, it, expect, beforeEach } from "vitest";
import { sendMessage } from "./actions";
import { prisma } from "@/lib/prisma";
import { broadcastMessage } from "@/lib/broadcast";

// Mock the prisma client and broadcast function
vi.mock("@/lib/prisma", () => ({
    prisma: {
        messages: {
            create: vi.fn(),
        },
    },
    messagePayload: { select: {} }, // Corrected mock
}));

vi.mock("@/lib/broadcast", () => ({
    broadcastMessage: vi.fn(),
}));

describe("sendMessage Server Action", () => {
    beforeEach(() => {
        // Clear mock history before each test
        vi.clearAllMocks();
    });

    it("should create a message and broadcast it on success", async () => {
        // 1. Arrange
        const conversationId = "conv-123";
        const senderId = 1n;
        const content = "Hello, world!";
        const image = null;
        const parentId = null;

        const mockCreatedMessage = {
            id: 101n,
            conversation_id: conversationId,
            sender_id: senderId,
            content: content,
            created_at: new Date(),
            sender: {
                id: senderId,
                username: "testuser",
                avatar: "avatar.png",
            },
        };

        // @ts-expect-error - Allows simple type for mock message testing.
        prisma.messages.create.mockResolvedValue(mockCreatedMessage);
        // @ts-expect-error - Allows that same type for message broadcast test.
        broadcastMessage.mockResolvedValue({ status: "ok" });

        // 2. Act
        const result = await sendMessage(conversationId, senderId, content, image, parentId);

        // 3. Assert
        // Check if prisma.messages.create was called correctly
        expect(prisma.messages.create).toHaveBeenCalledWith({
            data: {
                conversation_id: conversationId,
                sender_id: senderId,
                content,
                image_url: null,
                image_height: null,
                image_width: null,
                parent_id: null,
            },
            ...{ select: {} }, // This will now match the mocked messagePayload
        });

        // Check if broadcastMessage was called correctly
        expect(broadcastMessage).toHaveBeenCalledWith(conversationId, {
            ...mockCreatedMessage,
            sender_id: mockCreatedMessage.sender.id,
            sender_username: mockCreatedMessage.sender.username,
            sender_avatar: mockCreatedMessage.sender.avatar,
        });

        // Check if the function returns the correct structure
        expect(result).toEqual({
            ...mockCreatedMessage,
            sender: {
                id: senderId,
                username: "testuser",
                avatar: "avatar.png",
            },
        });
    });

    it("should not broadcast a message if database creation fails", async () => {
        // 1. Arrange
        const errorMessage = "Database error";
        // @ts-expect-error - Allows simple message type for error testing.
        prisma.messages.create.mockRejectedValue(new Error(errorMessage));

        // 2. Act & 3. Assert
        await expect(sendMessage("conv-123", 1n, "test", null, null)).rejects.toThrow(errorMessage);

        // Ensure broadcastMessage was NOT called
        expect(broadcastMessage).not.toHaveBeenCalled();
    });
});
