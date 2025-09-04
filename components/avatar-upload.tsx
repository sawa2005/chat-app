"use client";

import { ChangeEvent, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { getCroppedImg } from "@/utils/crop-image";
import Avatar from "./avatar";
import { Check } from "lucide-react";

interface AvatarUploadProps {
    username: string;
    onAvatarReady: (file: File | null) => void;
    existingAvatarUrl: string | null;
}

export default function AvatarUpload({ username, onAvatarReady, existingAvatarUrl }: AvatarUploadProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(existingAvatarUrl);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

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
        <div className="flex flex-col gap-1 border-1 rounded-md px-4 py-2 shadow-xs">
            <div className="flex gap-5 items-center">
                <div>
                    <Label htmlFor="avatar">Avatar</Label>
                    <p className="text-xs font-mono text-muted-foreground mb-3">/ upload your avatar image</p>
                    <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file:font-sans file:font-semibold file:text-md!important file:mr-3 file:text-black font-mono text-sm text-muted-foreground cursor-pointer file:cursor-pointer"
                    />
                </div>

                <Avatar size={100} avatarUrl={avatarUrl} username={username} />
            </div>
            {imageSrc && (
                <div className="w-full flex justify-center my-3">
                    <div className="relative w-64 h-64 bg-gray-200 rounded-xl overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={(_, croppedAreaPixels) => setCroppedArea(croppedAreaPixels)}
                            onZoomChange={setZoom}
                            cropShape={"round"}
                        />
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="absolute bottom-2 right-2 bg-green-800 border-1 border-white cursor-pointer"
                        >
                            <Check className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
