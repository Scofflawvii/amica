import { createHash } from "crypto";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useState, useEffect, useRef } from "react";
import { logger } from "@/utils/logger";
const slog = logger.with({ subsystem: "page", route: "/share" });
import { useTranslation } from "react-i18next";

import { config, updateConfig } from "@/utils/config";
import { isTauri } from "@/utils/isTauri";
import { FilePond, registerPlugin } from "react-filepond";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import VrmDemo from "@/components/vrmDemo";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";

import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";

import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import { vrmDataProvider } from "@/features/vrmStore/vrmDataProvider";
import { IconButton } from "@/components/iconButton";
import { TextButton } from "@/components/textButton";

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashValue = createHash("sha256")
    .update(new Uint8Array(buffer))
    .digest("hex");
  return hashValue;
}

async function updateVrmAvatar(viewer: any, url: string) {
  try {
    await viewer.loadVrm(url, (progress: string) => {
      // TODO handle loading progress
    });
  } catch (e) {
    slog.error("updateVrmAvatar error", e);
  }
}

function vrmDetector(source: File, type: string): Promise<string> {
  return new Promise((resolve, reject) => {
    slog.debug("vrmDetector source", source);
    (async () => {
      const ab = await source.arrayBuffer();
      const buf = Buffer.from(ab);
      if (buf.slice(0, 4).toString() === "glTF") {
        resolve("model/gltf-binary");
      } else {
        resolve("unknown");
      }
    })();
  });
}

