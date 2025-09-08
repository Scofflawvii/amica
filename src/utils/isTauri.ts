export const isTauri = (): boolean => typeof(window) !== 'undefined' && Object.prototype.hasOwnProperty.call(window, '__TAURI__');
export default isTauri;
