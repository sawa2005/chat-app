"use client";

import { createClient } from "@/lib/client";
import { useState, useEffect, useRef, ChangeEvent, FormEvent, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmojiComponent from "../emoji-component";
import type { sendMessage } from "@/app/conversation/create/actions";
import { broadcastMessage } from "@/lib/broadcast";
import Image from "next/image";
import { Image as ImageIcon, X, AlertCircleIcon } from "lucide-react";
import GifComponent from "../gif-component";
import { Message } from "@/lib/types";

const supabase = createClient();

type SendMessageFormProps = {
    conversationId: string;
    currentProfileId: bigint;
    currentUsername: string;
    currentUserAvatar: string | null;
    sendMessage: typeof sendMessage;
    replyTo: bigint | null;
    setReplyTo: Dispatch<SetStateAction<bigint | null>>;
    scrollToBottom: (smooth?: boolean, force?: boolean, isImage?: boolean, imageHeight?: number) => void;
    onNewMessage: (message: Message) => void;
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
    scrollToBottom,
}: SendMessageFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [content, setContent] = useState("");
    const [imgPreview, setImgPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState<React.ReactNode | null>(null);
    const [imageHeight, setImageHeight] = useState<number | null>(null);
    const [imageWidth, setImageWidth] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const channel = useRef(supabase.channel(`conversation-${conversationId}`));
    let typingTimeout: NodeJS.Timeout | null = null;

    useEffect(() => {
        inputRef.current?.focus();
    }, [replyTo, imgPreview]);

    useEffect(() => {
        const textarea = inputRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const style = window.getComputedStyle(textarea);
            const borderTop = parseFloat(style.borderTopWidth);
            const borderBottom = parseFloat(style.borderBottomWidth);
            textarea.style.height = `${textarea.scrollHeight + borderTop + borderBottom}px`;
        }
    }, [content]);

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
            setImageWidth(img.naturalWidth);
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
            uploadedImageUrl && imageHeight && imageWidth
                ? { url: uploadedImageUrl, height: imageHeight, width: imageWidth }
                : null,
            replyTo ?? null
        );

        onNewMessage({
            ...newMessage,
            created_at: new Date(newMessage.created_at),
            edited_at: newMessage.edited_at ? new Date(newMessage.edited_at) : null,
        });

        await broadcastMessage(conversationId, {
            ...newMessage,
            sender_id: newMessage.sender.id,
            sender_username: newMessage.sender.username,
            sender_avatar: newMessage.sender.avatar,
        });

        setContent("");
        setImgPreview(null);
        setFile(null);
        setReplyTo(null);
        setImageHeight(null);
        setImageWidth(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsPending(false);
        scrollToBottom(true, true, !!uploadedImageUrl, imageHeight ?? undefined);
    }

    useEffect(() => {
        if (!isPending) {
            inputRef.current?.focus();
        }
    }, [isPending]);

    function handleUploadCancel() {
        setIsPending(false);
        setImgPreview(null);
        setFile(null);
        setUploading(false);
        setImageHeight(null);
        setImageWidth(null);
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

            <form onSubmit={handleSubmit} autoComplete="off" className="flex w-full gap-1 min-h-[54px] items-end">
                <div className="flex grow items-center gap-1">
                    <div className="relative flex grow gap-1">
                        <Textarea
                            ref={inputRef}
                            name="content"
                            placeholder="Type your message..."
                            className="px-4 py-4 pr-[106px] grow wrap-normal h-fit leading-2.5 min-h-[54px] max-h-[25vh] overflow-y-auto resize-none"
                            disabled={isPending}
                            value={content}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                } else if (e.key === "Enter" && e.shiftKey) {
                                    // Allow default behavior for Shift + Enter (newline)
                                }
                            }}
                            autoComplete="none"
                        />
                        <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            title="Attach File"
                        />

                        <div className="absolute right-3 bottom-3.5">
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

                                <GifComponent
                                    imgPreview={imgPreview}
                                    setImgPreview={setImgPreview}
                                    setImageHeight={setImageHeight}
                                    setImageWidth={setImageWidth}
                                />

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
                        <div className="w-[54px] h-[54px] overflow-hidden flex items-center rounded-md">
                            <Image
                                width={50}
                                height={30}
                                src={imgPreview}
                                alt="Preview"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    )}
                </div>
                <Button
                    type="submit"
                    className="cursor-pointer h-[54px]"
                    size={"default"}
                    disabled={isPending || uploading}
                >
                    {isPending ? "Sending..." : uploading ? "Uploading..." : "Send"}
                </Button>
            </form>
        </>
    );
}
