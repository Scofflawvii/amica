import * as ort from "onnxruntime-web";
ort.env.wasm.wasmPaths = "/_next/static/chunks/";

import { useContext, useEffect, useRef, useState } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { IconButton } from "./iconButton";
import { useTranscriber } from "@/hooks/useTranscriber";
import {
  cleanTranscript,
  cleanFromPunctuation,
  cleanFromWakeWord,
} from "@/utils/stringProcessing";
import { hasOnScreenKeyboard } from "@/utils/hasOnScreenKeyboard";
import { AlertContext } from "@/features/alert/alertContext";
import { ChatContext } from "@/features/chat/chatContext";
import { openaiWhisper } from "@/features/openaiWhisper/openaiWhisper";
import { whispercpp } from "@/features/whispercpp/whispercpp";
import { config } from "@/utils/config";
import { WaveFile } from "wavefile";
import { AmicaLifeContext } from "@/features/amicaLife/amicaLifeContext";
import { AudioControlsContext } from "@/features/moshi/components/audioControlsContext";
import { perfMark } from "@/utils/perf";
import { logger } from "@/utils/logger";
const mlog = logger.with({ subsystem: "ui", module: "messageInput" });

export default function MessageInput({
  userMessage,
  setUserMessage,
  isChatProcessing,
  onChangeUserMessage,
}: {
  userMessage: string;
  setUserMessage: (message: string) => void;
  isChatProcessing: boolean;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}) {
  const transcriber = useTranscriber();
  const inputRef = useRef<HTMLInputElement>(null);
  type TranscriptResult = { text: string } | string | null;
  const [whisperOpenAIOutput, setWhisperOpenAIOutput] =
    useState<TranscriptResult>(null);
  const [whisperCppOutput, setWhisperCppOutput] =
    useState<TranscriptResult>(null);
  const { chat: bot } = useContext(ChatContext);
  const { alert } = useContext(AlertContext);
  const { amicaLife } = useContext(AmicaLifeContext);
  const { audioControls: moshi } = useContext(AudioControlsContext);
  const [moshiMuted, setMoshiMuted] = useState(moshi.isMuted());

  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechStart: () => {
      logger.debug("vad on_speech_start");
      perfMark("stt:vad:start");
      mlog.time("performance_speech");
    },
    onSpeechEnd: (audio: Float32Array) => {
      logger.debug("vad on_speech_end");
      perfMark("stt:vad:end");
      mlog.timeEnd("performance_speech");
      mlog.time("performance_transcribe");
      (
        window as unknown as {
          chatvrm_latency_tracker?: { start: number; active: boolean };
        }
      ).chatvrm_latency_tracker = { start: Date.now(), active: true };

      try {
        switch (config("stt_backend")) {
          case "whisper_browser": {
            logger.debug("whisper_browser attempt");
            // since VAD sample rate is same as whisper we do nothing here
            // both are 16000
            const audioCtx = new AudioContext();
            const buffer = audioCtx.createBuffer(1, audio.length, 16000);
            // Convert Float32Array to regular array for compatibility
            const audioArray = Array.from(audio);
            buffer.copyToChannel(new Float32Array(audioArray), 0, 0);
            perfMark("stt:transcribe:start");
            transcriber.start(buffer);
            break;
          }
          case "whisper_openai": {
            logger.debug("whisper_openai attempt");
            const wav = new WaveFile();
            wav.fromScratch(1, 16000, "32f", Array.from(audio));
            const wavBuffer = wav.toBuffer();
            const file = new File([wavBuffer.slice()], "input.wav", {
              type: "audio/wav",
            });

            let prompt;
            // TODO load prompt if it exists

            (async () => {
              try {
                const transcript = await openaiWhisper(file, prompt);
                setWhisperOpenAIOutput(transcript);
                perfMark("stt:transcribe:done");
              } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e));
                logger.error("whisper_openai error", err);
                alert.error("whisper_openai error", err.message);
              }
            })();
            break;
          }
          case "whispercpp": {
            logger.debug("whispercpp attempt");
            const wav = new WaveFile();
            wav.fromScratch(1, 16000, "32f", Array.from(audio));
            wav.toBitDepth("16");
            const wavBuffer = wav.toBuffer();
            const file = new File([wavBuffer.slice()], "input.wav", {
              type: "audio/wav",
            });

            let prompt;
            // TODO load prompt if it exists

            (async () => {
              try {
                const transcript = await whispercpp(file, prompt);
                setWhisperCppOutput(transcript);
                perfMark("stt:transcribe:done");
              } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e));
                logger.error("whispercpp error", err);
                alert.error("whispercpp error", err.message);
              }
            })();
            break;
          }
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.error("stt_backend error", err);
        alert.error("STT backend error", err.message);
      }
    },
  });

  if (vad.errored) {
    logger.error("vad error", vad.errored);
  }

  function handleTranscriptionResult(preprocessed: string) {
    const cleanText = cleanTranscript(preprocessed);
    const wakeWordEnabled = config("wake_word_enabled") === "true";
    const textStartsWithWakeWord =
      wakeWordEnabled &&
      cleanFromPunctuation(cleanText).startsWith(
        cleanFromPunctuation(config("wake_word")),
      );
    const text =
      wakeWordEnabled && textStartsWithWakeWord
        ? cleanFromWakeWord(cleanText, config("wake_word"))
        : cleanText;

    if (wakeWordEnabled) {
      // Text start with wake word
      if (textStartsWithWakeWord) {
        // Pause amicaLife and update bot's awake status when speaking
        if (config("amica_life_enabled") === "true") {
          amicaLife.pause();
        }
        bot.updateAwake();
        // Case text doesn't start with wake word and not receive trigger message in amica life
      } else {
        if (
          config("amica_life_enabled") === "true" &&
          amicaLife.triggerMessage !== true &&
          !bot.isAwake()
        ) {
          bot.updateAwake();
        }
      }
    } else {
      // If wake word off, update bot's awake when speaking
      if (config("amica_life_enabled") === "true") {
        amicaLife.pause();
        bot.updateAwake();
      }
    }

    if (text === "") {
      return;
    }

    if (config("autosend_from_mic") === "true") {
      if (!wakeWordEnabled || bot.isAwake()) {
        bot.receiveMessageFromUser(text, false);
      }
    } else {
      setUserMessage(text);
    }
    mlog.timeEnd("performance_transcribe");
    perfMark("stt:transcribe:done");
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    onChangeUserMessage(event);

    // Pause amicaLife and update bot's awake status when typing
    if (config("amica_life_enabled") === "true") {
      amicaLife.pause();
      bot.updateAwake();
    }
  }

  // for whisper_browser
  useEffect(() => {
    if (transcriber.output && !transcriber.isBusy) {
      const output = transcriber.output?.text;
      handleTranscriptionResult(output);
    }
  }, [transcriber]);

  const extractTranscript = (val: TranscriptResult): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val.text;
  };

  // for whisper_openai
  useEffect(() => {
    if (whisperOpenAIOutput) {
      handleTranscriptionResult(extractTranscript(whisperOpenAIOutput));
    }
  }, [whisperOpenAIOutput]);

  // for whispercpp
  useEffect(() => {
    if (whisperCppOutput) {
      handleTranscriptionResult(extractTranscript(whisperCppOutput));
    }
  }, [whisperCppOutput]);

  function clickedSendButton() {
    bot.receiveMessageFromUser(userMessage, false);
    // only if we are using non-VAD mode should we focus on the input
    if (!vad.listening) {
      if (!hasOnScreenKeyboard()) {
        inputRef.current?.focus();
      }
    }
    setUserMessage("");
  }

  return (
    <div className="z-floating fixed bottom-2 w-full">
      <div className="mx-auto max-w-4xl rounded-lg border-0 p-2 backdrop-blur-lg">
        <div className="grid grid-flow-col grid-cols-[min-content_1fr_min-content] gap-[8px]">
          <div>
            <div className="flex flex-col items-center justify-center">
              {config("chatbot_backend") === "moshi" ? (
                <IconButton
                  iconName={!moshiMuted ? "24/PauseAlt" : "24/Microphone"}
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
                  isProcessing={moshiMuted && moshi.getRecorder() != null}
                  disabled={!moshi.getRecorder()}
                  onClick={() => {
                    moshi.toggleMute();
                    setMoshiMuted(!moshiMuted);
                  }}
                />
              ) : (
                <IconButton
                  iconName={vad.listening ? "24/PauseAlt" : "24/Microphone"}
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
                  isProcessing={vad.userSpeaking}
                  disabled={
                    config("stt_backend") === "none" ||
                    vad.loading ||
                    Boolean(vad.errored)
                  }
                  onClick={vad.toggle}
                />
              )}
            </div>
          </div>

          <input
            type="text"
            ref={inputRef}
            placeholder={
              config("chatbot_backend") === "moshi"
                ? "Disabled in moshi chatbot"
                : "Write message here..."
            }
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (hasOnScreenKeyboard()) {
                  inputRef.current?.blur();
                }

                if (userMessage === "") {
                  return false;
                }

                clickedSendButton();
              }
            }}
            disabled={config("chatbot_backend") === "moshi"}
            className="disabled input-base placeholder:text-muted/60 block w-full"
            value={userMessage}
            autoComplete="off"
          />

          <div className="flex flex-col items-center justify-center">
            <IconButton
              iconName="24/Send"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled ml-2"
              isProcessing={isChatProcessing || transcriber.isBusy}
              disabled={
                isChatProcessing ||
                !userMessage ||
                transcriber.isModelLoading ||
                config("chatbot_backend") === "moshi"
              }
              onClick={clickedSendButton}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
