import { createClient } from "@/utils/supabase/server";
import EditProfileForm from "@/components/edit-profile-form";

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

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    const username = profile?.username || "";

    if (profileError) {
        console.error("Error loading profile:", profileError.message);
    } else {
        console.log("Profile data:", profile);
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
