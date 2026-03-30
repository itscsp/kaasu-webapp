import * as React from "react";

const Logo = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => {
        return (
            <div ref={ref} className="flex flex-col items-center justify-center gap-2" {...props}>
                <span className="text-4xl font-medium text-[hsl(var(--foreground))]">₹</span>
                <span className="text-xl font-bold tracking-wide text-[hsl(var(--foreground))]">Kaasu</span>
            </div>
        );
    }
);

Logo.displayName = "Logo";

export { Logo };