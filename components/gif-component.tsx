import GifPicker, { Theme as GifPickerTheme } from "gif-picker-react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { ScanSearch } from "lucide-react";
import { useTheme } from "next-themes";

interface TenorImage {
    id: string;
    title: string;
    url: string;
    media: Array<{
        gif: { url: string; dims: [number, number]; size: string };
        mediumgif?: { url: string; dims: [number, number]; size: string };
        mp4: { url: string; dims: [number, number]; size: string };
    }>;
}

interface GifComponentProps {
    imgPreview: string | null;
    setImgPreview: Dispatch<SetStateAction<string | null>>;
}

export default function GifComponent({ imgPreview, setImgPreview }: GifComponentProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, systemTheme } = useTheme();

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    const pickerTheme = currentTheme === "dark" ? GifPickerTheme.DARK : GifPickerTheme.LIGHT;

    return (
        <div id="gif-component" className={imgPreview ? "hidden" : "block h-[20px]"}>
            <Popover onOpenChange={setIsOpen} open={isOpen}>
                <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary cursor-pointer">
                        <ScanSearch size={20} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0 m-5 will-change-transform will-change-opacity">
                    <GifPicker
                        theme={pickerTheme}
                        onGifClick={(gif) => {
                            setImgPreview(null);
                            const url = gif.url;
                            console.log("TenorImage:", gif);
                            setImgPreview(url);
                        }}
                        tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY ?? ""}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
