import { useTranslation } from "react-i18next";

import { BasicPage, FormRow, Link, getLinkFromPage } from "./common";
import { updateConfig } from "@/utils/config";

const visionEngines = [
  { key: "none", label: "None" },
  { key: "vision_llamacpp", label: "LLama.cpp" },
  { key: "vision_ollama", label: "Ollama" },
  { key: "vision_openai", label: "OpenAI" },
];

function idToTitle(id: string): string {
  return visionEngines[visionEngines.findIndex((engine) => engine.key === id)]
    .label;
}

export function VisionBackendPage({
  visionBackend,
  setVisionBackend,
  setSettingsUpdated,
  setPage,
  breadcrumbs,
  setBreadcrumbs,
}: {
  visionBackend: string;
  setVisionBackend: (backend: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
  setPage: (page: string) => void;
  breadcrumbs: Link[];
  setBreadcrumbs: (breadcrumbs: Link[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <BasicPage
      title={t("Vision Backend")}
      description={t(
        "Vision_Backend_desc",
        "Select the Vision backend to use",
      )}>
      <ul role="list" className="divide-border/30 max-w-xs divide-y text-sm">
        <li className="py-4">
          <FormRow label={t("Vision Backend")}>
            <select
              className="input-base mt-2 block w-full pr-10"
              value={visionBackend}
              onChange={(event: React.ChangeEvent<any>) => {
                setVisionBackend(event.target.value);
                updateConfig("vision_backend", event.target.value);
                setSettingsUpdated(true);
              }}>
              {visionEngines.map((engine) => (
                <option key={engine.key} value={engine.key}>
                  {t(engine.label)}
                </option>
              ))}
            </select>
          </FormRow>
        </li>
        {["vision_llamacpp", "vision_ollama", "vision_openai"].includes(
          visionBackend,
        ) && (
          <li className="py-4">
            <FormRow label={`${t("Configure")} ${t(idToTitle(visionBackend))}`}>
              <button
                type="button"
                className="bg-primary hover:bg-primary-hover active:bg-primary-press shadow-subtle focus:ring-primary/60 rounded-md px-2 py-1 text-xs font-semibold text-white focus:ring-2 focus:outline-none"
                onClick={() => {
                  setPage(`${visionBackend}_settings`);
                  setBreadcrumbs(
                    breadcrumbs.concat([
                      getLinkFromPage(`${visionBackend}_settings`),
                    ]),
                  );
                }}>
                {t("Click here to configure")} {t(idToTitle(visionBackend))}
              </button>
            </FormRow>
          </li>
        )}
      </ul>
    </BasicPage>
  );
}
