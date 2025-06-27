import { memo, useMemo } from "react";

type LoadingSpinnerProps = {
  size?: "small" | "medium" | "large";
  className?: string;
};

export const LoadingSpinner = memo(({ size = "medium", className = "" }: LoadingSpinnerProps) => {
  const sizeClasses = useMemo(
    () => ({
      small: "w-4 h-4",
      medium: "w-6 h-6",
      large: "w-8 h-8",
    }),
    [],
  );

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading spinner"
    >
      <title>Loading spinner</title>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";
