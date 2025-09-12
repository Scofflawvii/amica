import { useContext, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { M_PLUS_2, Montserrat } from "next/font/google";
import {
  ChatBubbleLeftIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowDownIcon,
  CodeBracketSquareIcon,
  ShareIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  WrenchScrewdriverIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";

// Type for XR Session Mode
type XRSessionMode = "immersive-vr" | "immersive-ar" | "inline";
import { IconBrain } from "@tabler/icons-react";

import { MenuButton } from "@/components/menuButton";
import { AssistantText } from "@/components/assistantText";
import { SubconciousText } from "@/components/subconciousText";
import { AddToHomescreen } from "@/components/addToHomescreen";
import { Alert } from "@/components/alert";
import { UserText } from "@/components/userText";
import { ChatLog } from "@/components/chatLog";
import dynamic from "next/dynamic";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { Introduction } from "@/components/introduction";
import { ArbiusIntroduction } from "@/components/arbiusIntroduction";
import { LoadingProgress } from "@/components/loadingProgress";
// Heavy components dynamically imported to trim main bundle
const VrmViewer = dynamic(() => import("@/components/vrmViewer"), {
  ssr: false,
  loading: () => <div className="z-vrm fixed inset-0" />,
});
const Settings = dynamic(
  () => import("@/components/settings").then((m) => m.Settings),
  { ssr: false, loading: () => <div className="z-modal" /> },
);
const EmbeddedWebcam = dynamic(
  () => import("@/components/embeddedWebcam").then((m) => m.EmbeddedWebcam),
  { ssr: false, loading: () => null },
);
const Moshi = dynamic(
  () => import("@/features/moshi/components/Moshi").then((m) => m.Moshi),
  { ssr: false, loading: () => null },
);

import { ViewerContext } from "@/features/vrmViewer/viewerContext";
// Message and Role types are unused here; remove to reduce lint noise
import { ChatContext } from "@/features/chat/chatContext";
import { useChatUIState } from "@/features/chat/chatUIState";
import { AlertContext } from "@/features/alert/alertContext";

import { config, updateConfig } from "@/utils/config";
import { isTauri } from "@/utils/isTauri";
import { VrmStoreProvider } from "@/features/vrmStore/vrmStoreContext";
import { AmicaLifeContext } from "@/features/amicaLife/amicaLifeContext";
import { ChatModeText } from "@/components/chatModeText";

import { TimestampedPrompt } from "@/features/amicaLife/eventHandler";
import { handleChatLogs } from "@/features/externalAPI/externalAPI";
import { VerticalSwitchBox } from "@/components/switchBox";
import { ThoughtText } from "@/components/thoughtText";
import { GuiLayer } from "@/components/GuiLayer";
import { perfMark, logPerfSummaryOnce } from "@/utils/perf";

const m_plus_2 = M_PLUS_2({
  variable: "--font-m-plus-2",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
});

export default function Home() {
  const { viewer } = useContext(ViewerContext);
  const { alert } = useContext(AlertContext);
  const { chat: bot } = useContext(ChatContext);
  const { amicaLife: amicaLife } = useContext(AmicaLifeContext);

  const {
    chatLog,
    assistantMessage,
    userMessage,
    thoughtMessage,
    shownMessage,
    processing: chatProcessing,
    speaking: chatSpeaking,
  } = useChatUIState();
  const [subconciousLogs, setSubconciousLogs] = useState<TimestampedPrompt[]>(
    [],
  );

  // showContent exists to allow ssr
  // otherwise issues from usage of localStorage and window will occur
  const [showContent, setShowContent] = useState(false);

  const [showArbiusIntroduction, setShowArbiusIntroduction] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  // Debug pane now always opens in external popout window; internal state removed
  const [showChatMode, setShowChatMode] = useState(false);
  const [showSubconciousText, setShowSubconciousText] = useState(false);

  // null indicates havent loaded config yet
  const [muted, setMuted] = useState<boolean | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  const [showStreamWindow, setShowStreamWindow] = useState(false);
  const videoRef = useRef(null);

  const [isVRHeadset] = useState(false);

  useEffect(() => {
    amicaLife.checkSettingOff(!showSettings);
  }, [showSettings, amicaLife]);

  useEffect(() => {
    if (muted === null) {
      setMuted(config("tts_muted") === "true");
    }

    setShowArbiusIntroduction(config("show_arbius_introduction") === "true");

    if (config("bg_color") !== "") {
      document.body.style.backgroundColor = config("bg_color");
    } else {
      document.body.style.backgroundImage = `url(${config("bg_url")})`;
    }
    // Temp Disable : WebXR
    // if (window.navigator.xr && window.navigator.xr.isSessionSupported) {
    //   let deviceInfo = detectVRHeadset();
    //   setIsVRHeadset(deviceInfo.isVRDevice);

    //   window.navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
    //     console.log('ar supported', supported);
    //     setIsARSupported(supported);
    //   });
    //   window.navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
    //     console.log('vr supported', supported);
    //     setIsVRSupported(supported);
    //   });
    // }
  }, []);

  useEffect(() => {
    if (viewer && videoRef.current && showStreamWindow) {
      viewer.startStreaming(videoRef.current);
    } else {
      viewer.stopStreaming();
    }
  }, [viewer, videoRef, showStreamWindow]);

  function toggleTTSMute() {
    updateConfig(
      "tts_muted",
      config("tts_muted") === "true" ? "false" : "true",
    );
    setMuted(config("tts_muted") === "true");
  }

  const toggleState = (
    setFunc: React.Dispatch<React.SetStateAction<boolean>>,
    deps: React.Dispatch<React.SetStateAction<boolean>>[],
  ) => {
    setFunc((prev) => {
      if (!prev) {
        deps.forEach((dep) => dep(false));
      }
      return !prev;
    });
  };

  const toggleChatLog = () => {
    toggleState(setShowChatLog, [setShowSubconciousText, setShowChatMode]);
  };

  const toggleShowSubconciousText = () => {
    if (subconciousLogs.length !== 0) {
      toggleState(setShowSubconciousText, [setShowChatLog, setShowChatMode]);
    }
  };

  const toggleChatMode = () => {
    toggleState(setShowChatMode, [setShowChatLog, setShowSubconciousText]);
  };

  const toggleXR = async (immersiveType: XRSessionMode) => {
    const plog = (await import("@/utils/logger")).logger.with({
      subsystem: "page",
      route: "/",
    });
    plog.info("Toggle XR", { immersiveType });

    if (!window.navigator.xr) {
      plog.error("WebXR not supported");
      return;
    }
    if (!(await window.navigator.xr.isSessionSupported(immersiveType))) {
      plog.error("Session not supported");
      return;
    }

    if (!viewer.isReady) {
      plog.error("Viewer not ready");
      return;
    }

    // TODO should hand tracking be required?
    let optionalFeatures: string[] = ["hand-tracking", "local-floor"];
    if (immersiveType === "immersive-ar") {
      optionalFeatures.push("dom-overlay");
    }

    const sessionInit = {
      optionalFeatures,
      domOverlay: { root: document.body },
    };

    if (viewer.currentSession) {
      viewer.onSessionEnded();

      try {
        await viewer.currentSession.end();
      } catch (err) {
        // some times session already ended not due to user interaction
        plog.warn("XR end session warning", err);
      }

      // @ts-expect-error - WebXR types may not be fully available
      if (window.navigator.xr.offerSession !== undefined) {
        // @ts-expect-error - WebXR navigator types may not be fully available
        const session = await navigator.xr?.offerSession(
          immersiveType,
          sessionInit,
        );
        viewer.onSessionStarted(session, immersiveType);
      }
      return;
    }

    // @ts-expect-error - WebXR types may not be fully available
    if (window.navigator.xr.offerSession !== undefined) {
      // @ts-expect-error - WebXR navigator types may not be fully available
      const session = await navigator.xr?.offerSession(
        immersiveType,
        sessionInit,
      );
      viewer.onSessionStarted(session, immersiveType);
      return;
    }

    try {
      const session = await window.navigator.xr.requestSession(
        immersiveType,
        sessionInit,
      );

      viewer.onSessionStarted(session, immersiveType);
    } catch (err) {
      plog.error("requestSession failed", err);
    }
  };

  useEffect(() => {
    perfMark("chat:init:start");
    bot.initializeWithObserver(amicaLife, viewer, alert);
    perfMark("chat:init:done");

    // TODO remove in future
    // this change was just to make naming cleaner
    if (config("tts_backend") === "openai") {
      updateConfig("tts_backend", "openai_tts");
    }
  }, [bot, viewer]);

  useEffect(() => {
    perfMark("amicaLife:init:start");
    amicaLife.initialize(viewer, bot, setSubconciousLogs, chatSpeaking);
    perfMark("amicaLife:init:done");
    // Attempt summary after core inits (VRM may add later data)
    logPerfSummaryOnce();
  }, [amicaLife, bot, viewer, chatSpeaking]);

  // suppress unused warning if toggleXR not yet wired into UI
  void toggleXR;

  useEffect(() => {
    handleChatLogs(chatLog);
  }, [chatLog]);

  // this exists to prevent build errors with ssr
  useEffect(() => setShowContent(true), []);
  if (!showContent) return <></>;

  return (
    <div className={clsx(m_plus_2.variable, montserrat.variable)}>
      {config("youtube_videoid") !== "" && (
        <div className="video-container z-background fixed h-full w-full">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${config("youtube_videoid")}?&autoplay=1&mute=1&playsinline=1&loop=1&controls=0&disablekb=1&fs=0&playlist=${config("youtube_videoid")}`}
            frameBorder="0"></iframe>
        </div>
      )}

      {/* VRM viewer sits beneath all GUI (z-vrm) */}
      <VrmStoreProvider>
        <VrmViewer chatMode={showChatMode} />
      </VrmStoreProvider>

      <GuiLayer>
        <Introduction open={config("show_introduction") === "true"} />
        <ArbiusIntroduction
          open={showArbiusIntroduction}
          close={() => setShowArbiusIntroduction(false)}
        />
        <LoadingProgress />
        {webcamEnabled && (
          <EmbeddedWebcam setWebcamEnabled={setWebcamEnabled} />
        )}
        {showSettings && (
          <div className="z-modal pointer-events-auto">
            <Settings onClickClose={() => setShowSettings(false)} />
          </div>
        )}
        {showStreamWindow && (
          <div className="z-floating pointer-events-auto fixed top-1/3 right-4 h-[150px] w-[200px]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full rounded-lg object-cover shadow-lg outline outline-2 outline-red-500"
            />
          </div>
        )}
        {/* DebugPane embedded removed; use popout window instead */}
        {config("chatbot_backend") === "moshi" && (
          <Moshi
            setAssistantText={() => {
              /* observer managed */
            }}
          />
        )}
        <div
          id="amica-sidebar"
          className="z-base pointer-events-auto absolute m-2">
          <div className="mt-2 grid grid-flow-col place-content-end gap-[8px] rounded-md bg-slate-800/40 shadow-sm backdrop-blur-md">
            <div className="flex flex-col items-center justify-center space-y-3 p-1">
              <MenuButton
                large={isVRHeadset}
                icon={WrenchScrewdriverIcon}
                onClick={() => setShowSettings(true)}
                label="show settings"
              />

              {showChatLog ? (
                <MenuButton
                  large={isVRHeadset}
                  icon={ChatBubbleLeftIcon}
                  onClick={toggleChatLog}
                  label="hide chat log"
                />
              ) : (
                <MenuButton
                  large={isVRHeadset}
                  icon={ChatBubbleLeftRightIcon}
                  onClick={toggleChatLog}
                  label="show chat log"
                />
              )}

              {muted ? (
                <MenuButton
                  large={isVRHeadset}
                  icon={SpeakerXMarkIcon}
                  onClick={toggleTTSMute}
                  label="unmute"
                />
              ) : (
                <MenuButton
                  large={isVRHeadset}
                  icon={SpeakerWaveIcon}
                  onClick={toggleTTSMute}
                  label="mute"
                />
              )}

              {webcamEnabled ? (
                <MenuButton
                  large={isVRHeadset}
                  icon={VideoCameraIcon}
                  onClick={() => setWebcamEnabled(false)}
                  label="disable webcam"
                />
              ) : (
                <MenuButton
                  large={isVRHeadset}
                  icon={VideoCameraSlashIcon}
                  onClick={() => setWebcamEnabled(true)}
                  label="enable webcam"
                />
              )}

              <MenuButton
                large={isVRHeadset}
                icon={ShareIcon}
                href="/share"
                target={isTauri() ? "" : "_blank"}
                label="share"
              />
              <MenuButton
                large={isVRHeadset}
                icon={CloudArrowDownIcon}
                href="/import"
                label="import"
              />

              {showSubconciousText ? (
                <MenuButton
                  large={isVRHeadset}
                  icon={IconBrain}
                  onClick={toggleShowSubconciousText}
                  label="hide subconscious"
                />
              ) : (
                <MenuButton
                  large={isVRHeadset}
                  icon={IconBrain}
                  onClick={toggleShowSubconciousText}
                  label="show subconscious"
                />
              )}

              <MenuButton
                large={isVRHeadset}
                icon={CodeBracketSquareIcon}
                onClick={() => {
                  try {
                    window.open(
                      "/debug-popout",
                      "amica-debug-popout",
                      "width=700,height=800,resizable,scrollbars",
                    );
                  } catch {
                    /* ignore */
                  }
                }}
                label="debug"
              />

              <div className="flex flex-row items-center space-x-2">
                <VerticalSwitchBox
                  value={showChatMode}
                  label={""}
                  onChange={toggleChatMode}
                />
              </div>

              <div className="flex flex-row items-center space-x-2">
                {showStreamWindow ? (
                  <SignalIcon
                    className="h-7 w-7 text-white opacity-100 hover:cursor-pointer hover:opacity-50 active:opacity-100"
                    aria-hidden="true"
                    onClick={() => setShowStreamWindow(false)}
                  />
                ) : (
                  <SignalIcon
                    className="h-7 w-7 text-white opacity-50 hover:cursor-pointer hover:opacity-100 active:opacity-100"
                    aria-hidden="true"
                    onClick={() => setShowStreamWindow(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {showChatLog && <ChatLog messages={chatLog} />}

        {/* Normal chat text */}
        {!showSubconciousText && !showChatLog && !showChatMode && (
          <>
            {shownMessage === "assistant" && (
              <AssistantText message={assistantMessage} />
            )}
            {shownMessage === "user" && <UserText message={userMessage} />}
          </>
        )}

        {/* Thought text */}
        {thoughtMessage !== "" && <ThoughtText message={thoughtMessage} />}

        {/* Chat mode text */}
        {showChatMode && <ChatModeText messages={chatLog} />}

        {/* Subconcious stored prompt text */}
        {showSubconciousText && <SubconciousText messages={subconciousLogs} />}

        <AddToHomescreen />

        <Alert />

        {/* Message input anchored at bottom */}
        <div className="z-floating pointer-events-auto fixed bottom-0 left-0 w-full p-2">
          <MessageInputContainer isChatProcessing={chatProcessing} />
        </div>
      </GuiLayer>
    </div>
  );
}
