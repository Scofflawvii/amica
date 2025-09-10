import { useTranslation } from "react-i18next";

import { BasicPage, FormRow, ResetToDefaultButton } from "./common";
import { updateConfig, defaultConfig } from "@/utils/config";

export function VisionSystemPromptPage({
  visionSystemPrompt,
  setVisionSystemPrompt,
  setSettingsUpdated,
}: {
  visionSystemPrompt: string;
  setVisionSystemPrompt: (prompt: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <BasicPage
      title={t("Vision") + " " + t("System Prompt") + " " + t("Settings")}
      description={t(
        "Vision_System_Prompt_desc",
        "Configure the vision system prompt. This is the prompt that is used to generate the image descriptions.",
      )}>
      <ul role="list" className="divide-border/40 max-w-xs divide-y">
        <li className="py-4">
          <FormRow label={t("Vision") + " " + t("System Prompt")}>
            <textarea
              value={visionSystemPrompt}
              rows={8}
              className="input-base placeholder:text-muted/60 block w-full"
              onChange={(event: React.ChangeEvent<any>) => {
                event.preventDefault();
                setVisionSystemPrompt(event.target.value);
                updateConfig("vision_system_prompt", event.target.value);
                setSettingsUpdated(true);
              }}
            />

            {visionSystemPrompt !== defaultConfig("vision_system_prompt") && (
              <p className="mt-2">
                <ResetToDefaultButton
                  onClick={() => {
                    setVisionSystemPrompt(
                      defaultConfig("vision_system_prompt"),
                    );
                    updateConfig(
                      "vision_system_prompt",
                      defaultConfig("vision_system_prompt"),
                    );
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
