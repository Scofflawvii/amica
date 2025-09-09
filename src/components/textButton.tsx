import { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export const TextButton = (props: Props) => {
  return (
    <button
      {...props}
      className={`bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled rounded-lg px-4 py-2 font-bold text-white ${props.className}`}>
      {props.children}
    </button>
  );
};
