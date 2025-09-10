import { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "outline";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled text-white",
  secondary:
    "bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white",
  ghost: "bg-transparent hover:bg-primary/10 active:bg-primary/20 text-primary",
  outline:
    "border border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-press active:text-white disabled:opacity-50",
};

export const TextButton = ({
  variant = "primary",
  className,
  children,
  ...rest
}: Props) => {
  return (
    <button
      {...rest}
      className={clsx(
        "rounded-lg px-4 py-2 font-bold transition-colors",
        variantClasses[variant],
        className,
      )}>
      {children}
    </button>
  );
};
