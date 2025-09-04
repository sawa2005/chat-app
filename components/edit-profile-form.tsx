"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, checkUsernameAvailability } from "@/app/login/actions";
import { useEffect, useState } from "react";
import AvatarUpload from "./avatar-upload";

// Profile properties
interface Profile {
    id: bigint;
    created_at: Date;
    user_id: string | null;
    username: string;
    avatar: string | null;
    display_name: string | null;
}

// Properties for the EditProfileForm component
interface Props {
    profile: Profile;
    userEmail: string | undefined;
    userId: string;
    oldUsername?: string;
}

export default function EditProfileForm({ profile, userEmail, userId, oldUsername }: Props) {
    const [username, setUsername] = useState(profile.username || "");
    const [displayName, setDisplayName] = useState(profile.display_name || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(false);
    const [normalizedValue, setNormalizedValue] = useState(username.trim().toLowerCase());
    const [normalizedOld, setNormalizedOld] = useState(oldUsername ? oldUsername.trim().toLowerCase() : undefined);
    const [messagesVisible, setMessagesVisible] = useState(true);
    let checkTimeout: NodeJS.Timeout;
    let lastCheckedValue = "";

    const validateUsername = (value: string) => {
        const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
        if (!usernameRegex.test(value)) {
            return "Username must be 4-20 characters long and can only contain letters, numbers, and underscores.";
        } else if (/[A-Z]/.test(value)) {
            return "Username must be lowercase.";
        }

        return null;
    };

    const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = (e.target as HTMLInputElement).value;
        setNormalizedValue(value.trim().toLowerCase());
        setNormalizedOld(oldUsername ? oldUsername.trim().toLowerCase() : undefined);

        setUsername(value);

        // If input is empty, hide all messages
        if (!value || value.trim() === "") {
            setMessagesVisible(false);
            return;
        }

        const validationError = validateUsername(value);
        setError(validationError);
        if (validationError) {
            setMessagesVisible(true);
            setIsAvailable(null);
            return;
        }

        if (checkTimeout) clearTimeout(checkTimeout);

        checkTimeout = setTimeout(async () => {
            lastCheckedValue = normalizedValue;
            setChecking(true);
            setMessagesVisible(true);
            try {
                const result = await checkUsernameAvailability(value, userId);
                if (lastCheckedValue === normalizedValue) {
                    setIsAvailable(result ? result.available : false);
                    if (result && !result.available) setError("Username is already taken.");
                }
            } catch (err) {
                if (lastCheckedValue === normalizedValue) {
                    console.error("Error checking username availability:", err);
                    setError("Error checking username availability.");
                    setIsAvailable(false);
                }
            } finally {
                if (lastCheckedValue !== normalizedValue) {
                    setChecking(false);
                    setIsAvailable(null);
                } else {
                    setChecking(false);
                }
            }
        }, 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateUsername(username);
        if (validationError) {
            setError(validationError);
            return;
        }

        const formData = new FormData(e.currentTarget as HTMLFormElement);

        if (avatarFile) {
            formData.append("avatar", avatarFile, avatarFile.name);
        }

        await updateProfile(formData);
    };

    const isDisabled = !!error;

    // Clear messages if input is cleared or matches original username
    useEffect(() => {
        if (normalizedValue === "") {
            setMessagesVisible(false);
            setError(null);
            return;
        }

        if (normalizedValue === normalizedOld && isAvailable !== null) {
            setMessagesVisible(false);
            setError(null);
            return;
        }
    }, [checking, normalizedOld, normalizedValue, isAvailable]);

    return (
        <form
            onSubmit={handleSubmit}
            className="font-sans flex flex-col gap-5 p-5 max-w-md m-auto mt-10"
            method="post"
            encType="multipart/form-data"
        >
            <input type="hidden" name="user_id" value={userId} />
            <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled value={userEmail} />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required disabled value={".................."} />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="username">Username</Label>
                <p className="text-xs font-mono text-muted-foreground">/ same as email by default</p>
                <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder={username}
                    required
                    value={username}
                    onChange={handleUsernameChange}
                />
                {messagesVisible && (
                    <>
                        {checking && <p className="text-sm text-blue-500">Checking availability...</p>}
                        {!checking && error && <p className="text-sm text-red-500">{error}</p>}
                        {!checking && isAvailable && !error && (
                            <p className="text-sm text-green-500">Username is available!</p>
                        )}
                    </>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                    id="display-name"
                    name="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
            </div>
            <AvatarUpload username={username} onAvatarReady={setAvatarFile} existingAvatarUrl={profile.avatar} />
            <Button className="cursor-pointer" type="submit" disabled={isDisabled}>
                Update Profile
            </Button>
        </form>
    );
}
