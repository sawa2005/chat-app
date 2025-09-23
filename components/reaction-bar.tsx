import { Reaction } from "@/lib/types";

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
    // TODO: show profiles who reacted on hover in a shadcn/ui tooltip

    function aggregateReactions(reactions: Reaction[]) {
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

    const reactions = aggregateReactions(reactionData);
    if (reactions.length === 0) return null;

    return (
        <div className={`flex gap-1 mb-2 ${isOwner ? "justify-end" : "justify-start"}`}>
            {reactions.map((r) => (
                <button
                    key={r.emoji}
                    onClick={() => onToggle(r.emoji)}
                    className={`cursor-pointer flex items-center gap-1 rounded-full px-2 py-0.5 text-sm
                      border transition
                      ${r.reacted ? "bg-accent border-accent-foreground" : "border-gray-300"}`}
                    title={`${r.count} reaction${r.count > 1 ? "s" : ""}`}
                >
                    <span>{r.emoji}</span>
                    <span className="text-xs">{r.count}</span>
                </button>
            ))}
        </div>
    );
}
