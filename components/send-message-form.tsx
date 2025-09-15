"use client";

import { createClient } from "@/lib/client";
import { useState, useRef, ChangeEvent, FormEvent, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { sendMessage } from "@/app/conversation/create/actions";
import { getCurrentProfileId } from "@/app/login/actions";
import { broadcastMessage } from "@/lib/broadcast";
import Image from "next/image";
import { Image as ImageIcon, X } from "lucide-react";

const supabase = createClient();

type SendMessageFormProps = {
    conversationId: string;
    currentProfileId: bigint;
    currentUsername: string;
    sendMessage: typeof sendMessage; // pass server action from parent
    replyTo: bigint | null;
    setReplyTo: Dispatch<SetStateAction<bigint | null>>;
    onNewMessage: (message: {
        id: bigint;
        conversation_id: string;
        content: string;
        created_at: Date;
        edited_at: Date | null;
        sender: {
            id: bigint | null;
            username: string;
        };
        image_url: string | null;
        type: string;
        deleted: boolean;
        parent_id: bigint | null;
        messages: {
            id: bigint;
            content: string | null;
            image_url: string | null;
            sender: { id: bigint; username: string } | null;
        } | null;
    }) => void;
};

// TODO: add emoji picker
// TODO: add gif picker

export default function SendMessageForm({
    conversationId,
    currentProfileId,
    currentUsername,
    sendMessage,
    onNewMessage,
    replyTo,
    setReplyTo,
}: SendMessageFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [content, setContent] = useState("");
    const [imgPreview, setImgPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const channel = useRef(supabase.channel(`conversation-${conversationId}`));

    let typingTimeout: NodeJS.Timeout | null = null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);

        if (!typingTimeout) {
            channel.current.send({
                type: "broadcast",
                event: "user_typing",
                payload: { username: currentUsername },
            });

            console.log("Typing broadcast sent:", channel);

            typingTimeout = setTimeout(() => {
                typingTimeout = null;
            }, 2000);
        }
    };

    const handleIconClick = () => {
        fileInputRef.current?.click();
    };

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const uploadedfile = e.target.files?.[0];
        setFile(uploadedfile ?? null);
        if (!uploadedfile) return;

        setImgPreview(URL.createObjectURL(uploadedfile));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!content.trim() && !file) return;

        let uploadedImageUrl: string | null = null;

        if (file) {
            setUploading(true);

            const fileExt = file.name.split(".").pop();
            const fileName = `${currentProfileId}-${Date.now()}.${fileExt}`;
            const filePath = `messages/${fileName}`;

            // Upload file
            const { error } = await supabase.storage.from("chat-uploads").upload(filePath, file);

            if (error) {
                setUploading(false);
                console.error("Upload error:", error);
                return;
            }

            // Get public URL (permanent since bucket is public)
            const { data: publicData } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);

            uploadedImageUrl = publicData.publicUrl;

            setUploading(false);
        }

        setIsPending(true);
        const newMessage = await sendMessage(
            conversationId,
            currentProfileId,
            currentUsername,
            content,
            uploadedImageUrl,
            replyTo ?? null
        );

        onNewMessage({
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            content: newMessage.content ?? "",
            created_at: new Date(newMessage.created_at),
            edited_at: null,
            sender: {
                id: newMessage.sender_id,
                username: currentUsername,
            },
            ...(uploadedImageUrl ? { image_url: uploadedImageUrl } : { image_url: null }),
            type: newMessage.type ?? "message",
            deleted: false,
            parent_id: replyTo,
            messages: newMessage.messages
                ? {
                      id: newMessage.messages.id,
                      content: newMessage.messages.content,
                      image_url: newMessage.messages.image_url,
                      sender: newMessage.messages.sender
                          ? {
                                id: newMessage.messages.sender.id,
                                username: newMessage.messages.sender.username,
                            }
                          : null,
                  }
                : null,
        });

        console.log("Broadcast sent:", newMessage);

        await broadcastMessage(
            conversationId,
            {
                ...newMessage,
                sender_id: newMessage.sender.id,
                sender_username: newMessage.sender.username,
            },
            uploadedImageUrl
        );

        setContent("");
        setImgPreview(null);
        setFile(null);
        setReplyTo(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // reset file input
        }

        setIsPending(false);
    }

    function handleUploadCancel() {
        setIsPending(false);
        setImgPreview(null);
        setFile(null);
        setUploading(false);
    }

    return (
        <>
            {replyTo && (
                <div className="flex items-center font-mono text-xs text-muted-foreground">
                    / Replying to message #{replyTo.toString()}
                    <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="text-muted-foreground hover:text-primary cursor-pointer ml-auto"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="flex gap-1">
                    <div className="relative flex gap-1 w-full">
                        <Input
                            name="content"
                            type="text"
                            placeholder="Type your message..."
                            className="px-4 py-6 pr-10"
                            disabled={isPending}
                            value={content}
                            onChange={handleInputChange}
                        />
                        <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {/* Icon inside input */}
                        <button
                            type="button"
                            onClick={imgPreview ? handleUploadCancel : handleIconClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary cursor-pointer"
                        >
                            {imgPreview ? <X size={20} /> : <ImageIcon size={20} />}
                        </button>
                    </div>
                    {imgPreview && (
                        <Image width={50} height={30} src={imgPreview} alt="Preview" className="object-cover rounded" />
                    )}
                    <Button type="submit" className="cursor-pointer py-6" disabled={isPending || uploading}>
                        {isPending ? "Sending..." : uploading ? "Uploading..." : "Send"}
                    </Button>
                </div>
            </form>
        </>
    );
}
