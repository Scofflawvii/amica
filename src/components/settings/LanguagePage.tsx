import { useTranslation } from "react-i18next";

import { BasicPage, FormRow, basename } from "./common";
import { updateConfig } from "@/utils/config";
import { langs } from "@/i18n/langs";

export function LanguagePage({
  setSettingsUpdated,
}: {
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const currLang = i18n.resolvedLanguage;

  return (
    <BasicPage
      title={t("Language")}
      description={t("Select the language of the interface.")}>
      <ul role="list" className="max-w-xs divide-y divide-gray-100">
        <li className="py-4">
          <FormRow label={t("Language")}>
            <select
              value={currLang}
              className="input-base mt-2 block w-full pr-10 pl-3"
              onChange={async (event: React.ChangeEvent<any>) => {
                event.preventDefault();
                i18n.changeLanguage(event.target.value);
              }}>
              {Object.keys(langs).map((lang) => (
                <option key={lang} value={lang}>
                  {langs[lang].nativeName}
                </option>
              ))}
            </select>
          </FormRow>
        </li>
      </ul>
    </BasicPage>
  );
}
