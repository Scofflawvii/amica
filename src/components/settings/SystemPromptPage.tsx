import { useTranslation } from "react-i18next";

import { BasicPage, FormRow, ResetToDefaultButton } from "./common";
import { updateConfig, defaultConfig } from "@/utils/config";

export function SystemPromptPage({
  systemPrompt,
  setSystemPrompt,
  setSettingsUpdated,
}: {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <BasicPage
      title={t("System Prompt") + " " + t("Settings")}
      description={t(
        "System_Prompt_desc",
        "Configure the system prompt. Alter the prompt to change your character's personality. You can share your character's personality using the share button!",
      )}>
      <ul role="list" className="max-w-xs divide-y divide-gray-100">
        <li className="py-4">
          <FormRow label={t("System Prompt")}>
            <textarea
              value={systemPrompt}
              rows={8}
              className="input-base placeholder:text-muted/60 block w-full"
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                event.preventDefault();
                setSystemPrompt(event.target.value);
                updateConfig("system_prompt", event.target.value);
                setSettingsUpdated(true);
              }}
            />

            {systemPrompt !== defaultConfig("system_prompt") && (
              <p className="mt-2">
                <ResetToDefaultButton
                  onClick={() => {
                    setSystemPrompt(defaultConfig("system_prompt"));
                    updateConfig(
                      "system_prompt",
                      defaultConfig("system_prompt"),
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
