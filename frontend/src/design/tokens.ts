export const coreColors = {
  background: "#f6f8fb",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  border: "#d9e1ea",
  borderStrong: "#b7c4d3",
  text: "#172033",
  textMuted: "#5b6472",
  textSubtle: "#7a8494",
  textInverse: "#ffffff",
  brand: "#0f766e",
  brandHover: "#115e59",
  brandSoft: "#ccfbf1",
  info: "#2563eb",
  infoSoft: "#dbeafe",
  success: "#15803d",
  successSoft: "#dcfce7",
  warning: "#b45309",
  warningSoft: "#fef3c7",
  danger: "#b91c1c",
  dangerSoft: "#fee2e2",
  executive: "#6d28d9",
  executiveSoft: "#ede9fe",
  focus: "#2563eb",
} as const;

export const coreSpacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const coreRadii = {
  small: "6px",
  medium: "8px",
  large: "12px",
} as const;

export const coreTypography = {
  fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
  sizes: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
  },
} as const;

export const coreShadows = {
  small: "0 1px 2px rgb(15 23 42 / 8%)",
  medium: "0 8px 20px rgb(15 23 42 / 10%)",
} as const;

export const coreStatus = {
  new: "info",
  inProgress: "brand",
  waiting: "warning",
  blocked: "danger",
  approved: "success",
  rejected: "danger",
  completed: "success",
  archived: "muted",
} as const;
