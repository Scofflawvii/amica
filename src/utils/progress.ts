declare global {
  interface Window {
    chatvrm_loading_progress?: Record<string, number>;
    chatvrm_loading_progress_cnt?: number;
  }
}

export function updateFileProgress(file: string, progress: number) {
  if (typeof window !== "undefined") {
    if (!window.chatvrm_loading_progress) {
      window.chatvrm_loading_progress = {};
      window.chatvrm_loading_progress_cnt = 0;
    }

    if (progress === 100) {
      delete window.chatvrm_loading_progress[file];
    } else {
      window.chatvrm_loading_progress[file] = progress;
    }

    window.chatvrm_loading_progress_cnt =
      (window.chatvrm_loading_progress_cnt ?? 0) + 1;
  }
}
