import { useContext, useCallback, useEffect, useState } from "react";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { logger } from "@/utils/logger";

export default function VrmDemo({
  vrmUrl,
  onScreenShot: _onScreenShot,
  onLoaded: _onLoaded,
  onError: _onError,
}: {
  vrmUrl: string;
  onScreenShot?: (blob: Blob | null) => void;
  onLoaded?: () => void;
  onError?: () => void;
}) {
  const { viewer } = useContext(ViewerContext);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setLoadingError(false);
  }, [vrmUrl]);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        (async () => {
          try {
            await viewer.loadVrm(buildUrl(vrmUrl), setLoadingProgress);
            logger.info("vrm loaded", { url: vrmUrl });
            // viewer.animateToEntry(); // This method may not exist, commenting out
          } catch (e) {
            logger.warn("vrm load failed", {
              url: vrmUrl,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        })();
      }
    },
    [vrmUrl, viewer, setLoadingProgress],
  );

  return (
    <div>
      <canvas ref={canvasRef} className={"h-full w-full"} />
      {isLoading && (
        <div className={"text-muted p-2 text-2xl"}>{loadingProgress}</div>
      )}
      {loadingError && (
        <div className={"p-2 text-2xl"}>Error loading VRM model...</div>
      )}
    </div>
  );
}
