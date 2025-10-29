import { useState, useRef, useEffect } from "react";

export function useTabTitle(initialTitle: string) {
    const [title, setTitle] = useState(initialTitle);
    const defaultTitleRef = useRef<string | null>(null);

    useEffect(() => {
        if (defaultTitleRef.current === null) {
            defaultTitleRef.current = document.title;
        }
        document.title = title;
    }, [title]);

    useEffect(() => {
        return () => {
            if (defaultTitleRef.current) {
                document.title = defaultTitleRef.current;
            }
        };
    }, []);

    return setTitle;
}
