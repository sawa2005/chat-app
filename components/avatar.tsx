import Image from "next/image";
import { createClient } from "@/lib/client";

interface AvatarProps {
    size: number;
    avatarUrl: string | null;
    username: string;
}

export default function Avatar({ size, avatarUrl, username }: AvatarProps) {
    const supabase = createClient();
    let publicUrl = "";

    if (avatarUrl) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(avatarUrl);
        publicUrl = data.publicUrl;
    }

    return (
        <Image
            src={publicUrl || `https://api.dicebear.com/9.x/identicon/jpg?seed=${encodeURIComponent(username)}`}
            alt="User Avatar"
            className="rounded-full object-cover"
            width={size}
            height={size}
            title={username}
        />
    );
}
