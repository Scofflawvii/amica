import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import amicaZIndex from "./eslint-plugin-amica-zindex.js";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/public/**",
      "src/workers/decoderWorker.min.js",
      "src/workers/**/*.min.js",
      "src/workers/bvh/**",
      "**/generateMeshBVH.worker.js",
      "**/*.worker.js.map",
      "test_*.cjs",
      "test_*.js",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
        JSX: "readonly",
        // Jest globals
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        performance: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Worker: "readonly",
        self: "readonly",
        onmessage: "readonly",
        postMessage: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        WebGLRenderingContext: "readonly",
        WebGL2RenderingContext: "readonly",
        WebAssembly: "readonly",
        TextDecoder: "readonly",
        TextEncoder: "readonly",
        XMLHttpRequest: "readonly",
        global: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        define: "readonly",
        Audio: "readonly",
        data: "readonly",
        Image: "readonly",
        alert: "readonly",
        createImageBitmap: "readonly",
        XRSession: "readonly",
        XRSessionMode: "readonly",
        XRRigidTransform: "readonly",
        XRInputSourceEvent: "readonly",
        XRFrame: "readonly",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "amica-z": amicaZIndex,
    },
    rules: {
      // Next.js specific rules
      "@next/next/no-img-element": "off",

      // React rules
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/prop-types": "off", // Using TypeScript
      "react-hooks/rules-of-hooks": "error",

      // General rules
      "no-unused-vars": "warn",
      // Enforce logger usage; allow specific files below
      "no-console": "error",
      "no-undef": "error",
      "no-useless-escape": "error",
      "no-empty": "error",
      "no-prototype-builtins": "error",
      // Enforce semantic Tailwind z-index tokens and forbid raw colors
      "amica-z/no-raw-z-index": "error",
      "amica-z/no-raw-color": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    // Allow console usage in repo scripts and tooling where structured logger isn't used
    files: [
      "scripts/**/*.mjs",
      "github-actions-reporter.js",
      "src/utils/logger.ts",
    ],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Relax rules in test files to keep signal high
    files: [
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/*.{spec,test}.{js,jsx,ts,tsx}",
    ],
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    // Allow console statements in specific files where they're intentional
    files: [
      "src/utils/debug.ts",
      "src/components/debugPane.tsx",
      "public/debugLogger.js",
      "src/workers/**/*.js",
    ],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      // Disable base rule and enable TypeScript rule
      "no-unused-vars": "off",
      // Be strict during dev, quiet during production build
      "@typescript-eslint/no-unused-vars":
        process.env.NODE_ENV === "production"
          ? "off"
          : ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any":
        process.env.NODE_ENV === "production" ? "off" : "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      // NOTE: '@typescript-eslint/ban-types' was removed in the current plugin version.
      // If we need similar restrictions later we can add a custom lint rule or
      // rely on targeted rules (e.g. no-unsafe-function-type) instead.
    },
  },
  {
    files: ["src/features/chat/__tests__/chat.observer*.spec.ts"],
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    files: ["src/pages/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any":
        process.env.NODE_ENV === "production" ? "off" : "warn",
    },
  },
  // Place a final override so it takes precedence over TS config above
  {
    files: [
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/*.{spec,test}.{js,jsx,ts,tsx}",
    ],
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];
