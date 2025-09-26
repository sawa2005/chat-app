import { Reaction } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";
import { getUsernameList } from "@/app/conversation/create/actions";

function aggregateReactions(reactions: Reaction[], currentProfileId: bigint) {
    const reactionMap: { [emoji: string]: { count: number; reacted: boolean; profile_ids: bigint[] } } = {};
    reactions.forEach((r) => {
        console.log("reaction:", r);

        if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, reacted: false, profile_ids: [] };

        reactionMap[r.emoji].count += 1;
        reactionMap[r.emoji].profile_ids.push(r.profile_id);
        if (r.profile_id === currentProfileId) reactionMap[r.emoji].reacted = true;
    });

    const result = Object.entries(reactionMap).map(([emoji, data]) => ({ emoji, ...data }));

    console.log("aggregated reactions:", result);
    return result;
}

export function ReactionBar({
    reactionData,
    onToggle,
    isOwner,
    currentProfileId,
}: {
    reactionData: Reaction[];
    onToggle: (emoji: string) => void;
    isOwner: boolean;
    currentProfileId: bigint;
}) {
    // TODO: order reactions by count on realtime if possible.

    type UsernamesMap = Record<string, string[]>;

    const [usernames, setUsernames] = React.useState<UsernamesMap>({});
    const [loading, setLoading] = React.useState<Record<string, boolean>>({});

    const reactions = React.useMemo(
        () => aggregateReactions(reactionData, currentProfileId),
        [reactionData, currentProfileId]
    ).sort((a, b) => b.count - a.count);

    async function handleHover(emoji: string, profileIds: bigint[]) {
        if (usernames[emoji] || loading[emoji]) return;

        setLoading((prev) => ({ ...prev, [emoji]: true }));

        const fetched = await getUsernameList([...new Set(profileIds)]);
        setUsernames((prev) => ({ ...prev, [emoji]: profileIds.map((id) => fetched[id.toString()] ?? "Unknown") }));
        setLoading((prev) => ({ ...prev, [emoji]: false }));
    }

    if (reactions.length === 0) return null;

    return (
        <div className={`flex gap-1 mb-2 flex-wrap max-w-full ${isOwner ? "justify-end" : "justify-start"}`}>
            {reactions.map((r) => (
                <Tooltip key={r.emoji}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => onToggle(r.emoji)}
                            onMouseEnter={() => handleHover(r.emoji, r.profile_ids)}
                            className={`cursor-pointer flex items-center gap-1 rounded-full px-2 py-0.5 text-sm
                            border transition
                            ${r.reacted ? "bg-accent border-accent-foreground" : "border-gray-300"}`}
                        >
                            <span>{r.emoji}</span>
                            <span className="text-xs">{r.count}</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="font-sans">
                        {loading[r.emoji] ? "Loading..." : usernames[r.emoji]?.join(", ") ?? "No reactions"}
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}
