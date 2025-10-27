"use client";

import { useEffect, useState, useRef } from "react";

export function useTabTitle(initialTitle: string) {
    const [title, setTitle] = useState(initialTitle);
    const defaultTitleRef = useRef(document.title);

    useEffect(() => {
        document.title = title;

        return () => {
            document.title = defaultTitleRef.current;
        };
    }, [title]);

    return setTitle;
}
