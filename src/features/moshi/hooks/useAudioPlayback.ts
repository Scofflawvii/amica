import { useRef } from "react";

type LipSyncAudioSurface = {
  audio: AudioContext;
  analyser?: AnalyserNode | null;
};
type ViewerLike = {
  model?: { _lipSync?: LipSyncAudioSurface };
};

export const useAudioPlayback = (audioContext: AudioContext) => {
  const scheduledEndTimeRef = useRef<number>(0);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null); // Audio source node

  const scheduleAudioPlayback = async (
    newAudioData: Float32Array,
    nowTime: number | undefined,
    viewer: ViewerLike,
  ) => {
    const sampleRate = audioContext.sampleRate;
    const newBuffer = audioContext.createBuffer(
      1,
      newAudioData.length,
      sampleRate,
    );
    // Ensure ArrayBuffer (not SharedArrayBuffer) to satisfy DOM typings
    const ch0 = new Float32Array(new ArrayBuffer(newAudioData.length * 4));
    ch0.set(newAudioData);
    newBuffer.copyToChannel(ch0, 0);

    const ctx = viewer.model?._lipSync?.audio;
    if (!ctx) return;
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = newBuffer;
    sourceNode.connect(ctx.destination);
    if (viewer.model?._lipSync?.analyser)
      sourceNode.connect(viewer.model._lipSync.analyser);

    const startTime = Math.max(scheduledEndTimeRef.current, nowTime || 0);
    sourceNode.start(startTime);

    scheduledEndTimeRef.current = startTime + newBuffer.duration;

    if (sourceNodeRef.current && sourceNodeRef.current.buffer) {
      const currentEndTime = scheduledEndTimeRef.current; // Use the manual tracking of the end time
      if (currentEndTime <= nowTime!) {
        sourceNodeRef.current.disconnect();
      }
    }
    sourceNodeRef.current = sourceNode;
  };

  return { scheduleAudioPlayback, sourceNodeRef };
};
