import { useContext, useCallback, useState } from "react";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { config } from "@/utils/config";
import { useVrmStoreContext } from "@/features/vrmStore/vrmStoreContext";
import isTauri from "@/utils/isTauri";
import { invoke } from "@tauri-apps/api/core";
// ChatContext import removed (was unused here after refactor)
import clsx from "clsx";
import { perfMark, logPerfSummaryOnce } from "@/utils/perf";

export default function VrmViewer({ chatMode }: { chatMode: boolean }) {
  const { viewer } = useContext(ViewerContext);
  const { getCurrentVrm, vrmList, vrmListAddFile, isLoadingVrmList } =
    useVrmStoreContext();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [loadingError, setLoadingError] = useState(false);
  const isVrmLocal = "local" == config("vrm_save_type");

  viewer.resizeChatMode(chatMode);
  window.addEventListener("resize", () => {
    viewer.resizeChatMode(chatMode);
  });

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!canvas) return;
      if (isVrmLocal && isLoadingVrmList) return;

      const runSetup = async () => {
        perfMark("vrm:setup:start");
        await viewer.setup(canvas);
        perfMark("vrm:setup:afterViewerSetup");
        try {
          const currentVrm = getCurrentVrm();
          if (!currentVrm) {
            setIsLoading(true);
            return false;
          }
          perfMark("vrm:loadVrm:start");
          await viewer.loadVrm(buildUrl(currentVrm.url), (progress) => {
            // keep lightweight; progress already logged elsewhere if needed
            setLoadingProgress(String(progress));
          });
          perfMark("vrm:loadVrm:done");
          return true;
        } catch (e) {
          console.error("vrm loading error", e);
          setLoadingError(true);
          setIsLoading(false);
          if (isTauri()) invoke("close_splashscreen");
          return false;
        }
      };

      // Defer heavy WebGL init until idle to unblock first paint
      const win = window as unknown as {
        requestIdleCallback?: (cb: IdleRequestCallback) => void;
      };
      if (typeof win.requestIdleCallback === "function") {
        win.requestIdleCallback(() => {
          runSetup().then((loaded) => {
            if (loaded) {
              setLoadingError(false);
              setIsLoading(false);
              if (isTauri()) invoke("close_splashscreen");
              logPerfSummaryOnce();
            }
          });
        });
      } else {
        setTimeout(() => {
          runSetup().then((loaded) => {
            if (loaded) {
              setLoadingError(false);
              setIsLoading(false);
              if (isTauri()) invoke("close_splashscreen");
              logPerfSummaryOnce();
            }
          });
        }, 0);
      }

      // Drag & drop replacement
      canvas.addEventListener("dragover", (event) => event.preventDefault());
      canvas.addEventListener("drop", (event) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (!files?.[0]) return;
        const file = files[0];
        const file_type = file.name.split(".").pop();
        if (file_type === "vrm") {
          vrmListAddFile(file, viewer);
        }
      });

      // Pause render loop when tab not visible (saves CPU/GPU)
      // viewer already handles visibility internally (see viewer.ts _onVisibility)
    },
    [
      vrmList.findIndex((value) =>
        value.hashEquals(getCurrentVrm()?.getHash() || ""),
      ) < 0,
      viewer,
    ],
  );

  return (
    <>
      {/* z-layering: background (z-0) < VRM (z-[2]) < UI (>= z-10). */}
      <div
        className={clsx(
          "z-vrm fixed top-0 left-0 h-full w-full",
          chatMode ? "top-[50%] left-[65%]" : "top-0 left-0",
        )}>
        <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
        {isLoading && (
          <div
            className={
              "bg-opacity-50 absolute top-0 left-0 flex h-full w-full items-center justify-center bg-black"
            }>
            <div className={"text-2xl text-white"}>{loadingProgress}</div>
          </div>
        )}
        {loadingError && (
          <div
            className={
              "bg-opacity-50 absolute top-0 left-0 flex h-full w-full items-center justify-center bg-black"
            }>
            <div className={"text-2xl text-white"}>
              Error loading VRM model...
            </div>
          </div>
        )}
      </div>
    </>
  );
}
