// SSR- and browser-safe dev check. Avoid referencing an undeclared global.
export const isDev =
  typeof process !== "undefined" && process.env?.NODE_ENV === "development";
export default isDev;
