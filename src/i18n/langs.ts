import en from "./locales/en/common.json";
import zh from "./locales/zh/common.json";
import de from "./locales/de/common.json";
import ka from "./locales/ka/common.json";

// const langs: any = Object.entries({en, zh}).reduce((arr, [key, value]) => {
//     return {...arr, [key] : { translation: value} }
//   }, {});

type Translation = Record<string, unknown>;
type LangEntry = { nativeName: string; translation: Translation };
export const langs: Record<string, LangEntry> = {
  en: {
    nativeName: "English",
    translation: en as Translation,
  },
  zh: {
    nativeName: "中文",
    translation: zh as Translation,
  },
  de: {
    nativeName: "Deutsch",
    translation: de as Translation,
  },
  ka: {
    nativeName: "ქართული",
    translation: ka as Translation,
  },
};
