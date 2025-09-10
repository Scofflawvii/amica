import { useTranslation } from "react-i18next";
import { Portal } from "./Portal";

export const ArbiusIntroduction = ({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) => {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <Portal>
      <div className="font-M_PLUS_2 z-max pointer-events-auto fixed inset-0 mx-auto h-full w-full bg-black/50 backdrop-blur-sm sm:px-24 lg:px-32">
        <div className="panel mx-auto max-h-full overflow-auto p-4">
          <div className="my-4">
            <div className="my-8 text-xl font-bold">
              {t("Welcome to Amica by Arbius")}
            </div>
            <p>
              {t(
                "arbius_intro",
                `
            Amica is the best way for AI to interact with humans. The Arbius interface shows how people may interact with decentralized AI. With this setup, anyone may prompt Amica by spending a small amount of AIUS tokens, and when an Arbius miner solves the prompt, the users connected will receive a response. This is set up as a global demonstration, so do not expect any privacy.
          `,
              )}
            </p>
          </div>

          <div className="my-8">
            <button
              onClick={() => {
                close();
              }}
              className="bg-surface-alt/70 hover:bg-surface-alt/90 shadow-subtle border-border/50 ml-3 inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm font-semibold text-[hsl(var(--text))]">
              {t("Continue to Amica")}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
