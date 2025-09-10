import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/iconButton";
import { useRouter } from "next/router";

export default function Import() {
  const { t } = useTranslation();

  const [sqid, setSqid] = useState("");

  const router = useRouter();

  const handleCloseIcon = () => {
    router.push("/");
  };

  return (
    <div className="bg-surface/80 fixed inset-0 z-50 flex h-full w-full backdrop-blur-sm">
      <div className="p-10 md:p-20">
        <div className="fixed top-0 left-0 z-20 max-h-full w-full text-left text-xs text-[hsl(var(--text))]">
          <div className="bg-surface-alt/80 border-border/50 border-b p-2 backdrop-blur">
            <IconButton
              iconName="24/Close"
              isProcessing={false}
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-active"
              onClick={handleCloseIcon}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="panel px-4 py-4">
            <div className="mt-2 max-w-md sm:col-span-3">
              <h1 className="heading-gradient text-lg font-semibold">
                {t("Import character")}
              </h1>
            </div>
            <div className="bg-surface-alt/60 border-border/40 mt-4 max-w-md rounded-xl border p-3 sm:col-span-3">
              <p className="text-muted text-sm">
                {t("Please enter the code you received from the share page.")}
              </p>
            </div>

            <div className="mt-4 max-w-md sm:col-span-3">
              <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
                {t("Code")}
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  className="input-base placeholder:text-muted/60 block w-full"
                  onChange={(e) => setSqid(e.target.value)}
                />
              </div>

              <div className="mt-4 max-w-md sm:col-span-3">
                <button
                  onClick={() => {
                    window.location.href = `/import/${sqid}`;
                  }}
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={sqid === ""}>
                  {t("Import")}
                </button>
              </div>
            </div>
          </div>
          <div>{/* empty column */}</div>
        </div>
      </div>
    </div>
  );
}
