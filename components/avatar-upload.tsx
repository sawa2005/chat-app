"use client";

import { ChangeEvent, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { getCroppedImg } from "@/utils/crop-image";
import { updateProfile } from "@/app/login/actions";

interface AvatarUploadProps {
    username: string;
    onAvatarReady: (file: File | null) => void;
}

export default function AvatarUpload({ username, onAvatarReady }: AvatarUploadProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] ?? null;
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedArea) return;

        const blob = await getCroppedImg(imageSrc, croppedArea);
        const file = new File([blob], `${username}.jpg`, { type: "image/jpeg" });

        setAvatarUrl(URL.createObjectURL(file));
        onAvatarReady(file);

        setImageSrc(null);
    };

    return (
        <div className="flex flex-col gap-1">
            <Label htmlFor="avatar">Avatar</Label>
            <p className="text-xs font-mono text-muted-foreground">/ upload your avatar image</p>
            <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file:font-sans file:font-semibold file:text-md!important file:mr-3 file:text-black font-mono text-sm text-muted-foreground"
            />

            {imageSrc && (
                <div className="relative w-64 h-64 bg-gray-200">
                    <Cropper
                        image={imageSrc}
                        crop={{ x: 0, y: 0 }}
                        zoom={1}
                        aspect={1}
                        onCropChange={() => {}}
                        onCropComplete={(_, croppedAreaPixels) => setCroppedArea(croppedAreaPixels)}
                        onZoomChange={() => {}}
                    />
                    <button
                        type="button"
                        onClick={handleSave}
                        className="absolute bottom-2 left-2 bg-blue-500 text-white px-3 py-1 rounded"
                    >
                        Save Avatar
                    </button>
                </div>
            )}

            {avatarUrl && (
                <Image
                    src={avatarUrl}
                    alt="User Avatar"
                    className="mt-2 w-24 h-24 rounded-full object-cover"
                    width={100}
                    height={100}
                />
            )}
        </div>
    );
}
