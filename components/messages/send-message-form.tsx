"use client";

import { createClient } from "@/lib/client";
import { useState, useEffect, useRef, ChangeEvent, FormEvent, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmojiComponent from "../emoji-component";
import type { sendMessage } from "@/app/conversation/create/actions";
import { broadcastMessage } from "@/lib/broadcast";
import Image from "next/image";
import { Image as ImageIcon, X, AlertCircleIcon } from "lucide-react";
import GifComponent from "../gif-component";

const supabase = createClient();

type SendMessageFormProps = {
    conversationId: string;
    currentProfileId: bigint;
    currentUsername: string;
    currentUserAvatar: string | null;
    sendMessage: typeof sendMessage;
    replyTo: bigint | null;
    setReplyTo: Dispatch<SetStateAction<bigint | null>>;
    setFirstUnreadIndex: Dispatch<SetStateAction<number | null>>;
    scrollToBottom: (smooth?: boolean, force?: boolean, isImage?: boolean, imageHeight?: number) => void;
    onNewMessage: (message: {
        id: bigint;
        conversation_id: string;
        content: string;
        created_at: Date;
        edited_at: Date | null;
        sender: {
            id: bigint | null;
            username: string;
            avatar: string | null;
        };
        image_url: string | null;
        type: string;
        deleted: boolean;
        parent_id: bigint | null;
        messages: {
            id: bigint;
            content: string | null;
            image_url: string | null;
            sender: {
                id: bigint;
                username: string;
                avatar: string | null;
            } | null;
        } | null;
        message_reactions:
            | {
                  id: bigint;
                  emoji: string;
                  created_at: Date;
                  profile_id: bigint;
                  message_id: bigint;
              }[]
            | null;
        message_reads: { profile_id: bigint }[];
    }) => void;
};

export default function SendMessageForm({
    conversationId,
    currentProfileId,
    currentUsername,
    currentUserAvatar,
    sendMessage,
    onNewMessage,
    replyTo,
    setReplyTo,
    setFirstUnreadIndex,
    scrollToBottom,
}: SendMessageFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [content, setContent] = useState("");
    const [imgPreview, setImgPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<React.ReactNode | null>(null);
    const [imageHeight, setImageHeight] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const channel = useRef(supabase.channel(`conversation-${conversationId}`));
    let typingTimeout: NodeJS.Timeout | null = null;

    useEffect(() => {
        inputRef.current?.focus();
    }, [replyTo, imgPreview]);

    function showAlert(message: React.ReactNode) {
        setAlert(message);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            setAlert(null);
        }, 3000);
    }

    function handleInputChange(value: string | React.ChangeEvent<HTMLInputElement>) {
        const newValue = typeof value === "string" ? value : value.target.value;
        setContent(newValue);

        if (!typingTimeout) {
            channel.current.send({
                type: "broadcast",
                event: "user_typing",
                payload: { username: currentUsername },
            });
            typingTimeout = setTimeout(() => {
                typingTimeout = null;
            }, 2000);
        }
    }

    function handleIconClick() {
        fileInputRef.current?.click();
    }

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const uploadedFile = e.target.files?.[0];
        setFile(uploadedFile ?? null);
        if (!uploadedFile) return;

        console.log("Selected file type:", uploadedFile.type);

        if (!uploadedFile.type.startsWith("image/")) {
            console.log("File type incorrect.");
            showAlert(
                <Alert className="absolute animate-fade z-50 bottom-0" variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>Invalid file type.</AlertTitle>
                    <AlertDescription>
                        <p>Only images are allowed for upload.</p>
                    </AlertDescription>
                </Alert>
            );
            return;
        }

        const objectUrl = URL.createObjectURL(uploadedFile);
        const img = new window.Image();
        img.onload = () => {
            setImageHeight(img.naturalHeight);
        };
        img.src = objectUrl;
        setImgPreview(objectUrl);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!content.trim() && !file && !imgPreview) return;

        let uploadedImageUrl: string | null = null;

        // If a gif is chosen just set the URL
        if (imgPreview && !file) {
            uploadedImageUrl = imgPreview;
        }

        // Upload file if an image is uploaded
        if (file) {
            setUploading(true);
            const fileExt = file.name.split(".").pop();
            const fileName = `${currentProfileId}-${Date.now()}.${fileExt}`;
            const filePath = `messages/${fileName}`;

            const { error } = await supabase.storage.from("chat-uploads").upload(filePath, file);

            if (error) {
                setUploading(false);
                console.error("Upload error:", error);
                return;
            }

            const { data: publicData } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);
            uploadedImageUrl = publicData.publicUrl;
            setUploading(false);
        }

        setIsPending(true);
        const newMessage = await sendMessage(
            conversationId,
            currentProfileId,
            currentUsername,
            currentUserAvatar,
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
                avatar: newMessage.sender.avatar,
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
                                avatar: newMessage.messages.sender.avatar,
                            }
                          : null,
                  }
                : null,
            message_reactions: null,
            message_reads: [],
        });

        await broadcastMessage(
            conversationId,
            {
                ...newMessage,
                sender_id: newMessage.sender.id,
                sender_username: newMessage.sender.username,
                sender_avatar: newMessage.sender.avatar,
            },
            uploadedImageUrl
        );

        setContent("");
        setImgPreview(null);
        setFile(null);
        setReplyTo(null);
        setFirstUnreadIndex(null);
        setImageHeight(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.focus();
        }
        setIsPending(false);
        requestAnimationFrame(() => {
            scrollToBottom(true, true, !!uploadedImageUrl, imageHeight ?? undefined);
        });
    }

    function handleUploadCancel() {
        setIsPending(false);
        setImgPreview(null);
        setFile(null);
        setUploading(false);
        setImageHeight(null);
    }

    return (
        <>
            <div className="relative">{alert ?? null}</div>
            {replyTo && (
                <div className="flex items-center font-mono text-xs text-muted-foreground">
                    replying to message #{replyTo.toString()}
                    <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="text-muted-foreground hover:text-primary cursor-pointer ml-auto"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
                <div className="flex gap-1">
                    <div className="relative flex gap-1 w-full">
                        <Input
                            ref={inputRef}
                            name="content"
                            type="text"
                            placeholder="Type your message..."
                            className="px-4 py-6 pr-18 w-full"
                            disabled={isPending}
                            value={content}
                            onChange={handleInputChange}
                            autoComplete="none"
                        />
                        <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="flex gap-3 items-center">
                                {/* Emoji picker that stays open if Shift is held */}
                                <EmojiComponent
                                    onEmojiSelect={(emoji) => {
                                        const inputEl = inputRef.current;
                                        if (!inputEl) return;

                                        const start = inputEl.selectionStart ?? content.length;
                                        const end = inputEl.selectionEnd ?? content.length;
                                        const newContent = content.slice(0, start) + emoji + content.slice(end);

                                        // Update input value immediately
                                        handleInputChange(newContent);

                                        // Conditionally focus input AFTER emoji insertion if Shift is NOT held
                                        const shiftHeld = window.event instanceof MouseEvent && window.event.shiftKey;
                                        if (!shiftHeld) {
                                            requestAnimationFrame(() => {
                                                const cursorPos = start + emoji.length;
                                                inputEl.selectionStart = inputEl.selectionEnd = cursorPos;
                                                inputEl.focus({ preventScroll: true });
                                            });
                                        }
                                    }}
                                    closeOnSelect={true}
                                />

                                <GifComponent imgPreview={imgPreview} setImgPreview={setImgPreview} />

                                <button
                                    type="button"
                                    onClick={imgPreview ? handleUploadCancel : handleIconClick}
                                    className="text-muted-foreground hover:text-primary cursor-pointer"
                                >
                                    {imgPreview ? <X size={20} /> : <ImageIcon size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {imgPreview && (
                        <div className="max-w-[50px] max-h-[50px] overflow-hidden flex items-center rounded-md">
                            <Image
                                width={50}
                                height={30}
                                src={imgPreview}
                                alt="Preview"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    )}

                    <Button type="submit" className="cursor-pointer py-6" disabled={isPending || uploading}>
                        {isPending ? "Sending..." : uploading ? "Uploading..." : "Send"}
                    </Button>
                </div>
            </form>
        </>
    );
}
