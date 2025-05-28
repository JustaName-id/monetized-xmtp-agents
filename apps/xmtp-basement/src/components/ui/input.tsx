import * as React from "react"

import { cn } from "@/utils/cn"

export interface InputProps extends React.ComponentProps<"input"> {
    rightElement?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, rightElement, ...props }, ref) => {
        return (
            <div
                className={cn(
                    "flex h-9 w-full items-center rounded-md border border-input bg-transparent text-base shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring md:text-sm",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    className
                )}
            >
                <input
                    type={type}
                    className={cn(
                        "h-full flex-grow bg-transparent px-3 py-1 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                        rightElement ? "pr-0" : "",
                    )}
                    ref={ref}
                    {...props}
                />
                {rightElement && (
                    <div className="flex h-full shrink-0 items-center justify-center px-3">
                        {rightElement}
                    </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
