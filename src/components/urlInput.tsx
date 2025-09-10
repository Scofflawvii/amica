import { DetailedHTMLProps, InputHTMLAttributes } from "react";

export function UrlInput(
  props: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
) {
  return (
    <div>
      <input
        {...props}
        type="url"
        className="input-base placeholder:text-muted/60 my-2 block w-full"
        placeholder="www.example.com"
        required
      />
    </div>
  );
}
