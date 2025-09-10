import { useTranslation } from "react-i18next";
import { clsx } from "clsx";

import { thumbPrefix } from "./common";
import { bgImages } from "@/paths";
import { updateConfig } from "@/utils/config";
import { TextButton } from "@/components/textButton";

export function BackgroundImgPage({
  bgUrl,
  setBgUrl,
  setSettingsUpdated,
  handleClickOpenBgImgFile,
}: {
  bgUrl: string;
  setBgUrl: (url: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
  handleClickOpenBgImgFile: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="panel flex flex-wrap justify-center gap-x-4 gap-y-4 p-4">
        {bgImages.map((url) => (
          <button
            key={url}
            onClick={() => {
              document.body.style.backgroundImage = `url(${url})`;
              updateConfig("bg_color", "");
              updateConfig("youtube_videoid", "");
              updateConfig("bg_url", url);
              setBgUrl(url);
              setSettingsUpdated(true);
            }}
            className={clsx(
              "bg-surface-alt hover:bg-surface/80 active:bg-surface-alt/70 border-border/40 mx-4 rounded-xl border py-2 transition-all",
              bgUrl === url
                ? "shadow-subtle opacity-100"
                : "opacity-70 hover:opacity-100",
            )}>
            <img
              src={`${thumbPrefix(url)}`}
              alt={url}
              width="160"
              height="93"
              className="bg-surface/70 hover:bg-surface-alt/70 m-0 mx-4 rounded-md p-0 shadow-sm transition-all hover:shadow-md"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = url;
              }}
            />
          </button>
        ))}
      </div>
      <TextButton
        variant="secondary"
        className="ml-4 rounded-t-none px-8 text-lg shadow-lg"
        onClick={handleClickOpenBgImgFile}>
        {t("Load image")}
      </TextButton>
    </>
  );
}
