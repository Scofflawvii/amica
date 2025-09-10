import { useState, ButtonHTMLAttributes } from "react";
import { Switch } from "@headlessui/react";
import { clsx } from "clsx";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const SecretTextInput = ({ value, onChange }: Props) => {
  const [inputType, setInputType] = useState("password");
  const [enabled, setEnabled] = useState(false);

  return (
    <Switch.Group as="div" className="flex items-center">
      <input
        className="input-base placeholder:text-muted/60 block w-full"
        type={inputType}
        placeholder="sk-..."
        value={value}
        onChange={onChange}
        autoComplete="off"
      />

      <Switch
        checked={enabled}
        onChange={(checked: boolean) => {
          setEnabled(checked);
          setInputType(checked ? "text" : "password");
        }}
        className={clsx(
          enabled ? "bg-primary" : "bg-surface-alt/70",
          "focus-visible:ring-primary focus-visible:ring-offset-surface relative ml-2 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        )}>
        <span className="sr-only">Use setting</span>
        <span
          className={clsx(
            enabled ? "translate-x-5" : "translate-x-0",
            "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          )}>
          <span
            className={clsx(
              enabled
                ? "opacity-0 duration-100 ease-out"
                : "opacity-100 duration-200 ease-in",
              "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity",
            )}
            aria-hidden="true">
            <svg className="text-muted h-3 w-3" fill="none" viewBox="0 0 12 12">
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className={clsx(
              enabled
                ? "opacity-100 duration-200 ease-in"
                : "opacity-0 duration-100 ease-out",
              "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity",
            )}
            aria-hidden="true">
            <svg
              className="text-primary h-3 w-3"
              fill="currentColor"
              viewBox="0 0 12 12">
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </Switch>
      <Switch.Label as="span" className="ml-3 text-sm">
        <span className="font-medium whitespace-nowrap">Show Key</span>
      </Switch.Label>
    </Switch.Group>
  );
};
