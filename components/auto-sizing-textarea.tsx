"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";
import { useEffect, useRef, ComponentProps, useState, forwardRef, useImperativeHandle } from "react";

interface AutoSizingTextareaProps extends ComponentProps<"textarea"> {
    value: string;
    debug?: boolean;
    sizerClassName?: string;
    wrapClassName?: string;
    initialHeight?: number;
}

export const AutoSizingTextarea = forwardRef<HTMLTextAreaElement, AutoSizingTextareaProps>(
    ({ value, className, sizerClassName, wrapClassName, initialHeight, debug, ...props }, ref) => {
        const textAreaRef = useRef<HTMLTextAreaElement>(null);
        const sizeRef = useRef<HTMLDivElement>(null);
        const [textAreaHeight, setTextAreaHeight] = useState<number | undefined>(initialHeight);
        const [wrapWidth, setWrapWidth] = useState<number | undefined>();

        useImperativeHandle(ref, () => textAreaRef.current!);

        const styles = {
            height: textAreaHeight !== undefined ? `${textAreaHeight}px` : "auto",
            ...props.style,
        };

        useEffect(() => {
            console.log({ textAreaRef, sizeRef });

            if (!CSS.supports("field-sizing", "content") && textAreaRef.current && sizeRef.current) {
                const textarea = textAreaRef.current;
                const sizer = sizeRef.current;

                if (textarea && sizer && !CSS.supports("field-sizing", "content")) {
                    const style = window.getComputedStyle(textarea);
                    const paddingY = parseFloat(style.paddingTop + style.paddingBottom);

                    if (initialHeight) {
                        // Send message form needs an initial height smaller than auto
                        const targetHeight = value === "" ? initialHeight : sizer?.clientHeight;
                        setTextAreaHeight(targetHeight);
                        console.log("Setting height:", targetHeight + paddingY);
                    } else {
                        // If it's left unset the initial height is auto, bubbles need dynamic width
                        setTextAreaHeight(sizer.scrollHeight);
                        setWrapWidth(sizer.clientWidth + 1); // +1px margin for rendering diff between divs and textareas
                        console.log("Setting dimensions:", sizer.scrollHeight, sizer.clientWidth);
                    }
                }
            }
        }, [initialHeight, value]);

        if (typeof window !== "undefined" && CSS.supports("field-sizing", "content")) {
            return (
                <Textarea
                    ref={textAreaRef}
                    className={cn("field-sizing-content whitespace-pre-wrap resize-none", className)}
                    value={value}
                    {...props}
                />
            );
        }

        return (
            <div
                style={{ width: `${wrapWidth ? `${wrapWidth}px` : undefined}` }}
                className={cn("relative", wrapClassName)}
            >
                <Textarea
                    ref={textAreaRef}
                    className={cn("grow whitespace-pre-wrap overflow-y-auto resize-none", className)}
                    value={value}
                    style={styles}
                    {...props}
                />
                <div
                    ref={sizeRef}
                    className={cn(
                        "absolute block top-0 left-0 h-fit whitespace-pre-wrap text-sm",
                        debug ? "bg-red-500" : "invisible",
                        sizerClassName
                    )}
                    aria-hidden
                    style={{ maxWidth: `${wrapWidth ? `${wrapWidth}px` : undefined}` }}
                >
                    {value + "\n"}
                </div>
            </div>
        );
    }
);

AutoSizingTextarea.displayName = "AutoSizingTextarea";
