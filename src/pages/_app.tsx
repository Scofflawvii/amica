import "@/i18n";

import "@/styles/globals.css";
import "@charcoal-ui/icons";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Head is kept for standard meta; avoid using <script> tags here */}
      </Head>
      {process.env.NODE_ENV !== "production" ? (
        // Safely unregister any SW during dev to avoid workbox 404 noise
        <Script src="/debug-sw-unregister.js" strategy="afterInteractive" />
      ) : null}
      <Component {...pageProps} />
    </>
  );
}
