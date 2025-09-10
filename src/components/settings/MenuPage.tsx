import { useTranslation } from "react-i18next";
import { clsx } from "clsx";

import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { Link, pagesToLinks } from "./common";

export function MenuPage({
  keys,
  menuClick,
}: {
  keys: string[];
  menuClick: (link: Link) => void;
}) {
  const { t } = useTranslation();

  const links = pagesToLinks(keys);
  return (
    <ul role="list" className="divide-border/40 panel divide-y">
      {links.map((link) => (
        <li
          key={link.key}
          className="hover:bg-surface-alt/60 relative flex cursor-pointer items-center space-x-4 rounded-lg p-4 py-4 transition-all"
          onClick={() => {
            menuClick(link);
          }}>
          <div className="min-w-0 flex-auto">
            <div className="flex items-center gap-x-3">
              <h2 className="min-w-0 text-sm leading-6 font-semibold">
                <span
                  className={clsx(
                    "flex w-0 flex-1 items-center gap-x-2 whitespace-nowrap",
                    link.className,
                  )}>
                  {link.icon}
                  {t(link.label)}
                </span>
              </h2>
            </div>
          </div>
          <ChevronRightIcon
            className="text-muted h-5 w-5 flex-none"
            aria-hidden="true"
          />
        </li>
      ))}
    </ul>
  );
}
