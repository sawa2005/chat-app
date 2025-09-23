export type Message = {
    id: bigint;
    conversation_id: string;
    content: string;
    created_at: Date;
    edited_at: Date | null;
    image_url: string | null;
    type: string;
    deleted: boolean;
    parent_id: bigint | null;
    sender: {
        id: bigint | null;
        username: string;
        avatar: string | null;
    } | null;
    messages: {
        id: bigint;
        content: string | null;
        image_url: string | null;
        sender: { id: bigint; username: string; avatar: string | null } | null;
    } | null;
};

export type Member = {
    id: bigint;
    username: string;
    avatar: string | null;
};
