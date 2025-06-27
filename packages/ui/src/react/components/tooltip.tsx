import { type ReactNode, useState } from "react";

type TooltipProps = {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
};

export const Tooltip = ({ children, content, position = "top" }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
    bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2",
    left: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
    right: "left-full top-1/2 -translate-y-1/2 translate-x-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-px",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-px rotate-180",
    left: "left-full top-1/2 -translate-y-1/2 -ml-px -rotate-90",
    right: "right-full top-1/2 -translate-y-1/2 -mr-px rotate-90",
  };

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        {children}
      </div>
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-background-surface text-text-primary text-sm px-3 py-2 rounded-lg shadow-lg border border-border-primary whitespace-nowrap">
            {content}
          </div>
          <div className={`absolute w-0 h-0 ${arrowClasses[position]}`}>
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-background-surface" />
          </div>
        </div>
      )}
    </div>
  );
};
