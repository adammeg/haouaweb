export {};

declare global {
  interface Window {
    /** Set beforeInteractive in (app) layout — used for localStorage scope. */
    __HAWAE_DOCTOR_ID__?: string;
  }
}
