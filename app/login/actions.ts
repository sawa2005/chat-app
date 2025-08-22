"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
    const supabase = await createClient();

    // type-casting here for convenience
    // in practice, you should validate your inputs
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
