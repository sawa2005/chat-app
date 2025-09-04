import Image from "next/image";

interface AvatarProps {
    size: number;
    avatarUrl: string | null;
    username: string;
}

export default function Avatar({ size, avatarUrl, username }: AvatarProps) {
    return (
        <Image
            src={avatarUrl || `https://api.dicebear.com/9.x/identicon/jpg?seed=${encodeURIComponent(username)}`}
            alt="User Avatar"
            className="mt-2 w-24 h-24 rounded-full object-cover"
            width={size}
            height={size}
        />
    );
}
