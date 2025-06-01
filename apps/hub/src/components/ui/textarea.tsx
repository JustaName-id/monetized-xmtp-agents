import * as React from "react"

import { cn } from "@/utils/cn"

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentProps<"textarea">
>(({ className, onChange, value, ...props }, forwardedRef) => {
    const localTextareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(forwardedRef, () => localTextareaRef.current!, []);

    const adjustHeight = React.useCallback(() => {
        if (localTextareaRef.current) {
            localTextareaRef.current.style.height = "auto";
            const scrollHeight = localTextareaRef.current.scrollHeight;
            localTextareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, []);

    React.useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight();
        if (onChange) {
            onChange(event);
        }
    };

    return (
        <textarea
            ref={localTextareaRef}
            className={cn(
                "flex min-h-[40px] max-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden",
                className
            )}
            rows={1}
            onChange={handleInputChange}
            value={value}
            {...props}
        />
    )
})
Textarea.displayName = "Textarea"

export { Textarea }
