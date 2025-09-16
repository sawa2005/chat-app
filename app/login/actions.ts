"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import { createClient } from "@/utils/supabase/server";

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

    // TODO: Input validation
    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        console.error("Login error:", error);
        // Redirect to error page if login fails
        redirect("/error");
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { data: signupData, error: signupError } = await supabase.auth.signUp(data);

    if (signupError) {
        console.error("Signup error:", signupError);
    }

    if (signupData?.user) {
        await prisma.profiles.upsert({
            where: { user_id: signupData.user?.id },
            update: { username: signupData.user?.email },
            create: { user_id: signupData.user?.id, username: signupData.user?.email },
        });
    }

    // If email confirmation is required, Supabase won't log the user in
    if (signupData?.user && !signupData.session && signupData.user.email !== undefined) {
        console.log("Confirmation email sent to:", signupData.user.email);
        redirect("/confirm?email=" + encodeURIComponent(signupData.user.email));
    }

    revalidatePath("/", "layout");
    redirect("/");
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

    const username = formData.get("username") as string;
    const display_name = formData.get("display-name") as string;
    const avatarFile = formData.get("avatar") as File;

    let avatar_url: string | null = null;

    if (avatarFile && avatarFile.size > 0) {
        const filePath = `avatars/${avatarFile.name}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile, { contentType: "image/jpeg", upsert: true });

        if (uploadError) {
            console.error("Avatar upload error:", uploadError);
        } else {
            avatar_url = filePath;
        }
    }

    const updates: { username?: string; display_name?: string | null; avatar?: string | null } = {};
    if (username) updates.username = username;
    if (display_name !== null) updates.display_name = display_name;
    if (avatar_url !== null) updates.avatar = avatar_url;

    try {
        await prisma.profiles.update({
            where: { user_id: user.id },
            data: updates,
        });

        /* revalidatePath("/profile", "page");
        redirect("/profile"); */

        redirect("/profile/edit");
    } catch (error) {
        console.error("Profile update error:", error);
    }
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
