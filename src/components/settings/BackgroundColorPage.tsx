import { useTranslation } from "react-i18next";

import { BasicPage, FormRow, ResetToDefaultButton } from "./common";
// import { TextInput } from "@/components/textInput"; // unused
import { SwitchBox } from "@/components/switchBox";
import { config, updateConfig, defaultConfig } from "@/utils/config";

export function BackgroundColorPage({
  bgColor,
  setBgColor,
  setSettingsUpdated,
}: {
  bgColor: string;
  setBgColor: (color: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <BasicPage
      title={t("Background Color")}
      description={t(
        "bg_color_desc",
        "Configure the background color. This overrides background image.",
      )}>
      <ul role="list" className="divide-border/40 max-w-xs divide-y">
        <li className="py-4">
          {bgColor === "" && (
            <p className="text-muted text-xs">
              {t(
                "no_bg_color",
                "No background color set. Click the box below.",
              )}
            </p>
          )}
          <FormRow label={t("Color")}>
            <div className="flex items-center">
              <input
                className={
                  "bg-surface-alt/70 border-border/50 focus-visible:ring-primary focus-visible:ring-offset-surface block w-20 rounded-md border shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                }
                type="color"
                value={bgColor}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  document.body.style.backgroundImage = `none`;
                  document.body.style.backgroundColor = event.target.value;
                  updateConfig("youtube_videoid", "");
                  updateConfig("bg_url", "");
                  updateConfig("bg_color", event.target.value);
                  setBgColor(event.target.value);
                  setSettingsUpdated(true);
                }}
              />

              <SwitchBox
                value={bgColor === "transparent"}
                label="Transparent"
                onChange={(value: boolean) => {
                  document.body.style.backgroundImage = `none`;
                  document.body.style.backgroundColor = value
                    ? "transparent"
                    : config("bg_color");
                  updateConfig("youtube_videoid", "");
                  updateConfig("bg_url", "");
                  updateConfig(
                    "bg_color",
                    value ? "transparent" : config("bg_color"),
                  );

                  setBgColor(value ? "transparent" : config("bg_color"));
                  setSettingsUpdated(true);
                }}
              />
            </div>

            {bgColor !== defaultConfig("bg_color") && (
              <p className="mt-2">
                <ResetToDefaultButton
                  onClick={() => {
                    document.body.style.backgroundImage = `none`;
                    document.body.style.backgroundColor =
                      defaultConfig("bg_color");
                    setBgColor(defaultConfig("bg_color"));
                    updateConfig("bg_color", defaultConfig("bg_color"));
                    setSettingsUpdated(true);
                  }}
                />
              </p>
            )}
          </FormRow>
        </li>
      </ul>
    </BasicPage>
  );
}
