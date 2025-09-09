import CopyPlugin from "copy-webpack-plugin";
import withPWAFunction from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = withPWAFunction({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // allow large WASM/ONNX assets
  },
});

const output = process.env.NEXT_OUTPUT || undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output,
  reactStrictMode: false,
  assetPrefix: process.env.BASE_PATH || "",
  basePath: process.env.BASE_PATH || "",
  trailingSlash: true,
  publicRuntimeConfig: {
    root: process.env.BASE_PATH || "",
  },
  webpack: (config, { webpack, buildId }) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
            to: "static/chunks/[name][ext]",
          },
          // Keep the original filename for compatibility
          {
            from: "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
            to: "static/chunks/ort-wasm-threaded.wasm",
          },
          {
            from: "node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
            to: "static/chunks/[name][ext]",
          },
          {
            from: "node_modules/@ricky0123/vad-web/dist/*.onnx",
            to: "static/chunks/[name][ext]",
          },
        ],
      }),
    );

    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.NEXT_PUBLIC_CONFIG_BUILD_ID": JSON.stringify(buildId),
      }),
    );

    return config;
  },
};

const configWithPWA = withPWA(nextConfig);

// Injected content via Sentry wizard below

const sentryConfig = withSentryConfig(configWithPWA, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "heyamica",
  project: "chat-heyamica",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});

export default sentryConfig;
