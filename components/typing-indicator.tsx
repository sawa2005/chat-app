export default function TypingIndicator({ users }: { users: string[] }) {
    if (users.length === 0) return null;
    const names = users.join(", ");

    console.log(`TypingIndicator: names: ${names}, users: ${users}`);

    return (
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span>
                {names} {users.length === 1 ? "is" : "are"} typing
            </span>
            <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </span>
        </div>
    );
}
