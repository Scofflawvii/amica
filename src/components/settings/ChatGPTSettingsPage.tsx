import { BasicPage, FormRow, NotUsingAlert } from "./common";
import { TextInput } from "@/components/textInput";
import { SecretTextInput } from "@/components/secretTextInput";
import { config, updateConfig } from "@/utils/config";

export function ChatGPTSettingsPage({
  openAIApiKey,
  setOpenAIApiKey,
  openAIUrl,
  setOpenAIUrl,
  openAIModel,
  setOpenAIModel,
  setSettingsUpdated,
}: {
  openAIApiKey: string;
  setOpenAIApiKey: (key: string) => void;
  openAIUrl: string;
  setOpenAIUrl: (url: string) => void;
  openAIModel: string;
  setOpenAIModel: (model: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const description = (
    <>
      Configure ChatGPT settings. You can get an API key from{" "}
      <a href="https://platform.openai.com">platform.openai.com</a>. You can
      generally use other OpenAI compatible URLs and models here too, such as{" "}
      <a href="https://openrouter.ai/">OpenRouter</a> or{" "}
      <a href="https://lmstudio.ai/">LM Studio</a>.
    </>
  );

  return (
    <BasicPage title="ChatGPT Settings" description={description}>
      {config("chatbot_backend") !== "chatgpt" && (
        <NotUsingAlert>
          You are not currently using ChatGPT as your ChatBot backend. These
          settings will not be used.
        </NotUsingAlert>
      )}
      <ul role="list" className="max-w-xs divide-y divide-gray-100">
        <li className="py-4">
          <FormRow label="OpenAI API Key">
            <SecretTextInput
              value={openAIApiKey}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const val = event.target.value;
                setOpenAIApiKey(val);
                updateConfig("openai_apikey", val);
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label="OpenAI URL">
            <TextInput
              value={openAIUrl}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const val = event.target.value;
                setOpenAIUrl(val);
                updateConfig("openai_url", val);
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label="OpenAI Model">
            <TextInput
              value={openAIModel}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const val = event.target.value;
                setOpenAIModel(val);
                updateConfig("openai_model", val);
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
      </ul>
    </BasicPage>
  );
}
