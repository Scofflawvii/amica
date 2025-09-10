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
    <div className="bg-opacity-50 fixed top-0 left-0 z-50 flex h-full w-full bg-gray-900 backdrop-blur-sm">
      <div className="p-20 md:p-25">
        <div className="fixed top-0 left-0 z-20 max-h-full w-full text-left text-xs text-black">
          <div className="bg-white p-2">
            <IconButton
              iconName="24/Close"
              isProcessing={false}
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-active"
              onClick={handleCloseIcon}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white px-4 py-2 shadow-lg">
            <div className="mt-4 max-w-md rounded-xl p-2 sm:col-span-3">
              <h1 className="text-lg">{t("Import character")}</h1>
            </div>
            <div className="mt-4 max-w-md rounded-xl bg-gray-50 p-2 sm:col-span-3">
              <p className="text-sm">
                {t("Please enter the code you received from the share page.")}
              </p>
            </div>

            <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
              <label className="block text-sm leading-6 font-medium text-gray-900">
                {t("Code")}
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                  onChange={(e) => setSqid(e.target.value)}
                />
              </div>

              <div className="mt-2 max-w-md rounded-xl sm:col-span-3">
                <button
                  onClick={() => {
                    window.location.href = `/import/${sqid}`;
                  }}
                  className="bg-secondary hover:bg-secondary-hover inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
