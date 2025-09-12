<p align="center">
    <img src="https://amica.arbius.ai/ogp.png" width="600" style="margin-bottom: 0.2;"/>
</p>

<h2 align="center"><a href="https://amica.arbius.ai">Amica: Your friendly personal AI</a></h2>

<h5 align="center"> If you like our project, please give us a star ⭐ on GitHub.</h2>

<h5 align="center">

[![twitter](https://img.shields.io/badge/Twitter%20-black)](https://twitter.com/arbius_ai)
[![License](https://img.shields.io/github/license/semperai/amica)](https://github.com/semperai/amica/blob/main/LICENSE)
[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fsemperai%2Famica&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)](https://hits.seeyoufarm.com)
[![GitHub issues](https://img.shields.io/github/issues/semperai/amica?color=critical&label=Issues)](https://github.com/semperai/amica/issues?q=is%3Aopen+is%3Aissue)
[![GitHub closed issues](https://img.shields.io/github/issues-closed/semperai/amica?color=success&label=Issues)](https://github.com/semperai/amica/issues?q=is%3Aissue+is%3Aclosed)

</h5>

Amica allows you to converse with highly customizable 3D characters that can communicate via natural voice chat and vision, with an emotion engine that allows Amica to express feelings and more. Customize her any way you want with any AI technology.

[Try Amica here on mobile, tablet or desktop](https://amica.arbius.ai)

> **For Windows Users**: Please create a new folder for Amica during installation to prevent the unintentional deletion of other files during uninstallation.

<p align="center"><a href="https://github.com/flukexp/llama-piper-go/releases/download/v1.0.0/llama-piper-window.exe"><img src="https://img.shields.io/badge/Download%20for%20Windows%20-green?style=for-the-badge&logo=windows" /></a>

We just released Amica 1.2 with lots of new features. [Docs](https://docs.heyamica.com/) will be further updated soon, **watch the video to learn about what Amica 1.2 offers:**

[![Video Title](https://img.youtube.com/vi/3zCN2IlxHrU/0.jpg)](https://www.youtube.com/watch?v=3zCN2IlxHrU)

You can import VRM files, adjust the voice to fit the character, and generate response text that includes emotional expressions.

</p>

The various features of Amica mainly use and support the following technologies:

> To see tutorials on configuring any of these with Amica please visit the [official Amica documentation](https://docs.heyamica.com/).

- 3D Rendering
  - [three.js](https://threejs.org/)
- Displaying 3D characters
  - [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)
- Running Transformers in the browser
  - [Transformers.js](https://huggingface.co/docs/transformers.js/index)
- Speech recognition
  - [Whisper](https://openai.com/research/whisper)
- Voice Activity Detection
  - [Silero VAD](https://github.com/ricky0123/vad/)
- ChatBot
  - [Llama.cpp server](https://github.com/ggerganov/llama.cpp)
  - [ChatGPT API](https://platform.openai.com/docs/api-reference/chat) (compatible with projects such as [LM Studio](https://lmstudio.ai/))
  - [Window.ai](https://windowai.io/)
  - [Ollama](https://ollama.ai)
  - [KoboldCpp](https://github.com/LostRuins/koboldcpp)
  - [Oobabooga](https://github.com/oobabooga/text-generation-webui/wiki)
  - [OpenRouter](https://openrouter.ai/) (access to multiple AI models)
- Text-to-Speech
  - [Eleven Labs API](https://elevenlabs.io/)
  - [Speech T5](https://huggingface.co/microsoft/speecht5_tts)
  - [OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
  - [Coqui (Local)](https://github.com/coqui-ai)
  - [RVC](https://github.com/SocAIty/Retrieval-based-Voice-Conversion-FastAPI)
  - [AllTalkTTS](https://github.com/erew123/alltalk_tts)
- Vision
  - [Bakllava](https://github.com/SkunkworksAI/BakLLaVA)

## 🛠️ Installation and running

To run this project locally, clone or download the repository.

```bash
git clone git@github.com:semperai/amica.git
```

Install the required packages.

```bash
npm install
```

After installing the packages, start the development web server using the following command:

```bash
npm run dev
```

Once started, please visit the following URL to confirm that it is working properly.

[http://localhost:3000](http://localhost:3000)

### 📝 Configuration

Most of the configuration is done in the `.env.local` file. Reference the `config.ts` file for the available options.

#### OpenRouter Configuration

To use OpenRouter as a chat backend, set the following environment variables in your `.env.local` file:

- `NEXT_PUBLIC_OPENROUTER_APIKEY`: Your OpenRouter API key (required)
- `NEXT_PUBLIC_OPENROUTER_URL`: Custom OpenRouter API URL (optional, defaults to https://openrouter.ai/api/v1)
- `NEXT_PUBLIC_OPENROUTER_MODEL`: Default OpenRouter model (optional, defaults to openai/gpt-3.5-turbo)

```bash
amica
├── .env.local
├── src
│   ├── utils
│   │   └── config.ts
```

### 📦 Desktop Application

Amica uses [Tauri](https://tauri.app/) to build the desktop application.

To develop the desktop application, use the following command:

```bash
npm run tauri dev
```

## 📖 Documentation

View the [documentation](https://docs.heyamica.com) for more information on how to configure and use Amica.

### ⚠️ Deprecations (In Progress)

The chat subsystem is migrating to an observer-driven architecture.

- `Chat.initialize(...)` (multi-callback signature) → Deprecated. Use `chat.initializeWithObserver(amicaLife, viewer, alert, observer)` and subscribe via a single `ChatObserver`.
- Direct state setters (`setChatProcessing`, `setChatSpeaking`, etc.) should be treated as internal bridge methods. Prefer observer events: `onProcessingChange`, `onSpeakingChange`, `onAssistantDelta`, `onAssistantFlush`, `onStateChange`.
- Custom streaming loops should not manually read LLM streams. Use `chat.makeAndHandleStream(messages)` or `askLLM(systemPrompt, userPrompt, chat)`.

These legacy APIs will continue to function during the transition window but will emit a one‑time console warning. Remove any remaining usage before the next minor release.

### ✅ Modern Usage Examples

Observer-based UI wiring:

```ts
import { useEffect } from "react";
import { Chat } from "@/features/chat/chat";
import { ChatObserver } from "@/features/chat/chatObserver";

export function useAttachChat(chat: Chat) {
  useEffect(() => {
    const obs: ChatObserver = {
      onAssistantDelta: (d) => {
        /* stream token */
      },
      onAssistantFlush: (full) => {
        /* finalize */
      },
      onProcessingChange: (p) => {
        /* spinner */
      },
      onStateChange: (next) => {
        /* metrics or UX */
      },
    };
    chat.addObserver(obs);
    return () => chat.removeObserver(obs);
  }, [chat]);
}
```

Lightweight LLM call without audio (standalone):

```ts
import { askLLM } from "@/utils/askLlm";

const text = await askLLM("You are a helper", "Summarize: ...", null);
```

Full pipeline LLM call (reuses streaming, observers, TTS):

```ts
const response = await askLLM(
  "System instructions",
  "Tell me a joke",
  chatInstance,
);
```

Vision round‑trip (image -> description -> contextual response):

```ts
import { askVisionLLM } from "@/utils/askLlm";
const answer = await askVisionLLM(base64JpegData, chatInstance); // optional chat
```

Assistant event ordering contract:

```
onAssistantDelta (0..n times) → onAssistantFlush (1 per batch) → onChatLog → onShownMessage
```

Use this to optimize rendering (e.g. cheap append during deltas, expensive syntax highlight after flush).

## 📜 History

This project originated as a fork of ChatVRM by Pixiv:

[https://pixiv.github.io/ChatVRM](https://pixiv.github.io/ChatVRM)

## 🧱 Z-Index Layering Scale

Semantic layering ensures all UI sits above the VRM canvas without arbitrary z-index inflation. Use the semantic utilities instead of raw numbers when possible.

| Token / Class  | Value | Usage                                                     |
| -------------- | ----- | --------------------------------------------------------- |
| `z-background` | 0     | Background media (YouTube iframe, decorative video/image) |
| `z-vrm`        | 2     | VRM / Three.js canvas layer                               |
| `z-base`       | 10    | Core UI (menus, chat controls, standard buttons)          |
| `z-floating`   | 20    | Floating panes (webcam preview, dropdowns, popovers)      |
| `z-overlay`    | 40    | Introduction overlays, dim scrims                         |
| `z-modal`      | 50    | Settings / modal dialogs                                  |
| `z-toast`      | 100   | Toast / transient notices                                 |
| `z-max`        | 1000  | Critical alerts (topmost)                                 |

Guidelines:

1. Pick the lowest layer that still achieves visibility.
2. Prefer semantic classes; avoid adding new numeric tiers casually.
3. For new blocking UI, reuse `z-overlay` or `z-modal` unless a distinct interaction model demands otherwise.
4. Reserve `z-max` for short‑lived critical alerts.

Migration examples:

```
z-10  -> z-base
z-20  -> z-floating
z-[2] -> z-vrm (already in place for VRM canvas)
```

See `docs/z-index-scale.md` for deeper guidance.

## � Releases & Versioning

This project uses **semantic-release** with **Conventional Commits** to fully automate versioning, CHANGELOG generation, Git tags and GitHub Releases.

Key points:

- Branches:
  - `master` – stable channel (production).
  - `develop` – prerelease channel (`beta` dist‑tag); versions published here get a prerelease suffix (e.g. `0.4.0-beta.2`).
- While we are in the 0.x phase, declared breaking changes ("BREAKING CHANGE:" footer or `!` in the type/scope) are down‑scoped to a **minor** bump instead of triggering 1.0.0 immediately. This accelerates iteration prior to 1.0 hardening.
- The npm publish step is disabled (`npmPublish: false`); releases only update `package.json`, `CHANGELOG.md`, create a Git tag and a GitHub Release.
- Commits that trigger releases (common types):
  - `feat:` → minor version bump (or prerelease minor on `develop`).
  - `fix:` / `perf:` / `docs:` (README scope) / `chore(deps):` → patch bump.
  - `BREAKING CHANGE:` footer (or `!`) → minor bump (during 0.x) or major once ≥1.0.0.

Local tooling:

```bash
# Dry run (shows next version & notes without changing anything)
npm run release:dry

# Full release (CI normally runs this on push to master / develop)
npm run release
```

Creating a prerelease:

1. Branch from `master` into `develop` (or merge latest `master`).
2. Land conventional commits (e.g. `feat: add streaming buffer`).
3. Push – the GitHub Action tags a beta version `0.x.y-beta.N` and updates the prerelease GitHub Release.
4. After validation, merge `develop` → `master` to cut the stable release.

Guidelines:

1. Keep commits small and conventional; squash only if the final message preserves semantic meaning.
2. Group refactors with `refactor:` (no release unless accompanied by `feat`/`fix` or breaking footer).
3. Use `test:` / `build:` / `ci:` / `docs:` for non-code or support changes; most of these will not trigger a release (except README docs rule above).

Once we graduate to `1.0.0`, breaking changes will trigger true major bumps (remove the temporary rule in `.releaserc.json`).

## �🔒 License

- The majority of this project is released under the MIT license as found in the [LICENSE](https://github.com/semperai/amica/blob/master/LICENSE) file.
- Assets such as 3D models and images are released under their authors respective licenses.

## ✨ Star History

[![Star History](https://api.star-history.com/svg?repos=semperai/amica&type=Date)](https://star-history.com/#semperai/amica&Date)

## 🤗 Contributors

<a href="https://github.com/semperai/amica/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=semperai/amica" />
</a>
