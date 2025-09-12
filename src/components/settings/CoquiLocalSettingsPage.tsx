import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BasicPage, FormRow, NotUsingAlert } from "./common";
import { TextInput } from "@/components/textInput";
import { config, updateConfig } from "@/utils/config";
import { coquiLocalVoiceIdList } from "@/features/coquiLocal/coquiLocal";
import { logger } from "@/utils/logger";
const slog = logger.with({ subsystem: "settings", page: "coquiLocal" });

export function CoquiLocalSettingsPage({
  coquiLocalUrl,
  setCoquiLocalUrl,
  setSettingsUpdated,
  coquiLocalVoiceId,
  setCoquiLocalVoiceId,
}: {
  coquiLocalUrl: string;
  coquiLocalVoiceId: string;
  setCoquiLocalUrl: (key: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
  setCoquiLocalVoiceId: (key: string) => void;
}) {
  const { t } = useTranslation();
  const [voiceList, setVoiceList] = useState<string[]>([]);

  useEffect(() => {
    async function fetchVoiceList() {
      try {
        const data = await coquiLocalVoiceIdList();
        if (data && Array.isArray(data.list)) {
          setVoiceList(
            data.list.filter((v): v is string => typeof v === "string"),
          );
        }
      } catch (error) {
        slog.error("Error fetching voice list", error);
      }
    }
    fetchVoiceList();
  }, []);

  return (
    <BasicPage
      title={t("CoquiLocal") + " " + t("Settings")}
      description={t(
        "coquiLocal_desc",
        "Configure Coqui (Local), this is running Coqui locally, and no Coqui API (where the company has stopped providing an API service.",
      )}>
      {config("tts_backend") !== "coquiLocal" && (
        <NotUsingAlert>
          {t(
            "not_using_alert",
            "You are not currently using {{name}} as your {{what}} backend. These settings will not be used.",
            { name: t("CoquiLocal"), what: t("TTS") },
          )}
        </NotUsingAlert>
      )}
      <ul role="list" className="max-w-xs divide-y divide-gray-100">
        <li className="py-4">
          <FormRow label={t("URL")}>
            <TextInput
              value={coquiLocalUrl}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setCoquiLocalUrl(event.target.value);
                updateConfig("coquiLocal_url", event.target.value);
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("Voice ID")}>
            <select
              className="input-base mt-2 block w-full pr-10 pl-3"
              value={coquiLocalVoiceId}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                event.preventDefault();
                setCoquiLocalVoiceId(event.target.value);
                updateConfig("coquiLocal_voiceid", event.target.value);
                setSettingsUpdated(true);
              }}>
              {voiceList.map((voiceId) => (
                <option key={voiceId} value={voiceId}>
                  {voiceId}
                </option>
              ))}
            </select>
          </FormRow>
        </li>
      </ul>
    </BasicPage>
  );
}
