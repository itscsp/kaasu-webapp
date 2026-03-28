import * as React from "react";

const Logo = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
    (props, ref) => {
        return (
            <svg
                ref={ref}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 500 100"
                width="100%"
                height="100%"
                {...props}
            >
                <title>Kaasu Logo</title>
                <defs>
                    <style>
                        {`
                            .logo-text {
                                font-size: 72px;
                                font-weight: 700;
                                fill: #24B0A5;
                                letter-spacing: -4px;
                            }
                        `}
                    </style>
                </defs>
                <text
                    x="50%"
                    y="55%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    className="logo-text"
                >
                    kaasu
                </text>
            </svg>
        );
    }
);

Logo.displayName = "Logo";

export { Logo };