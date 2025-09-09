import { useContext, useCallback, useState, useEffect, useRef } from "react";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { config } from "@/utils/config";
import { useVrmStoreContext } from "@/features/vrmStore/vrmStoreContext";
import isTauri from "@/utils/isTauri";
import { invoke } from "@tauri-apps/api/core";
import { ChatContext } from "@/features/chat/chatContext";
import clsx from "clsx";

export default function VrmViewer({ chatMode }: { chatMode: boolean }) {
  const { chat: bot } = useContext(ChatContext);
  const { viewer } = useContext(ViewerContext);
  const { getCurrentVrm, vrmList, vrmListAddFile, isLoadingVrmList } =
    useVrmStoreContext();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [loadingError, setLoadingError] = useState(false);
  const isVrmLocal = "local" == config("vrm_save_type");

  // Keep a stable canvas ref and track setup lifecycle
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const hasSetupRef = useRef(false);

  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    // Clean up listeners from any previous canvas
    if (canvasElRef.current && canvasElRef.current !== canvas) {
      const prev = canvasElRef.current;
      prev.removeEventListener("dragover", dragOverHandler as EventListener);
      prev.removeEventListener("drop", dropHandler as EventListener);
    }
    canvasElRef.current = canvas;
  }, []);

  // Keep handlers stable references
  const dragOverHandler = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const dropHandler = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      const file_type = file.name.split(".").pop();
      if (file_type === "vrm") {
        vrmListAddFile(file, viewer);
      }
    },
    [vrmListAddFile, viewer],
  );

  // Attach DnD listeners to the canvas element
  useEffect(() => {
    const canvas = canvasElRef.current;
    if (!canvas) return;
    canvas.addEventListener("dragover", dragOverHandler as EventListener);
    canvas.addEventListener("drop", dropHandler as EventListener);
    return () => {
      canvas.removeEventListener("dragover", dragOverHandler as EventListener);
      canvas.removeEventListener("drop", dropHandler as EventListener);
    };
  }, [dragOverHandler, dropHandler, canvasElRef.current]);

  // Setup viewer once when canvas is ready and VRM list is loaded (for local)
  useEffect(() => {
    const canvas = canvasElRef.current;
    if (!canvas) return;
    if (hasSetupRef.current) return;
    if (isVrmLocal && isLoadingVrmList) return; // wait for local list

    let cancelled = false;
    (async () => {
      try {
        await viewer.setup(canvas);
        hasSetupRef.current = true;
        let currentVrm = getCurrentVrm();
        if (!currentVrm) {
          // Fallback to the first available VRM
          if (vrmList.length > 0) {
            currentVrm = vrmList[0];
          } else {
            console.error("No VRM available to load");
            setLoadingError(true);
            setIsLoading(false);
            return false;
          }
        }
        setIsLoading(true);
        await viewer.loadVrm(buildUrl(currentVrm.url), (progress: string) => {
          if (!cancelled) setLoadingProgress(progress);
        });
        return true;
      } catch (e) {
        console.error("vrm loading error", e);
        if (!cancelled) {
          setLoadingError(true);
          setIsLoading(false);
        }
        if (isTauri()) invoke("close_splashscreen");
        return false;
      }
    })().then((loaded) => {
      if (cancelled) return;
      if (loaded) {
        setLoadingError(false);
        setIsLoading(false);
      }
      if (isTauri()) invoke("close_splashscreen");
    });

    return () => {
      cancelled = true;
    };
  }, [viewer, getCurrentVrm, isVrmLocal, isLoadingVrmList]);

  // React to chat mode changes and window resizes
  useEffect(() => {
    viewer.resizeChatMode(chatMode);
  }, [viewer, chatMode]);

  useEffect(() => {
    const onResize = () => viewer.resizeChatMode(chatMode);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [viewer, chatMode]);

  // Dispose viewer on unmount
  useEffect(() => {
    return () => {
      try {
        viewer.dispose?.();
      } catch (e) {
        // ignore dispose errors during unmount
      }
    };
  }, [viewer]);

  return (
    <div
      className={clsx(
        // Ensure container participates in layout and has a stacking context
        "fixed top-0 left-0 z-[1] h-full w-full",
        chatMode ? "top-[50%] left-[65%]" : "top-0 left-0",
      )}>
      <canvas
        ref={canvasRef}
        className={"block h-full min-h-[200px] w-full min-w-[200px]"}></canvas>
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
  );
}
