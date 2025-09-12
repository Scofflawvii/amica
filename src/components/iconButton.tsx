import { KnownIconType } from "@charcoal-ui/icons";
import { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName: keyof KnownIconType;
  isProcessing: boolean;
  label?: string;
};

export const IconButton = ({
  iconName,
  isProcessing,
  label,
  ...rest
}: Props) => {
  const accessibleLabel = label || iconName.replace(/[-_/]/g, " ");
  return (
    <button
      {...rest}
      aria-label={rest["aria-label"] || accessibleLabel}
      className={`bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled mr-2 inline-flex items-center rounded-lg p-1 text-center text-sm text-white ${rest.className} `}>
      {isProcessing ? (
        <pixiv-icon name={"24/Dot"} scale="1"></pixiv-icon>
      ) : (
        <pixiv-icon name={iconName} scale="1"></pixiv-icon>
      )}
      {label && <div className="mx-2 font-bold">{label}</div>}
    </button>
  );
};
