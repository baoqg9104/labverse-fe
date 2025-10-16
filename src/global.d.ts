import type { DataTable } from "datatables.net";
import type { Dropzone } from "dropzone";
import type { VanillaCalendarPro } from "vanilla-calendar-pro";
import type { noUiSlider } from "nouislider";
import type { IStaticMethods } from "preline/dist";

declare global {
  interface Window {
    _;
    $: typeof import("jquery");
    jQuery: typeof import("jquery");
    DataTable: typeof DataTable;
    Dropzone: typeof Dropzone;
    VanillaCalendarPro: typeof VanillaCalendarPro;
    noUiSlider: typeof noUiSlider;
    HSStaticMethods: IStaticMethods;
  }
  interface Document {
    fonts?: {
      ready: Promise<void>;
    };
  }
}

export {};

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}