import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { config, updateConfig } from "@/utils/config";
import clsx from "clsx";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

export function LocalXTTSSettingsPage({
  localXTTSUrl,
  setLocalXTTSUrl,
  setSettingsUpdated,
}: {
  localXTTSUrl: string;
  setLocalXTTSUrl: (key: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize states with saved values from config
  const [serverVersion, setServerVersion] = useState(
    config("alltalk_version") || "v2",
  );
  const [voices, setVoices] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(
    config("alltalk_voice") || "",
  );
  const [language, setLanguage] = useState(config("alltalk_language") || "en");
  const [serverStatus, setServerStatus] = useState("unchecked");
  const [rvcVoices, setRvcVoices] = useState<string[]>(["Disabled"]);
  const [selectedRvcVoice, setSelectedRvcVoice] = useState(
    config("alltalk_rvc_voice") || "Disabled",
  );
  const [rvcPitch, setRvcPitch] = useState(config("alltalk_rvc_pitch") || "0");

  const languages = {
    English: "en",
    French: "fr",
    German: "de",
    Spanish: "es",
    Italian: "it",
    Portuguese: "pt",
    Dutch: "nl",
    Polish: "pl",
    Turkish: "tr",
    Russian: "ru",
    Chinese: "zh-cn",
    Japanese: "ja",
    Korean: "ko",
    Arabic: "ar",
    Czech: "cs",
    Hungarian: "hu",
    Hindi: "hi",
  };

  const checkServerStatus = async () => {
    try {
      setLoading(true);
      // Remove any trailing slashes from the URL
      const baseUrl = localXTTSUrl.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/ready`);
      if (response.ok) {
        const status = await response.text();
        setServerStatus(status === "Ready" ? "ready" : "not-ready");
      } else {
        setServerStatus("error");
      }
    } catch (err) {
      setServerStatus("error");
      setError("Failed to connect to AllTalk server");
    } finally {
      setLoading(false);
    }
  };

  const fetchVoices = async () => {
    try {
      setLoading(true);
      // Remove any trailing slashes from the URL
      const baseUrl = localXTTSUrl.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/voices`);
      if (response.ok) {
        const data = await response.json();
        if (data.voices && Array.isArray(data.voices)) {
          setVoices(data.voices);
          if (data.voices.length > 0 && !selectedVoice) {
            setSelectedVoice(data.voices[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching voices:", err);
      setError("Failed to fetch voices");
    } finally {
      setLoading(false);
    }
  };

  const fetchRvcVoices = async () => {
    try {
      const baseUrl = localXTTSUrl.replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/api/rvcvoices`);
      if (response.ok) {
        const data = await response.json();
        if (data.rvcvoices && Array.isArray(data.rvcvoices)) {
          setRvcVoices(data.rvcvoices);
        }
      }
    } catch (err) {
      console.error("Error fetching RVC voices:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!localXTTSUrl) return;

      setLoading(true);
      try {
        // Check server status first
        await checkServerStatus();

        // Load standard voices if needed
        if (
          voices.length === 0 ||
          !voices.includes(config("alltalk_voice") || "")
        ) {
          console.log("[AllTalk] Fetching standard voices");
          await fetchVoices();
        }

        // Load RVC voices if using V2 and voices not loaded
        if (
          config("alltalk_version") === "v2" &&
          (rvcVoices.length <= 1 ||
            !rvcVoices.includes(config("alltalk_rvc_voice") || "Disabled"))
        ) {
          console.log("[AllTalk] Fetching RVC voices");
          await fetchRvcVoices();
        }

        // Set initial voice selections from saved config
        const savedVoice = config("alltalk_voice");
        if (savedVoice && voices.includes(savedVoice)) {
          setSelectedVoice(savedVoice);
        }

        const savedRvcVoice = config("alltalk_rvc_voice");
        if (savedRvcVoice && rvcVoices.includes(savedRvcVoice)) {
          setSelectedRvcVoice(savedRvcVoice);
        }
      } catch (err) {
        console.error("[AllTalk] Error loading data:", err);
        setError("Failed to load voice data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [localXTTSUrl]);

  const handleRefresh = () => {
    checkServerStatus();
    fetchVoices();
  };

  const handlePreviewVoice = async () => {
    try {
      setLoading(true);
      const baseUrl = localXTTSUrl.replace(/\/+$/, "");
      const formData = new URLSearchParams({
        voice: selectedVoice,
      });

      const response = await fetch(`${baseUrl}/api/previewvoice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Preview failed");
      }

      const data = await response.json();
      const audioUrl =
        config("alltalk_version") === "v1"
          ? data.output_file_url
          : `${baseUrl}${data.output_file_url}`;

      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      console.error("Preview error:", err);
      setError("Failed to preview voice");
    } finally {
      setLoading(false);
    }
  };

  if (config("tts_backend") !== "localXTTS") {
    return (
      <div className="bg-warning/10 border-warning/40 rounded-md border p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon
              className="text-warning h-5 w-5"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3">
            <h3 className="text-warning text-sm font-medium">
              {t(
                "not_using_alert",
                "You are not currently using {{name}} as your {{what}} backend. These settings will not be used.",
                { name: t("AllTalk TTS"), what: t("TTS") },
              )}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-subtle">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text text-lg leading-6 font-medium">
            {t("AllTalk TTS Settings")}
          </h3>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className={clsx(
              "bg-primary hover:bg-primary-hover active:bg-primary-press focus-visible:ring-primary focus-visible:ring-offset-surface rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              loading && "cursor-not-allowed opacity-50",
            )}>
            {loading ? t("Loading...") : t("Refresh")}
          </button>
        </div>

        {error && (
          <div className="bg-danger/10 border-danger/40 mb-4 rounded-md border p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-danger text-sm font-medium">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-y-6">
          <div>
            <label
              htmlFor="url"
              className="text-muted block text-xs font-medium tracking-wide uppercase">
              {t("Server URL")}
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="url"
                id="url"
                value={localXTTSUrl}
                onChange={(event) => {
                  setLocalXTTSUrl(event.target.value);
                  updateConfig("localXTTS_url", event.target.value);
                  setSettingsUpdated(true);
                }}
                className="input-base block w-full"
                placeholder="http://localhost:7851"
              />
            </div>
          </div>

          <div>
            <Listbox
              value={serverVersion}
              onChange={(value) => {
                setServerVersion(value);
                updateConfig("alltalk_version", value);
                setSettingsUpdated(true);
              }}>
              <Listbox.Label className="text-muted block text-xs font-medium tracking-wide uppercase">
                {t("Server Version")}
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button className="input-base relative w-full cursor-default py-2 pr-10 pl-3 text-left">
                  <span className="block truncate">{serverVersion}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="text-muted h-5 w-5"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0">
                  <Listbox.Options className="bg-surface-alt/95 shadow-subtle border-border/50 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 text-base backdrop-blur focus:outline-none sm:text-sm">
                    {["v1", "v2"].map((version) => (
                      <Listbox.Option
                        key={version}
                        value={version}
                        className={({ active }) =>
                          clsx(
                            active ? "bg-primary text-white" : "text",
                            "relative cursor-default py-2 pr-9 pl-3 select-none",
                          )
                        }>
                        {({ selected, active }) => (
                          <>
                            <span
                              className={clsx(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate",
                              )}>
                              {`AllTalk ${version}`}
                            </span>
                            {selected && (
                              <span
                                className={clsx(
                                  active ? "text-white" : "text-primary",
                                  "absolute inset-y-0 right-0 flex items-center pr-4",
                                )}>
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <div>
            <Listbox
              value={selectedVoice}
              onChange={(value) => {
                setSelectedVoice(value);
                updateConfig("alltalk_voice", value);
                setSettingsUpdated(true);
              }}>
              <Listbox.Label className="text-muted block text-xs font-medium tracking-wide uppercase">
                {t("Voice")}
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button className="input-base relative w-full cursor-default py-2 pr-10 pl-3 text-left">
                  <span className="block truncate">
                    {selectedVoice || t("Select voice")}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="text-muted h-5 w-5"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0">
                  <Listbox.Options className="bg-surface-alt/95 shadow-subtle border-border/50 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 text-base backdrop-blur focus:outline-none sm:text-sm">
                    {voices.map((voice) => (
                      <Listbox.Option
                        key={voice}
                        value={voice}
                        className={({ active }) =>
                          clsx(
                            active ? "bg-primary text-white" : "text",
                            "relative cursor-default py-2 pr-9 pl-3 select-none",
                          )
                        }>
                        {({ selected, active }) => (
                          <>
                            <span
                              className={clsx(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate",
                              )}>
                              {voice}
                            </span>
                            {selected && (
                              <span
                                className={clsx(
                                  active ? "text-white" : "text-primary",
                                  "absolute inset-y-0 right-0 flex items-center pr-4",
                                )}>
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* RVC Voice Selection */}
          <div>
            <Listbox
              value={selectedRvcVoice}
              onChange={(value) => {
                setSelectedRvcVoice(value);
                updateConfig("alltalk_rvc_voice", value);
                setSettingsUpdated(true);
              }}>
              <Listbox.Label className="text-muted block text-xs font-medium tracking-wide uppercase">
                {t("RVC Voice")}
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button className="input-base relative w-full cursor-default py-2 pr-10 pl-3 text-left">
                  <span className="block truncate">{selectedRvcVoice}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="text-muted h-5 w-5"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0">
                  <Listbox.Options className="bg-surface-alt/95 shadow-subtle border-border/50 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 text-base backdrop-blur focus:outline-none sm:text-sm">
                    {rvcVoices.map((voice) => (
                      <Listbox.Option
                        key={voice}
                        value={voice}
                        className={({ active }) =>
                          clsx(
                            active ? "bg-primary text-white" : "text",
                            "relative cursor-default py-2 pr-9 pl-3 select-none",
                          )
                        }>
                        {({ selected, active }) => (
                          <>
                            <span
                              className={clsx(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate",
                              )}>
                              {voice}
                            </span>
                            {selected && (
                              <span
                                className={clsx(
                                  active ? "text-white" : "text-primary",
                                  "absolute inset-y-0 right-0 flex items-center pr-4",
                                )}>
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* RVC Pitch Selector - no extra margin needed */}
          <div>
            <label className="text-muted block text-xs font-medium tracking-wide uppercase">
              {t("RVC Pitch")} (-24 to 24)
            </label>
            <div className="mt-1">
              <input
                type="number"
                min="-24"
                max="24"
                value={rvcPitch}
                onChange={(e) => {
                  const value = Math.max(
                    -24,
                    Math.min(24, parseInt(e.target.value) || 0),
                  );
                  setRvcPitch(value.toString());
                  updateConfig("alltalk_rvc_pitch", value.toString());
                  setSettingsUpdated(true);
                }}
                className="input-base block w-full"
              />
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <Listbox
              value={language}
              onChange={(value) => {
                setLanguage(value);
                updateConfig("alltalk_language", value);
                setSettingsUpdated(true);
              }}>
              <Listbox.Label className="text-muted block text-xs font-medium tracking-wide uppercase">
                {t("Language")}
              </Listbox.Label>
              <div className="relative mt-1">
                <Listbox.Button className="input-base relative w-full cursor-default py-2 pr-10 pl-3 text-left">
                  <span className="block truncate">
                    {Object.entries(languages).find(
                      ([, code]) => code === language,
                    )?.[0] || language}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="text-muted h-5 w-5"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0">
                  <Listbox.Options className="bg-surface-alt/95 shadow-subtle border-border/50 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 text-base backdrop-blur focus:outline-none sm:text-sm">
                    {Object.entries(languages).map(([label, code]) => (
                      <Listbox.Option
                        key={code}
                        value={code}
                        className={({ active }) =>
                          clsx(
                            active ? "bg-primary text-white" : "text",
                            "relative cursor-default py-2 pr-9 pl-3 select-none",
                          )
                        }>
                        {({ selected, active }) => (
                          <>
                            <span
                              className={clsx(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate",
                              )}>
                              {label}
                            </span>
                            {selected && (
                              <span
                                className={clsx(
                                  active ? "text-white" : "text-primary",
                                  "absolute inset-y-0 right-0 flex items-center pr-4",
                                )}>
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* Preview Button - use grid gap instead of margin */}
          <div>
            <button
              type="button"
              onClick={handlePreviewVoice}
              disabled={loading || !selectedVoice}
              className={clsx(
                "bg-primary hover:bg-primary-hover active:bg-primary-press focus-visible:ring-primary focus-visible:ring-offset-surface rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                (loading || !selectedVoice) && "cursor-not-allowed opacity-50",
              )}>
              {t("Preview Voice")}
            </button>
          </div>

          {/* Server Status - use grid gap instead of margin */}
          <div
            className={clsx(
              "mt-4 rounded-md border p-4",
              serverStatus === "ready"
                ? "bg-success/10 border-success/40"
                : "bg-surface-alt/60 border-border/50",
              serverStatus === "error" && "bg-danger/10 border-danger/40",
            )}>
            <div className="flex">
              <div className="ml-3">
                <h3
                  className={clsx(
                    "text-sm font-medium",
                    serverStatus === "ready" && "text-success",
                    serverStatus === "error" && "text-danger",
                    serverStatus === "not-ready" && "text",
                  )}>
                  {t("Server Status")}:{" "}
                  {serverStatus === "ready" && t("Connected and ready")}
                  {serverStatus === "not-ready" && t("Server is not ready")}
                  {serverStatus === "error" && t("Failed to connect to server")}
                  {serverStatus === "unchecked" &&
                    t("Server status not checked")}
                </h3>
              </div>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="text-muted text-sm">
            <a
              href="https://github.com/erew123/alltalk_tts/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover">
              {t("View AllTalk Documentation")} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
