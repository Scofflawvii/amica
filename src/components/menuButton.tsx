import * as React from "react";
import { useId } from "react";
import clsx from "clsx";

export function MenuButton({
  icon,
  onClick,
  large,
  label,
  ariaLabel,
  href,
  target,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onClick?: () => void;
  large: boolean;
  label: string; // visual semantic label
  ariaLabel?: string; // optional explicit accessible name
  href?: string;
  target?: string;
  disabled?: boolean;
}) {
  const Icon = icon; // Capitalize to use as component
  const labelId = useId();

  if (href) {
    onClick = () => {
      window.open(href, target);
    };
  }

  return (
    <div
      className="flex flex-row items-center space-x-2"
      data-sentry-component="MenuButton">
      <button
        disabled={disabled}
        onClick={onClick}
        // Provide both aria-label and aria-labelledby for robustness; some tooling has issues with visually-hidden text only.
        aria-label={ariaLabel || label}
        aria-labelledby={labelId}
        className={clsx(
          "focus-visible:outline-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        )}>
        <Icon
          className={clsx(
            large ? "h-14 w-14" : "h-7 w-7",
            "text-white",
            disabled && "cursor-not-allowed opacity-20",
            !disabled &&
              // Use standard opacity scale (90 ~ 0.9) rather than a non-existent opacity-85 class.
              "opacity-90 hover:cursor-pointer hover:opacity-100 active:opacity-100",
          )}
          aria-hidden={true}
        />
        <span id={labelId} className="sr-only">
          {ariaLabel || label}
        </span>
      </button>
    </div>
  );
}
