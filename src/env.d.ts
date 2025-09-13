declare namespace NodeJS {
  interface ProcessEnv {
    // OpenRouter Configuration
    NEXT_PUBLIC_OPENROUTER_APIKEY?: string;
    NEXT_PUBLIC_OPENROUTER_URL?: string;
    NEXT_PUBLIC_OPENROUTER_MODEL?: string;

    // Existing environment variables (preserving for type safety)
    NEXT_PUBLIC_CHATBOT_BACKEND?: string;
    NEXT_PUBLIC_OPENAI_APIKEY?: string;
    NEXT_PUBLIC_OPENAI_URL?: string;
    NEXT_PUBLIC_OPENAI_MODEL?: string;
    NEXT_PUBLIC_LLAMACPP_URL?: string;
    NEXT_PUBLIC_LLAMACPP_STOP_SEQUENCE?: string;
    NEXT_PUBLIC_OLLAMA_URL?: string;
    NEXT_PUBLIC_OLLAMA_MODEL?: string;
    NEXT_PUBLIC_KOBOLDAI_URL?: string;
    NEXT_PUBLIC_KOBOLDAI_USE_EXTRA?: string;
    NEXT_PUBLIC_KOBOLDAI_STOP_SEQUENCE?: string;
  }
}

// Global augmentations for browser runtime
declare global {
  // One-time deprecation warning flag for Chat.initialize
  var __amica_init_warned: boolean | undefined;

  interface Window {
    // Simple latency tracker used by SpeechPipeline; optional
    chatvrm_latency_tracker?: { active: boolean; start: number };

    // SpeechT5 worker + audio cache
    chatvrm_worker_speecht5?: Worker;
    chatvrm_worker_speecht5_audiocache?: Float32Array | null;
  }
}

export {};
