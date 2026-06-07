export type ControlSize = "xs" | "sm" | "md";

interface SizeSpec {
  square: string;
  height: string;
  pillPaddingX: string;
}

export const CONTROL_SIZE: Record<ControlSize, SizeSpec> = {
  xs: { square: "w-7 h-7", height: "h-7", pillPaddingX: "px-3.5" },
  sm: { square: "w-9 h-9", height: "h-9", pillPaddingX: "px-4" },
  md: { square: "w-10 h-10", height: "h-10", pillPaddingX: "px-5" },
};
