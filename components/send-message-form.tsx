"use client";

import { createClient } from "@/lib/client";
import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { sendMessage } from "@/app/conversation/create/actions";
import { getCurrentProfileId } from "@/app/login/actions";
import Image from "next/image";
import { Image as ImageIcon, X } from "lucide-react";

const supabase = createClient();

type SendMessageFormProps = {
    conversationId: string;
    currentProfileId: bigint;
    currentUsername: string;
    sendMessage: typeof sendMessage; // pass server action from parent
    onNewMessage: (message: {
        id: bigint;
        conversation_id: string;
        content: string;
        created_at: Date;
        sender: {
            id: bigint | null;
            username: string;
        };
        image_url: string | null;
        type: string;
    }) => void;
};

// TODO: fix row-level security error on upload
// TODO: style image upload with icon etc.
// TODO: image upload only on message send.

export default function SendMessageForm({
    conversationId,
    currentProfileId,
    currentUsername,
    sendMessage,
    onNewMessage,
}: SendMessageFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [content, setContent] = useState("");
    const [imgPreview, setImgPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        const newMessage = await sendMessage(conversationId, currentProfileId, content, uploadedImageUrl);

        onNewMessage({
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            content: newMessage.content ?? "",
            created_at: new Date(newMessage.created_at),
            sender: {
                id: newMessage.sender_id,
                username: currentUsername,
            },
            ...(uploadedImageUrl ? { image_url: uploadedImageUrl } : { image_url: null }),
            type: newMessage.type || "message",
        });

        supabase.channel(`conversation-${conversationId}`).send({
            type: "broadcast",
            event: "message",
            payload: {
                id: newMessage.id.toString(),
                conversation_id: newMessage.conversation_id.toString(),
                content: newMessage.content ?? "",
                created_at: new Date(newMessage.created_at),
                sender: {
                    id: newMessage.sender_id?.toString(),
                    username: currentUsername,
                },
                ...(uploadedImageUrl ? { image_url: uploadedImageUrl } : { image_url: null }),
                type: newMessage.type || "message",
            },
        });

        setContent("");
        setImgPreview(null);
        setFile(null);

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

    // TODO: file upload cancel button
    // TODO: allow image message with no content
    // TODO: style images in chat bubbles

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex gap-1 mt-6">
                <div className="relative flex gap-1 w-full">
                    <Input
                        name="content"
                        type="text"
                        placeholder="Type your message..."
                        className="px-4 py-6 pr-10"
                        disabled={isPending}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
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
    );
}
