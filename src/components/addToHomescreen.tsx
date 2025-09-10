import { useTranslation } from "react-i18next";

import { Fragment, useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useAddToHomescreenPrompt } from "@/hooks/useAddToHomescreenPrompt";
import { config, updateConfig } from "@/utils/config";

export function AddToHomescreen() {
  const { t } = useTranslation();
  const [prompt, promptToInstall] = useAddToHomescreenPrompt();
  const [show, setShow] = useState(false);

  const hide = () => {
    setShow(false);
  };

  useEffect(() => {
    if (config("show_add_to_homescreen") !== "true") {
      return;
    }

    if (prompt) {
      setShow(true);
    }
  }, [prompt]);

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="z-modal pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
        onClick={hide}>
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
            <div className="card shadow-subtle pointer-events-auto w-full max-w-sm">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="ml-3 w-0 flex-1">
                    <p className="text text-sm font-medium">
                      {t("add_to_homescreen", "Add Amica to Homescreen")}
                    </p>
                    <p className="text-muted mt-1 text-sm">
                      {t(
                        "add_to_homescreen_desc",
                        "Amica can be installed locally for faster loading and less UI clutter.",
                      )}
                    </p>
                    <div className="mt-4 flex">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const installed = await promptToInstall();
                            console.log(installed);
                            if (installed.outcome === "accepted") {
                              updateConfig("show_add_to_homescreen", "false");
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press focus-visible:ring-primary focus-visible:ring-offset-surface inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
                        {t("Accept")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig("show_add_to_homescreen", "false");
                          hide();
                        }}
                        className="bg-surface-alt/60 text border-border/50 hover:bg-surface-alt/80 ml-3 inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm font-semibold shadow-sm">
                        {t("Decline")}
                      </button>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-shrink-0">
                    <button
                      type="button"
                      className="text-muted hover:text-text focus-visible:ring-primary focus-visible:ring-offset-surface inline-flex rounded-md bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      onClick={() => {
                        setShow(false);
                      }}>
                      <span className="sr-only">{t("Close")}</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
}
