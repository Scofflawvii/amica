import { useTranslation } from "react-i18next";

import { BasicPage, FormRow } from "./common";
import { IconButton } from "@/components/iconButton";
import { SwitchBox } from "@/components/switchBox";
import { updateConfig } from "@/utils/config";

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
      <ul role="list" className="max-w-xs divide-y divide-gray-100">
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
              className="mt-2 block w-full rounded-md border-0 py-1.5 pr-10 pl-3 text-gray-900 ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              onChange={(event: React.ChangeEvent<any>) => {
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
              className="mt-2 block w-full rounded-md border-0 py-1.5 pr-10 pl-3 text-gray-900 ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              onChange={(event: React.ChangeEvent<any>) => {
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
            <p className="mt-1 max-w-sm text-xs text-gray-500">
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
