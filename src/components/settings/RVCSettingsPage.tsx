import { useTranslation } from "react-i18next";
import { InformationCircleIcon } from "@heroicons/react/20/solid";

import { BasicPage, FormRow } from "./common";
import { updateConfig } from "@/utils/config";
import { TextInput } from "@/components/textInput";
import { SwitchBox } from "@/components/switchBox";
import { NumberInput } from "../numberInput";
import { useState } from "react";

const f0Method = [
  { key: "harvest", label: "harvest" },
  { key: "pm", label: "pm" },
];

export function RVCSettingsPage({
  rvcUrl,
  rvcEnabled,
  rvcModelName,
  rvcIndexPath,
  rvcF0upKey,
  rvcF0Method,
  rvcIndexRate,
  rvcFilterRadius,
  rvcResampleSr,
  rvcRmsMixRate,
  rvcProtect,
  setRvcUrl,
  setRvcEnabled,
  setRvcModelName,
  setRvcIndexPath,
  setRvcF0upKey,
  setRvcF0Method,
  setRvcIndexRate,
  setRvcFilterRadius,
  setRvcResampleSr,
  setRvcRmsMixRate,
  setRvcProtect,
  setSettingsUpdated,
}: {
  rvcUrl: string;
  rvcEnabled: boolean;
  rvcModelName: string;
  rvcIndexPath: string;
  rvcF0upKey: number;
  rvcF0Method: string;
  rvcIndexRate: string;
  rvcFilterRadius: number;
  rvcResampleSr: number;
  rvcRmsMixRate: number;
  rvcProtect: number;
  setRvcUrl: (rvcUrl: string) => void;
  setRvcEnabled: (rvcEnabled: boolean) => void;
  setRvcModelName: (rvcModelName: string) => void;
  setRvcIndexPath: (timeBeforeIdle: string) => void;
  setRvcF0upKey: (rvcF0upKey: number) => void;
  setRvcF0Method: (rvcF0Method: string) => void;
  setRvcIndexRate: (rvcIndexRate: string) => void;
  setRvcFilterRadius: (rvcFilterRadius: number) => void;
  setRvcResampleSr: (rvcResampleSr: number) => void;
  setRvcRmsMixRate: (rvcRmsMixRate: number) => void;
  setRvcProtect: (rvcProtect: number) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();
  const [showModelNameInfo, setShowModelNameInfo] = useState(false);
  const [showIndexPathInfo, setShowIndexPathInfo] = useState(false);
  const [showF0UpKeyInfo, setShowF0UpKeyInfo] = useState(false);
  const [showIndexRateInfo, setShowIndexRateInfo] = useState(false);
  const [showFilterRadiusInfo, setShowFilterRadiusInfo] = useState(false);
  const [showResampleSrInfo, setShowResampleSrInfo] = useState(false);
  const [showRmsMixRateInfo, setShowRmsMixRateInfo] = useState(false);
  const [showProtectInfo, setShowProtectInfo] = useState(false);
  const [showF0MethodInfo, setShowF0MethodInfo] = useState(false);

  return (
    <BasicPage
      title={`${t("RVC")} ${t("Settings")}`}
      description={`${t("Configure")} ${t("RVC")}`}>
      <ul
        role="list"
        className="divide-border/30 max-w-xs divide-y text-sm text-[hsl(var(--text))]">
        <li className="py-4">
          <FormRow label={`${t("Use")} ${t("RVC")}`}>
            <SwitchBox
              value={rvcEnabled}
              label={`${t("RVC")} ${t("Enabled")}`}
              onChange={(value: boolean) => {
                setRvcEnabled(value);
                updateConfig("rvc_enabled", value.toString());
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        {rvcEnabled && (
          <>
            <li className="py-4">
              <FormRow label={t("URL")}>
                <TextInput
                  value={rvcUrl}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setRvcUrl(event.target.value);
                    updateConfig("rvc_url", event.target.value);
                    setSettingsUpdated(true);
                  }}
                />
              </FormRow>
            </li>
            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("Model Name")}`}>
                <div className="flex items-center">
                  <TextInput
                    value={rvcModelName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setRvcModelName(event.target.value);
                      updateConfig("rvc_model_name", event.target.value);
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowModelNameInfo(true)}
                      onMouseLeave={() => setShowModelNameInfo(false)}
                    />
                    {showModelNameInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-60 p-2 text-xs">
                        {t(
                          "the name of the model which was included in your '/assets/weights' folder",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>
            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("Index Path")}`}>
                <div className="flex items-center">
                  <TextInput
                    value={rvcIndexPath}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setRvcIndexPath(event.target.value);
                      updateConfig("rvc_index_path", event.target.value);
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowIndexPathInfo(true)}
                      onMouseLeave={() => setShowIndexPathInfo(false)}
                    />
                    {showIndexPathInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-60 p-2 text-xs">
                        {t(
                          "the index file of the previously trained model if none then use default dir logs by rvc.",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>
            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("F0 UpKey")}`}>
                <div className="flex items-center">
                  <NumberInput
                    value={rvcF0upKey}
                    min={0}
                    max={1}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = Number(event.target.value);
                      setRvcF0upKey(value);
                      updateConfig("rvc_f0_upkey", value.toString());
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowF0UpKeyInfo(true)}
                      onMouseLeave={() => setShowF0UpKeyInfo(false)}
                    />
                    {showF0UpKeyInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-40 p-2 text-xs">
                        {t("0 or 1")}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>
            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("F0 Method")}`}>
                <div className="flex items-center">
                  <select
                    className="border-border/40 bg-surface-alt/70 dark:bg-surface-alt/60 focus:ring-primary/60 mt-2 block w-full rounded-md border py-1.5 pr-10 pl-3 text-sm text-[hsl(var(--text))] focus:ring-2 focus:outline-none"
                    value={rvcF0Method}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      setRvcF0Method(event.target.value);
                      updateConfig("rvc_f0_method", event.target.value);
                      setSettingsUpdated(true);
                    }}>
                    {f0Method.map((method) => (
                      <option key={method.key} value={method.key}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowF0MethodInfo(true)}
                      onMouseLeave={() => setShowF0MethodInfo(false)}
                    />
                    {showF0MethodInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-48 p-2 text-xs">
                        {t(
                          "Select the pitch extraction algorithm ('pm': faster extraction but lower-quality speech; 'harvest': better bass but extremely slow;)",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>

            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("Index Rate")}`}>
                <div className="flex items-center">
                  <TextInput
                    value={rvcIndexRate}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setRvcIndexRate(event.target.value);
                      updateConfig("rvc_index_rate", event.target.value);
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowIndexRateInfo(true)}
                      onMouseLeave={() => setShowIndexRateInfo(false)}
                    />
                    {showIndexRateInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-40 p-2 text-xs">
                        {t("Default is 0.66")}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>
            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("Filter Radius")}`}>
                <div className="flex items-center">
                  <NumberInput
                    value={rvcFilterRadius}
                    min={0}
                    max={7}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = Number(event.target.value);
                      setRvcFilterRadius(value);
                      updateConfig("rvc_filter_radius", value.toString());
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowFilterRadiusInfo(true)}
                      onMouseLeave={() => setShowFilterRadiusInfo(false)}
                    />
                    {showFilterRadiusInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-60 p-2 text-xs">
                        {t(
                          "If >=3: apply median filtering to the harvested pitch results. The value represents the filter radius and can reduce breathiness. [ 0 to 7 ]",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>

            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("Resample Sr")}`}>
                <div className="flex items-center">
                  <NumberInput
                    value={rvcResampleSr}
                    min={0}
                    max={48000}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = Number(event.target.value);
                      setRvcResampleSr(value);
                      updateConfig("rvc_resample_sr", value.toString());
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowResampleSrInfo(true)}
                      onMouseLeave={() => setShowResampleSrInfo(false)}
                    />
                    {showResampleSrInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-60 p-2 text-xs">
                        {t(
                          "Resample the output audio in post-processing to the final sample rate. Set to 0 for no resampling [ 0 to 48000 ]",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>

            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("RMS Mix Rate")}`}>
                <div className="flex items-center">
                  <NumberInput
                    value={rvcRmsMixRate}
                    min={0}
                    max={1}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = Number(event.target.value);
                      setRvcRmsMixRate(value);
                      updateConfig("rvc_rms_mix_rate", value.toString());
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowRmsMixRateInfo(true)}
                      onMouseLeave={() => setShowRmsMixRateInfo(false)}
                    />
                    {showRmsMixRateInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-60 p-2 text-xs">
                        {t(
                          "Adjust the volume envelope scaling. Closer to 0, the more it mimicks the volume of the original vocals. Can help mask noise and make volume sound more natural when set relatively low. Closer to 1 will be more of a consistently loud volume [ 0 to 1]",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>

            <li className="relative py-4">
              <FormRow label={`${t("Specify")} ${t("Protect")}`}>
                <div className="flex items-center">
                  <NumberInput
                    value={rvcProtect}
                    min={0}
                    max={0.5}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const value = Number(event.target.value);
                      setRvcProtect(value);
                      updateConfig("rvc_protect", value.toString());
                      setSettingsUpdated(true);
                    }}
                  />
                  <div className="relative ml-1">
                    <InformationCircleIcon
                      className="text-muted h-5 w-5 cursor-pointer"
                      onMouseEnter={() => setShowProtectInfo(true)}
                      onMouseLeave={() => setShowProtectInfo(false)}
                    />
                    {showProtectInfo && (
                      <div className="card text-muted absolute bottom-0 left-full ml-2 w-60 p-2 text-xs">
                        {t(
                          "Protect voiceless consonants and breath sounds to prevent artifacts such as tearing in electronic music. Set to 0.5 to disable. Decrease the value to increase protection, but it may reduce indexing accuracy [ 0 to 0.5 ]",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </FormRow>
            </li>
          </>
        )}
      </ul>
    </BasicPage>
  );
}
