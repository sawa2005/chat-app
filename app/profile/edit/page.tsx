import { createClient } from "@/utils/supabase/server";
import EditProfileForm from "@/components/edit-profile-form";
import { prisma } from "@/lib/prisma";
import { getUsername } from "@/app/login/actions";

// TODO: redirect causes error in profile edit.

export default async function EditProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("No user found:", userError?.message);
        return <div className="p-5">Error loading user data.</div>;
    }

    const profile = await prisma.profiles.findUnique({
        where: { user_id: user.id },
    });

    if (!profile) {
        console.error("No profile found for user ID:", user.id);
        return <div className="p-5">Error loading profile data.</div>;
    }

    const username = await getUsername(user.id);

    if (username === null) {
        console.error("No username found for user ID:", user.id);
        return <div className="p-5">Error loading profile data.</div>;
    }

    const currentUserEmail = user.email; // Assuming password is available, which it typically isn't for security reasons

    return (
        <EditProfileForm
            profile={profile}
            userEmail={currentUserEmail || undefined}
            userId={user.id}
            oldUsername={username}
        />
    );
}
