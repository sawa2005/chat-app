"use client";

import { useTheme } from "next-themes";

export function ThemeToggleButton() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            className="px-3 py-1 rounded-md border text-sm cursor-pointer"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
            Toggle Theme
        </button>
    );
}
