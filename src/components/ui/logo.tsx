import * as React from "react";

const Logo = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => {
        return (
            <div ref={ref} className="flex items-center justify-center" {...props}>
                <img
                    src="/kaas-logo.png"
                    alt="Kaas"
                    className="h-12 w-auto object-contain"
                />
            </div>
        );
    }
);

Logo.displayName = "Logo";

export { Logo };