export default function Share() {
  const { t } = useTranslation();
  const { viewer } = useContext(ViewerContext);

  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [visionSystemPrompt, setVisionSystemPrompt] = useState("");
  const [bgUrl, setBgUrl] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [vrmUrl, setVrmUrl] = useState("");
  const [vrmHash, setVrmHash] = useState("");
  const [vrmSaveType, setVrmSaveType] = useState("");
  const [animationUrl, setAnimationUrl] = useState("");
  const [voiceUrl, setVoiceUrl] = useState("");

  const [bgFiles, setBgFiles] = useState([]);
  const [vrmFiles, setVrmFiles] = useState([]);
  const [animationFiles, setAnimationFiles] = useState([]);
  const [voiceFiles, setVoiceFiles] = useState([]);

  const [vrmLoaded, setVrmLoaded] = useState(false);
  const [vrmLoadedFromIndexedDb, setVrmLoadedFromIndexedDb] = useState(false);
  const [vrmLoadingFromIndexedDb, setVrmLoadingFromIndexedDb] = useState(false);
  const [showUploadLocalVrmMessage, setShowUploadLocalVrmMessage] =
    useState(false);

  const [sqid, setSqid] = useState("");

  const vrmUploadFilePond = useRef<FilePond | null>(null);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  async function uploadVrmFromIndexedDb() {
    const blob = await vrmDataProvider.getItemAsBlob(vrmHash);
    if (vrmUploadFilePond.current && blob) {
      vrmUploadFilePond.current.addFile(blob).then(() => {
        setVrmLoadingFromIndexedDb(true);
      });
    } else {
      slog.debug("FilePond not loaded, retry in 0.5 sec");
      delay(500).then(uploadVrmFromIndexedDb);
    }
  }

  useEffect(() => {
    setName(config("name"));
    setSystemPrompt(config("system_prompt"));
    setVisionSystemPrompt(config("vision_system_prompt"));
    if (!config("bg_url").startsWith("data")) {
      setBgUrl(config("bg_url"));
    }
    setYoutubeVideoId(config("youtube_videoid"));
    setVrmUrl(config("vrm_url"));
    setVrmHash(config("vrm_hash"));
    setVrmSaveType(config("vrm_save_type"));
    setAnimationUrl(config("animation_url"));
    setVoiceUrl(config("voice_url"));
  }, []);

  useEffect(() => {
    if (vrmLoadedFromIndexedDb) {
      vrmDataProvider.addItemUrl(vrmHash, vrmUrl);
      updateConfig("vrm_url", vrmUrl);
      updateConfig("vrm_save_type", "web");
      setVrmSaveType("web");
    }
  }, [vrmLoadedFromIndexedDb]);

  useEffect(() => {
    setShowUploadLocalVrmMessage(
      vrmSaveType == "local" &&
        !vrmLoadedFromIndexedDb &&
        !vrmLoadingFromIndexedDb,
    );
  }, [vrmSaveType, vrmLoadedFromIndexedDb, vrmLoadingFromIndexedDb]);

  const [isRegistering, setIsRegistering] = useState(false);
  function registerCharacter() {
    setIsRegistering(true);

    async function register() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AMICA_API_URL}/api/add_character`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description,
            name,
            system_prompt: systemPrompt,
            vision_system_prompt: visionSystemPrompt,
            bg_url: bgUrl,
            youtube_videoid: youtubeVideoId,
            vrm_url: vrmUrl,
            animation_url: animationUrl,
            voice_url: voiceUrl,
          }),
        },
      );

      const data = await res.json();
      slog.debug("registerCharacter response", data);

      setSqid(data.sqid);

      setIsRegistering(false);
    }

    register();
  }

  const router = useRouter();

  const handleCloseIcon = () => {
    router.push("/");
  };

  useEffect(() => {
    document.body.style.backgroundImage = `url(/liquid-metaballs.jpg)`;
    document.body.style.backgroundSize = `cover`;
    document.body.style.backgroundRepeat = `no-repeat`;
    document.body.style.backgroundPosition = `bottom right`;
  }, []);

  return (
    <div className="p-10 md:p-20">
      <style jsx global>
        {`
          body {
            background-image: url("/liquid-metaballs.jpg");
            background-size: cover;
            background-repeat: no-repeat;
            background-position: bottom right;
          }
        `}
      </style>
      <div className="z-floating fixed top-0 left-0 max-h-full w-full text-left text-xs text-[hsl(var(--text))]">
        <div className="bg-surface-alt/80 border-border/40 border-b p-2 backdrop-blur">
          <IconButton
            iconName="24/Close"
            isProcessing={false}
            className="bg-secondary hover:bg-secondary-hover active:bg-secondary-active"
            onClick={handleCloseIcon}
          />
        </div>
      </div>
      <div className="col-span-3 mt-4 max-w-md rounded-xl">
        <h1 className="text-lg">{t("Character Creator")}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              {t("Description")}
            </label>
            <div className="mt-2">
              <textarea
                rows={4}
                className="input-base placeholder:text-muted/60 block w-full"
                value={description}
                readOnly={!!sqid}
                placeholder={t("Provide a description of the character")}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              {t("Name")}
            </label>
            <div className="mt-2">
              <input
                type="text"
                className="input-base placeholder:text-muted/60 block w-full"
                value={name}
                readOnly={!!sqid}
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              {t("System Prompt")}
            </label>
            <div className="mt-2">
              <textarea
                rows={4}
                className="input-base placeholder:text-muted/60 block w-full"
                value={systemPrompt}
                readOnly={!!sqid}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              {t("Vision System Prompt")}
            </label>
            <div className="mt-2">
              <textarea
                rows={4}
                className="input-base placeholder:text-muted/60 block w-full"
                value={visionSystemPrompt}
                readOnly={!!sqid}
                onChange={(e) => {
                  setVisionSystemPrompt(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              {t("Background URL")}
            </label>
            <div className="mt-2">
              <input
                type="text"
                className="input-base placeholder:text-muted/60 block w-full"
                value={bgUrl}
                readOnly={!!sqid}
                onChange={(e) => {
                  setBgUrl(e.target.value);
                }}
              />
              <FilePond
                files={bgFiles}
                // this is done to remove type error
                // filepond is not typed properly
                onupdatefiles={(files: any) => {
                  setBgFiles(files);
                }}
                server={`${process.env.NEXT_PUBLIC_AMICA_API_URL}/api/upload?type=bgimg`}
                name="file"
                labelIdle=".png & .jpg files only<br />click or drag & drop"
                acceptedFileTypes={["image/png", "image/jpeg"]}
                onremovefile={(err, file) => {
                  if (err) {
                    slog.error("canvas export error", err);
                    return;
                  }

                  setBgUrl("");
                }}
                onprocessfile={(err, file) => {
                  if (err) {
                    slog.error("video export error", err);
                    return;
                  }

                  async function handleFile(file: File) {
                    const hashValue = await hashFile(file);
                    setBgUrl(
                      `${process.env.NEXT_PUBLIC_AMICA_STORAGE_URL}/${hashValue}`,
                    );
                  }

                  handleFile(file.file as File);
                }}
                disabled={!!sqid}
              />
            </div>
          </div>

          <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              {t("YouTube Video ID")}
            </label>
            <div className="mt-2">
              <p className="text-xs text-slate-500">
                {t("Example")}: https://www.youtube.com/watch?v=
                <span className="text-red-500">dQw4w9WgXcQ</span>
              </p>
              <input
                type="text"
                className="input-base placeholder:text-muted/60 block w-full"
                value={youtubeVideoId}
                readOnly={!!sqid}
                onChange={(e) => {
                  setYoutubeVideoId(e.target.value);
                }}
              />
              {youtubeVideoId && (
                <img
                  width="100%"
                  src={`https://img.youtube.com/vi/${youtubeVideoId}/0.jpg`}
                />
              )}
            </div>
          </div>

          {showUploadLocalVrmMessage && (
            <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
              <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
                {t("Upload VRM")}
              </label>
              <div className="mt-2 text-sm leading-6">
                <p>{t("VRM upload message")}</p>
                <p>{t("VRM local share message")}</p>
                <div className="mt-2 max-w-md rounded-xl sm:col-span-3">
                  <TextButton
                    onClick={uploadVrmFromIndexedDb}
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">
                    {t("Upload Vrm")}
                  </TextButton>
                </div>
              </div>
            </div>
          )}

          <div
            className={
              "mt-4 max-w-md rounded-xl sm:col-span-3" +
              (!showUploadLocalVrmMessage ? "" : " hidden")
            }>
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              {t("VRM Url")}
            </label>
            <div className="mt-2">
              <p className="text-xs text-slate-500"></p>
              <input
                type="text"
                className="input-base placeholder:text-muted/60 block w-full"
                value={vrmUrl}
                readOnly={!!sqid}
                onChange={(e) => {
                  setVrmUrl(e.target.value);
                  updateVrmAvatar(viewer, e.target.value);
                  setVrmLoaded(false);
                }}
              />
              <FilePond
                ref={vrmUploadFilePond}
                files={vrmFiles}
                // this is done to remove type error
                // filepond is not typed properly
                onupdatefiles={(files: any) => {
                  setVrmFiles(files);
                }}
                server={`${process.env.NEXT_PUBLIC_AMICA_API_URL}/api/upload?type=vrm`}
                name="file"
                labelIdle=".vrm files only<br />click or drag & drop"
                acceptedFileTypes={["model/gltf-binary"]}
                fileValidateTypeDetectType={vrmDetector}
                onaddfilestart={(file) => {
                  setVrmUrl("");
                  setVrmLoaded(false);
                }}
                onremovefile={(err, file) => {
                  if (err) {
                    slog.error("vrm removefile error", err);
                    return;
                  }

                  setVrmUrl("");
                  setVrmLoaded(false);
                }}
                onprocessfile={(err, file) => {
                  if (err) {
                    slog.error("vrm processfile error", err);
                    return;
                  }

                  async function handleFile(file: File) {
                    const hashValue = await hashFile(file);
                    const url = `${process.env.NEXT_PUBLIC_AMICA_STORAGE_URL}/${hashValue}`;
                    setVrmUrl(url);
                    updateVrmAvatar(viewer, url);
                    if (vrmSaveType == "local") {
                      setVrmLoadingFromIndexedDb(false);
                      setVrmLoadedFromIndexedDb(true);
                    }
                    setVrmLoaded(false);
                  }

                  handleFile(file.file as File);
                }}
                disabled={!!sqid}
              />

              <div className="bg-surface-alt/50 border-border/30 mt-4 max-w-md rounded-xl border sm:col-span-3">
                {vrmUrl && (
                  <VrmDemo
                    vrmUrl={vrmUrl}
                    onLoaded={() => {
                      setVrmLoaded(true);
                      (async () => {
                        try {
                          const animation = await loadVRMAnimation(
                            "/animations/idle_loop.vrma",
                          );
                          if (!animation) {
                            slog.error("loading animation failed");
                            return;
                          }
                          viewer.model!.loadAnimation(animation!);
                          requestAnimationFrame(() => {
                            viewer.resetCamera();
                          });
                        } catch (e) {
                          slog.error("loading animation failed", e);
                        }
                      })();
                      slog.info("vrm demo loaded");
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/*
          <div className="sm:col-span-3 max-w-md rounded-xl mt-4">
              <label className="block text-xs font-medium leading-6 text-muted uppercase tracking-wide">
              Animation Url
            </label>
            <div className="mt-2">
              <input
                type="text"
                className="block w-full input-base placeholder:text-muted/60"
                value={animationUrl}
                readOnly={!! sqid}
                onChange={(e) => {
                  setAnimationUrl(e.target.value);
                }}
              />
              <FilePond
                files={animationFiles}
                // this is done to remove type error
                // filepond is not typed properly
                onupdatefiles={(files: any) => {
                  setAnimationFiles(files);
                }}
                // TODO read this url from env
                server={`${process.env.NEXT_PUBLIC_AMICA_API_URL}/api/upload?type=anim`}
                name="file"
                labelIdle='.vrm files only<br />click or drag & drop'
                acceptedFileTypes={['model/gltf-binary']}
                fileValidateTypeDetectType={vrmDetector}
                onremovefile={(err, file) => {
                  if (err) {
                    slog.error("vrm load error", err);
                    return;
                  }

                  setAnimationUrl('');
                }}
                onprocessfile={(err, file) => {
                  if (err) {
                    slog.error("room load error", err);
                    return;
                  }

                  async function handleFile(file: File) {
                    const hashValue = await hashFile(file);
                    setAnimationUrl(`${process.env.NEXT_PUBLIC_AMICA_STORAGE_URL}/${hashValue}`);
                  }

                  handleFile(file.file as File);
                }}
                disabled={!! sqid}
              />
            </div>
          </div>
          */}

          <div className="mt-4 max-w-md rounded-xl sm:col-span-3">
            <label className="text-muted block text-xs leading-6 font-medium tracking-wide uppercase">
              Voice Url
            </label>
            <div className="mt-2">
              <input
                type="text"
                className="input-base placeholder:text-muted/60 block w-full"
                value={voiceUrl}
                readOnly={!!sqid}
                onChange={(e) => {
                  setVoiceUrl(e.target.value);
                }}
              />
              <FilePond
                files={voiceFiles}
                // this is done to remove type error
                // filepond is not typed properly
                onupdatefiles={(files: any) => {
                  setVoiceFiles(files);
                }}
                server={`${process.env.NEXT_PUBLIC_AMICA_API_URL}/api/upload?type=voice`}
                name="file"
                labelIdle=".wav & .mp3 files only<br />click or drag & drop"
                acceptedFileTypes={["audio/wav", "audio/mpeg"]}
                onremovefile={(err, file) => {
                  if (err) {
                    slog.error("screenshot error", err);
                    return;
                  }

                  setVoiceUrl("");
                }}
                onprocessfile={(err, file) => {
                  if (err) {
                    slog.error("record error", err);
                    return;
                  }

                  async function handleFile(file: File) {
                    const hashValue = await hashFile(file);
                    setVoiceUrl(
                      `${process.env.NEXT_PUBLIC_AMICA_STORAGE_URL}/${hashValue}`,
                    );
                  }

                  handleFile(file.file as File);
                }}
                disabled={!!sqid}
              />
            </div>
          </div>

          {!sqid && (
            <div className="mt-8 max-w-md rounded-xl sm:col-span-3">
              <TextButton
                onClick={registerCharacter}
                variant="secondary"
                className="px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  !vrmLoaded ||
                  showUploadLocalVrmMessage ||
                  vrmLoadingFromIndexedDb ||
                  isRegistering
                }>
                {t("Save Character")}
              </TextButton>
            </div>
          )}

          {sqid && (
            <div className="mt-8 max-w-md rounded-xl sm:col-span-3">
              <p className="text-sm">{t("Share this code (click to copy):")}</p>
              <input
                type="text"
                className="input-base bg-surface-alt/70 px-2 py-2 text-sm font-medium hover:cursor-copy"
                defaultValue={sqid}
                readOnly
                onClick={(e) => {
                  navigator.clipboard.writeText(
                    (e.target as HTMLInputElement).value,
                  );
                }}
              />
              <p className="mt-6 text-sm">
                {t("Or, you can share this direct link:")}{" "}
                <Link
                  href={`https://amica.arbius.ai/import/${sqid}`}
                  target={isTauri() ? "_blank" : ""}
                  className="text-cyan-600 hover:text-cyan-700">
                  https://amica.arbius.ai/import/{sqid}
                </Link>
              </p>

              <Link href="/">
                <TextButton
                  variant="success"
                  className="mt-6 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">
                  {t("Return Home")}
                </TextButton>
              </Link>
            </div>
          )}
        </div>
        <div>{/* empty column */}</div>
      </div>
    </div>
  );
}
