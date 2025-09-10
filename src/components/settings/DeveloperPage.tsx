import { useTranslation } from "react-i18next";

import { BasicPage, FormRow } from "./common";
import { SwitchBox } from "@/components/switchBox";
import { updateConfig } from "@/utils/config";
import { debug } from "@/utils/debug";

const mtoonDebugModes = [
  { key: "none", label: "None" },
  { key: "normal", label: "Normal" },
  { key: "litShadeRate", label: "litShadeRate" },
  { key: "uv", label: "uv" },
];

const mtoonMaterialTypes = [
  { key: "mtoon", label: "MToon" },
  { key: "mtoon_node", label: "MToonNode" },
  { key: "meshtoon", label: "MeshToon" },
  { key: "basic", label: "Basic" },
  { key: "depth", label: "Depth" },
  { key: "normal", label: "Normal" },
];

export function DeveloperPage({
  debugMode,
  setDebugMode,
  levelLog,
  setLevelLog,
  levelInfo,
  setLevelInfo,
  levelWarn,
  setLevelWarn,
  debugGfx,
  setDebugGfx,
  mtoonDebugMode,
  setMtoonDebugMode,
  mtoonMaterialType,
  setMtoonMaterialType,
  useWebGPU,
  setUseWebGPU,
  setSettingsUpdated,
}: {
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
  levelLog: boolean;
  setLevelLog: (value: boolean) => void;
  levelInfo: boolean;
  setLevelInfo: (value: boolean) => void;
  levelWarn: boolean;
  setLevelWarn: (value: boolean) => void;
  debugGfx: boolean;
  setDebugGfx: (value: boolean) => void;
  mtoonDebugMode: string;
  setMtoonDebugMode: (mode: string) => void;
  mtoonMaterialType: string;
  setMtoonMaterialType: (mode: string) => void;
  useWebGPU: boolean;
  setUseWebGPU: (value: boolean) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <BasicPage
      title={t("Developer")}
      description={t(
        "For developers. These settings require a restart to take effect.",
      )}>
      <ul role="list" className="divide-border/40 max-w-xs divide-y">
        <li className="py-4">
          <FormRow label={t("Debug Logging")}>
            <SwitchBox
              value={debugMode}
              label={t("Enable Debug Logging")}
              onChange={(value: boolean) => {
                setDebugMode(value);
                updateConfig("debug_mode", value ? "true" : "false");
                // Apply immediately at runtime
                if (value) debug.enable();
                else debug.disable();
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("Log Levels")}>
            <div className="space-y-2">
              <SwitchBox
                value={levelLog}
                label={t("Console.log")}
                onChange={(value: boolean) => {
                  setLevelLog(value);
                  updateConfig("debug_log", value ? "true" : "false");
                  debug.setLevels({ log: value });
                  setSettingsUpdated(true);
                }}
              />
              <SwitchBox
                value={levelInfo}
                label={t("Console.info")}
                onChange={(value: boolean) => {
                  setLevelInfo(value);
                  updateConfig("debug_info", value ? "true" : "false");
                  debug.setLevels({ info: value });
                  setSettingsUpdated(true);
                }}
              />
              <SwitchBox
                value={levelWarn}
                label={t("Console.warn")}
                onChange={(value: boolean) => {
                  setLevelWarn(value);
                  updateConfig("debug_warn", value ? "true" : "false");
                  debug.setLevels({ warn: value });
                  setSettingsUpdated(true);
                }}
              />
            </div>
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("Clear DEBUG flag (localStorage)")}>
            <button
              className="bg-surface-alt/70 text hover:bg-surface-alt/90 border-border/50 mt-2 rounded border px-3 py-1"
              onClick={() => {
                try {
                  if (typeof window !== "undefined") {
                    window.localStorage?.removeItem("DEBUG");
                  }
                } catch {
                  /* no-op */
                }
                setSettingsUpdated(true);
              }}>
              {t("Clear")}
            </button>
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("Debug Rendering")}>
            <SwitchBox
              value={debugGfx}
              label={t("Debug Rendering")}
              onChange={(value: boolean) => {
                setDebugGfx(value);
                updateConfig("debug_gfx", value.toString());
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("MToon Debug Mode")}>
            <select
              value={mtoonDebugMode}
              className="input-base mt-2 block w-full pr-10 pl-3"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                setMtoonDebugMode(event.target.value);
                updateConfig("mtoon_debug_mode", event.target.value);
                setSettingsUpdated(true);
              }}>
              {mtoonDebugModes.map((mode) => (
                <option key={mode.key} value={mode.key}>
                  {mode.label}
                </option>
              ))}
            </select>
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("MToon Material Type")}>
            <select
              value={mtoonMaterialType}
              className="input-base mt-2 block w-full pr-10 pl-3"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                setMtoonMaterialType(event.target.value);
                updateConfig("mtoon_material_type", event.target.value);
                setSettingsUpdated(true);
              }}>
              {mtoonMaterialTypes.map((mode) => (
                <option key={mode.key} value={mode.key}>
                  {mode.label}
                </option>
              ))}
            </select>
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label={t("Use WebGPU")}>
            <SwitchBox
              value={useWebGPU}
              label={t("WebGPU Rendering")}
              onChange={(value: boolean) => {
                setUseWebGPU(value);
                updateConfig("use_webgpu", value ? "true" : "false");
                setSettingsUpdated(true);
              }}
            />
            <p className="text-muted mt-1 max-w-sm text-xs">
              {t(
                "Default is Auto: Amica will use WebGPU when supported and fall back to WebGL. This switch forces WebGPU on or off and requires a restart.",
              )}
            </p>
          </FormRow>
        </li>
      </ul>
    </BasicPage>
  );
}
