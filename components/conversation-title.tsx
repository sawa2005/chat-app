"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { updateConversationName } from "@/app/conversation/create/actions";
import { Input } from "./ui/input";
import { Check } from "lucide-react";
import { SquarePen } from "lucide-react";
import { X } from "lucide-react";

export default function ConversationTitle({
    id,
    name,
    setName,
    initialName,
}: {
    id: string;
    name: string;
    initialName: string;
    setName: Dispatch<SetStateAction<string>>;
}) {
    const [editing, setEditing] = useState(false);
    const [existingName, setExistingName] = useState(initialName);

    async function handleSave() {
        if (/\w/.test(name)) {
            await updateConversationName(id, name);
            setExistingName(name);
            setEditing(false);
        }

        setEditing(false);
    }

    function startEditing() {
        setName("");
        setEditing(true);
    }

    function cancelEditing() {
        setName(existingName);
        setEditing(false);
    }

    return (
        <div className="flex items-end gap-2">
            {editing ? (
                <>
                    <div>
                        <p className="text-xs font-mono text-muted-foreground">/ conversation</p>
                        <Input
                            value={name}
                            placeholder={existingName}
                            onChange={(e) => setName(e.target.value)}
                            className="text-xl font-bold border-0 shadow-none p-0 h-fit md:!text-xl"
                        />
                    </div>

                    {/* Replace text in buttons with lucide icons */}
                    <button onClick={handleSave} className="text-muted-foreground hover:text-green-700 cursor-pointer">
                        <Check size={25} />
                    </button>
                    <button
                        onClick={cancelEditing}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                        <X size={25} />
                    </button>
                </>
            ) : (
                <>
                    <div>
                        <p className="text-xs font-mono text-muted-foreground">/ conversation</p>
                        <h1 className="text-xl font-bold">{name}</h1>
                    </div>
                    <button onClick={startEditing} className="text-muted-foreground hover:text-primary cursor-pointer">
                        <SquarePen size={15} className="mb-1" />
                    </button>
                </>
            )}
        </div>
    );
}
