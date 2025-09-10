import { useEffect, useState } from "react";

type LoadingFile = {
  file: string;
  progress: number;
};

export function LoadingProgress() {
  // Narrow window with declaration merging pattern
  interface LoadingWindow extends Window {
    chatvrm_loading_progress?: Record<string, number>;
    chatvrm_loading_progress_cnt?: number;
  }
  const w =
    typeof window !== "undefined" ? (window as LoadingWindow) : undefined;

  if (w) {
    if (!w.chatvrm_loading_progress) {
      w.chatvrm_loading_progress = {};
      w.chatvrm_loading_progress_cnt = 0;
    }
  }

  const [files, setFiles] = useState<LoadingFile[]>([]);
  const [progressCnt, setProgressCnt] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (!w) return;
      const progress = w.chatvrm_loading_progress || {};
      const cnt = w.chatvrm_loading_progress_cnt || 0;
      if (progressCnt !== cnt) {
        setFiles(
          Object.entries(progress).map(([k, v]) => ({
            file: k,
            progress: v,
          })),
        );
        setProgressCnt(cnt);
      }
    }, 100);
    return () => clearInterval(id);
  }, [progressCnt, w]);

  return (
    <div className="z-floating absolute top-16 right-0 mt-4 w-30 pt-16 pr-2 text-right text-xs text-white">
      {files.length > 0 && <div>[loading files]</div>}
      {files.map((row) => (
        <div key={row.file}>
          {row.file}: {((row.progress * 100) | 0) / 100}%
        </div>
      ))}
    </div>
  );
}
