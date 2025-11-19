"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import { createClient } from "@/lib/server";

export async function getAvatarUrlById(senderId: bigint | null): Promise<string | null> {
    if (senderId === null) {
        console.log("Get Avatar: Sender ID can not be null");
        return null;
    }

    const profile = await prisma.profiles.findUnique({
        where: { id: senderId },
        select: { avatar: true },
    });

    return profile?.avatar ?? null;
}

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        console.error("Login error:", error);
        return error;
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirm: formData.get("confirm") as string,
    };

    if (data.password !== data.confirm) {
        return;
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp(data);

    if (signupError) {
        console.error("Signup error:", signupError);
        return;
    }

    /* // Mocked signup data for testing
    const signupError = null;
    const signupData = {
        user: {
            id: "mock-user-id-123",
            email: data.email,
        },
        session: null, // null = confirmation required
    }; */

    if (signupData?.user) {
        await prisma.profiles.upsert({
            where: { user_id: signupData.user?.id },
            update: { username: signupData.user?.email },
            create: { user_id: signupData.user?.id, username: signupData.user?.email },
        });
    }

    // Handle confirmation required flow (this is what you’re testing)
    if (signupData?.user && !signupData.session && signupData.user.email !== undefined) {
        console.log("Confirmation email sent to:", signupData.user.email);

        // redirect("/confirm?email=" + encodeURIComponent(signupData.user.email));

        return {
            success: true,
            confirmationNeeded: true,
            email: signupData.user.email,
        };
    }

    // Normal signup success (if confirmation isn’t required)
    revalidatePath("/", "layout");

    // redirect("/");

    return {
        success: true,
        confirmationNeeded: false,
    };
}

export async function logout() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
        // Redirect to error page if logout fails
        redirect("/error");
    }

    revalidatePath("/", "layout");
    redirect("/login");
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("No user found:", userError?.message);
        redirect("/login");
    }

    const profile = await prisma.profiles.findUnique({
        where: { user_id: user.id },
    });

    if (!profile) {
        console.error("No profile found for user id:", user.id);
        return;
    }

    const username = formData.get("username") as string;
    const display_name = formData.get("display-name") as string;
    const avatarFile = formData.get("avatar") as File;

    let avatar_url: string | null = profile.avatar ?? null;

    if (avatarFile && avatarFile.size > 0) {
        const ext = avatarFile.name.split(".").pop() ?? "png";
        const filename = `avatar-${Date.now()}.${ext}`;
        const filePath = `${profile.id.toString()}/${filename}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile, { contentType: avatarFile.type, upsert: true });

        if (uploadError) {
            console.error("Avatar upload error:", uploadError);
        } else {
            if (profile.avatar && profile.avatar !== filePath) {
                const { error: removeError } = await supabase.storage.from("avatars").remove([profile.avatar]);
                if (removeError) {
                    console.error("Failed to remove old avatar:", removeError);
                }
            }
            avatar_url = filePath;
        }
    }

    const updates: { username?: string; display_name?: string | null; avatar?: string | null } = {};
    if (username) updates.username = username;
    if (display_name !== null) updates.display_name = display_name;
    if (avatar_url !== null) updates.avatar = avatar_url;

    try {
        const result = await prisma.profiles.update({
            where: { user_id: user.id },
            data: updates,
        });

        console.log("Profile update successful:", result);

        return result;
    } catch (error) {
        console.error("Profile update error:", error);
    }

    redirect("/profile/edit");
}

export async function checkUsernameAvailability(
    username: string,
    currentUserId?: string
): Promise<{ available: boolean } | false> {
    if (!username) return false;

    const existingProfile = await prisma.profiles.findUnique({
        where: { username, NOT: currentUserId ? { user_id: currentUserId } : undefined },
    });

    return { available: !existingProfile };
}

export async function getUsername(userId: string): Promise<string | null> {
    try {
        const profile = await prisma.profiles.findUnique({
            where: { user_id: userId },
        });

        return profile?.username || null;
    } catch (error) {
        console.error("Error fetching username:", error);
        return null;
    }
}

export async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user ? user.id : null;
}

export async function getCurrentProfileId() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await prisma.profiles.findUnique({
        where: { user_id: user.id },
    });

    return profile ? profile.id : null;
}
