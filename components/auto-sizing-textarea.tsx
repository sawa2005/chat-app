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
    maxWidth?: number;
    imageWidth?: number;
}

export const AutoSizingTextarea = forwardRef<HTMLTextAreaElement, AutoSizingTextareaProps>(
    (
        { value, className, sizerClassName, wrapClassName, initialHeight, maxWidth, imageWidth, debug, ...props },
        ref
    ) => {
        const textAreaRef = useRef<HTMLTextAreaElement>(null);
        const sizeRef = useRef<HTMLDivElement>(null);
        const [textAreaHeight, setTextAreaHeight] = useState<number | undefined>(initialHeight);
        const [textAreaWidth, setTextAreaWidth] = useState<number | undefined>();

        useImperativeHandle(ref, () => textAreaRef.current!);

        const styles = {
            height: textAreaHeight !== undefined ? `${textAreaHeight}px` : "auto",
            width: textAreaWidth !== undefined ? `${textAreaWidth}px` : "100%",
            ...props.style,
        };

        useEffect(() => {
            console.log({ textAreaRef, sizeRef });

            if (!CSS.supports("field-sizing", "content") && textAreaRef.current && sizeRef.current) {
                const textarea = textAreaRef.current;
                const sizer = sizeRef.current;

                if (textarea && sizer && !CSS.supports("field-sizing", "content")) {
                    const textareaStyle = window.getComputedStyle(textarea);
                    const borderY = parseFloat(textareaStyle.borderTopWidth) + parseFloat(textareaStyle.borderTopWidth);

                    if (initialHeight) {
                        // Send message form needs an initial height smaller than auto
                        const targetHeight = value === "" ? initialHeight : sizer.scrollHeight + borderY;
                        setTextAreaHeight(targetHeight);
                        console.log("Setting height:", sizer.scrollHeight + borderY);
                    } else {
                        // If it's left unset the initial height is auto, bubbles need width from the textarea to wrap text
                        setTextAreaHeight(sizer.scrollHeight + borderY);
                        setTextAreaWidth(sizer.clientWidth);
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
            <div className={cn("relative", wrapClassName)}>
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
                        "top-0 left-0 pointer-events-none h-fit whitespace-pre-wrap wrap-break-word leading-normal md:text-sm",
                        debug ? "bg-red-500 opacity-35" : "invisible",
                        sizerClassName
                    )}
                    aria-hidden
                    style={{ maxWidth: maxWidth, width: imageWidth }}
                >
                    {value + "\n"}
                </div>
            </div>
        );
    }
);

AutoSizingTextarea.displayName = "AutoSizingTextarea"; // TODO: is this necessary?
