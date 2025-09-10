import { useTranslation } from "react-i18next";

import { Viewer } from "@/features/vrmViewer/viewer";
import { BasicPage, FormRow, basename } from "./common";
import { SwitchBox } from "@/components/switchBox";
import { animationList } from "@/paths";
import { updateConfig } from "@/utils/config";
import { loadMixamoAnimation } from "@/lib/VRMAnimation/loadMixamoAnimation";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";

export function CharacterAnimationPage({
  viewer,
  animationUrl,
  setAnimationUrl,
  animationProcedural,
  setAnimationProcedural,
  setSettingsUpdated,
}: {
  viewer: Viewer;
  animationUrl: string;
  setAnimationUrl: (url: string) => void;
  animationProcedural: boolean;
  setAnimationProcedural: (value: boolean) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <BasicPage
      title={t("Character Animation")}
      description={t(
        "Select the animation to play when idle. To load more animations refer to docs.",
      )}>
      <ul role="list" className="max-w-xs divide-y divide-gray-100">
        <li className="py-4">
          <FormRow label={t("Procedural Animation")}>
            <SwitchBox
              value={animationProcedural}
              label={t("Use experimental procedural animation")}
              onChange={(value: boolean) => {
                setAnimationProcedural(value);
                updateConfig("animation_procedural", value.toString());
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("Animation")}>
            <select
              value={animationUrl}
              className="input-base mt-2 block w-full pr-10 pl-3"
              disabled={animationProcedural}
              onChange={async (event: React.ChangeEvent<any>) => {
                event.preventDefault();
                const url = event.target.value;
                setAnimationUrl(url);
                updateConfig("animation_url", url);
                setSettingsUpdated(true);
                const animation =
                  url.indexOf("vrma") > 0
                    ? await loadVRMAnimation(url)
                    : await loadMixamoAnimation(url, viewer.model!.vrm!);

                if (animation) {
                  viewer.model!.loadAnimation(animation);
                }
                requestAnimationFrame(() => {
                  viewer.resetCamera();
                });
              }}>
              {animationList.map((url) => (
                <option key={url} value={url}>
                  {basename(url)}
                </option>
              ))}
            </select>
          </FormRow>
        </li>
      </ul>
    </BasicPage>
  );
}
