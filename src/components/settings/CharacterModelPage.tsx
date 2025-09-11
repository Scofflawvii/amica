import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import { BasicPage } from "./common";
import { updateConfig } from "@/utils/config";
import { TextButton } from "@/components/textButton";
import { VrmData } from "@/features/vrmStore/vrmData";
import { Viewer } from "@/features/vrmViewer/viewer";

export function CharacterModelPage({
  viewer,
  vrmHash,
  vrmUrl,
  vrmSaveType,
  vrmList,
  setVrmHash,
  setVrmUrl,
  setVrmSaveType,
  setSettingsUpdated,
  handleClickOpenVrmFile,
}: {
  viewer: Viewer;
  vrmHash: string;
  vrmUrl: string;
  vrmSaveType: string;
  vrmList: VrmData[];
  setVrmHash: (hash: string) => void;
  setVrmUrl: (url: string) => void;
  setVrmSaveType: (saveType: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
  handleClickOpenVrmFile: () => void;
}) {
  const { t } = useTranslation();

  return (
    <BasicPage
      title={t("Character Model")}
      description={t(
        "character_desc",
        "Select the Character to play, currently only default Amica has full range of emotions. Load your own VRMs here.",
      )}>
      <div className="panel flex flex-wrap justify-center gap-x-4 gap-y-4 p-4">
        {vrmList.map((vrm) => (
          <button
            key={vrm.url}
            onClick={() => {
              viewer.loadVrm(vrm.url, (_progress: string) => {
                // TODO handle loading progress
              });
              setVrmSaveType(vrm.saveType);
              updateConfig("vrm_save_type", vrm.saveType);
              if (vrm.saveType == "local") {
                updateConfig("vrm_hash", vrm.getHash());
                updateConfig("vrm_url", vrm.url);
                setVrmUrl(vrm.url);
                setVrmHash(vrm.getHash());
              } else {
                updateConfig("vrm_hash", "");
                updateConfig("vrm_url", vrm.url);
                setVrmUrl(vrm.url);
              }
              setSettingsUpdated(true);
            }}
            className={clsx(
              "bg-surface-alt hover:bg-surface/80 active:bg-surface-alt/70 border-border/40 mx-4 rounded-xl border py-2 transition-all",
              (vrm.saveType === "web" && vrm.url === vrmUrl) ||
                (vrm.saveType === "local" && vrm.getHash() === vrmHash)
                ? "shadow-subtle opacity-100"
                : "opacity-70 hover:opacity-100",
            )}>
            <img
              src={vrm.thumbUrl}
              alt={vrm.url}
              width="160"
              height="93"
              className="bg-surface/70 hover:bg-surface-alt/70 m-0 mx-4 rounded pt-0 pr-0 pb-0 pl-0 shadow-sm transition-all hover:shadow-md"
            />
          </button>
        ))}
      </div>
      <TextButton
        variant="secondary"
        className="ml-4 rounded-t-none px-8 text-lg shadow-lg"
        onClick={handleClickOpenVrmFile}>
        {t("Load VRM")}
      </TextButton>
    </BasicPage>
  );
}
