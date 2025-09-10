import { useTranslation } from "react-i18next";

import { BasicPage, FormRow } from "./common";
import { config, updateConfig } from "@/utils/config";
import { RangeInput } from "@/components/rangeInput";
import { SwitchBox } from "@/components/switchBox";
import { NumberInput } from "../numberInput";
import { useCallback, useContext, useEffect, useRef } from "react";
import { ChatContext } from "@/features/chat/chatContext";
import { TextInput } from "../textInput";
import { IconButton } from "../iconButton";
import { AmicaLifeContext } from "@/features/amicaLife/amicaLifeContext";

export function AmicaLifePage({
  amicaLifeEnabled,
  reasoningEngineEnabled,
  reasoningEngineUrl,
  timeBeforeIdle,
  minTimeInterval,
  maxTimeInterval,
  timeToSleep,
  idleTextPrompt,
  setAmicaLifeEnabled,
  setReasoningEngineEnabled,
  setReasoningEngineUrl,
  setTimeBeforeIdle,
  setMinTimeInterval,
  setMaxTimeInterval,
  setTimeToSleep,
  setIdleTextPrompt,
  setSettingsUpdated,
}: {
  amicaLifeEnabled: boolean;
  reasoningEngineEnabled: boolean;
  reasoningEngineUrl: string;
  timeBeforeIdle: number;
  minTimeInterval: number;
  maxTimeInterval: number;
  timeToSleep: number;
  idleTextPrompt: string;
  setAmicaLifeEnabled: (amicaLifeEnabled: boolean) => void;
  setReasoningEngineEnabled: (reasoningEngineEnabled: boolean) => void;
  setReasoningEngineUrl: (reasoningEngineUrl: string) => void;
  setTimeBeforeIdle: (timeBeforeIdle: number) => void;
  setMinTimeInterval: (minTimeInterval: number) => void;
  setMaxTimeInterval: (maxTimeInterval: number) => void;
  setTimeToSleep: (timeToSleep: number) => void;
  setIdleTextPrompt: (idleTextPrompt: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();
  const { chat: bot } = useContext(ChatContext);
  const { amicaLife } = useContext(AmicaLifeContext);

  useEffect(() => {
    amicaLife.processingIdle();
  }, [amicaLifeEnabled, amicaLife]);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const handleClickOpenJsonFile = useCallback(() => {
    jsonFileInputRef.current?.click();
  }, []);
  const handleChangeJsonFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result?.toString();
          if (content) {
            const parsedContent = JSON.parse(content);
            if (parsedContent.idleTextPrompt) {
              amicaLife.loadIdleTextPrompt(parsedContent.idleTextPrompt);
              console.log("idleTextPrompt", parsedContent.idleTextPrompt);
            } else {
              console.error("Wrong json format");
            }
          }
        };
        reader.readAsText(file);

        const fileName = file.name;
        setIdleTextPrompt(fileName);
        updateConfig("idle_text_prompt", fileName);
        setSettingsUpdated(true);
      }
    },
    [bot, idleTextPrompt],
  );

  return (
    <BasicPage
      title={`${t("Amica Life")} ${t("Settings")}`}
      description={`${t("Enables")} ${t("Semi-autonomous mode, includes animations, sleep, function calling, subconcious subroutine and self-prompting. (Experimental)")}`}>
      <ul role="list" className="divide-border/40 max-w-xs divide-y">
        <li className="py-4">
          <FormRow label={`${t("Use")} ${t("Amica Life")}`}>
            <SwitchBox
              value={amicaLifeEnabled}
              label={`${t("Amica Life")} ${t("Enabled")} ${t("(Disable to improve performance)")}`}
              disabled={["echo", "moshi"].includes(config("chatbot_backend"))}
              onChange={(value: boolean) => {
                setAmicaLifeEnabled(value);
                updateConfig("amica_life_enabled", value.toString());
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>

        <li className="py-4">
          <FormRow label={`${t("Use")} ${t("Reasoning Engine")}`}>
            <SwitchBox
              value={reasoningEngineEnabled}
              label={`${t("Reasoning Engine")} ${t("Enabled")} ${t("(Disable to improve performance)")}`}
              disabled={config("chatbot_backend") === "echo"}
              onChange={(value: boolean) => {
                setReasoningEngineEnabled(value);
                updateConfig("reasoning_engine_enabled", value.toString());
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>

        {amicaLifeEnabled && (
          <>
            <li className="py-4">
              <FormRow
                label={t("Idle self prompts (leave empty to use default)")}>
                <div className="flex items-center space-x-4">
                  <IconButton
                    iconName="24/UploadAlt"
                    label={t("Load")}
                    isProcessing={false}
                    className="bg-secondary hover:bg-secondary-hover active:bg-secondary-active focus-visible:ring-primary focus-visible:ring-offset-surface block h-9 w-auto rounded-md border-0 px-4 py-1.5 text-sm text-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={handleClickOpenJsonFile}></IconButton>
                  <TextInput value={idleTextPrompt} readOnly={true} />
                  <input
                    type="file"
                    accept="application/json"
                    id="fileInput"
                    className="hidden"
                    ref={jsonFileInputRef}
                    onChange={handleChangeJsonFile}
                  />
                </div>
              </FormRow>
            </li>

            <li className="py-4">
              <FormRow
                label={`${t("Idle time before Amica life activates")}(${t("sec")})`}>
                <NumberInput
                  value={timeBeforeIdle}
                  min={0}
                  max={60 * 60}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(event.target.value);
                    setTimeBeforeIdle(val);
                    updateConfig("time_before_idle_sec", String(val));
                    setSettingsUpdated(true);
                  }}
                />
              </FormRow>
            </li>

            <li className="py-4">
              <FormRow
                label={`${t("Set time before bot go to sleep")}(${t("sec")})`}>
                <NumberInput
                  value={timeToSleep}
                  min={0}
                  max={60 * 60}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(event.target.value);
                    setTimeToSleep(val);
                    updateConfig("time_to_sleep_sec", String(val));
                    setSettingsUpdated(true);
                  }}
                />
              </FormRow>
            </li>

            <li className="py-4">
              <FormRow
                label={`${t("Set min max interval range")}(${t("sec")})`}>
                <RangeInput
                  min={minTimeInterval}
                  max={maxTimeInterval}
                  minChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(event.target.value);
                    setMinTimeInterval(val);
                    updateConfig("min_time_interval_sec", String(val));
                    setSettingsUpdated(true);
                  }}
                  maxChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(event.target.value);
                    setMaxTimeInterval(val);
                    updateConfig("max_time_interval_sec", String(val));
                    setSettingsUpdated(true);
                  }}
                />
              </FormRow>
            </li>
          </>
        )}

        {reasoningEngineEnabled && (
          <>
            <li className="py-4">
              <FormRow label="Reasoning Engine Url">
                <TextInput
                  value={reasoningEngineUrl}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const val = event.target.value;
                    setReasoningEngineUrl(val);
                    updateConfig("reasoning_engine_url", val);
                    setSettingsUpdated(true);
                  }}
                />
              </FormRow>
            </li>
          </>
        )}
      </ul>
    </BasicPage>
  );
}
