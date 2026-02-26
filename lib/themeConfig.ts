import { ThemeStyle } from "@/types/layout";

export interface ThemeClasses {
  card: string;
  cardHover: string;
  headlineClass: string;
  subtextClass: string;
  badgeClass: string;
  sectionBg: string;
  altSectionBg: string;
  dividerClass: string;
  testimonialCard: string;
  featureIcon: string;
}

export function getThemeClasses(
  style: ThemeStyle,
  isDark: boolean,
): ThemeClasses {
  switch (style) {
    case "minimal":
      return {
        card: `rounded-lg border p-6 ${isDark ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white shadow-sm"}`,
        cardHover: "hover:border-neutral-500 transition-colors duration-200",
        headlineClass: "font-light tracking-wide",
        subtextClass: isDark
          ? "text-neutral-400 font-light"
          : "text-neutral-500 font-light",
        badgeClass: `text-xs font-medium px-3 py-1 rounded-full ${isDark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-600"}`,
        sectionBg: isDark ? "bg-black" : "bg-white",
        altSectionBg: isDark ? "bg-neutral-950" : "bg-neutral-50",
        dividerClass: isDark ? "border-neutral-800" : "border-neutral-200",
        testimonialCard: `rounded-lg border-l-4 p-6 ${isDark ? "bg-neutral-950 border-neutral-700" : "bg-neutral-50 border-neutral-300"}`,
        featureIcon: `w-8 h-8 mb-4 rounded ${isDark ? "text-white" : "text-black"}`,
      };

    case "bold":
      return {
        card: `rounded-2xl p-6 ${isDark ? "bg-neutral-900 border-2 border-neutral-700" : "bg-white border-2 border-neutral-900 shadow-[4px_4px_0px_#000]"}`,
        cardHover: "hover:translate-y-[-2px] transition-transform duration-200",
        headlineClass: "font-extrabold tracking-tight uppercase",
        subtextClass: isDark
          ? "text-neutral-300 font-medium"
          : "text-neutral-700 font-medium",
        badgeClass: `text-xs font-bold px-3 py-1 rounded uppercase tracking-widest ${isDark ? "bg-white text-black" : "bg-black text-white"}`,
        sectionBg: isDark ? "bg-neutral-950" : "bg-white",
        altSectionBg: isDark ? "bg-neutral-900" : "bg-neutral-100",
        dividerClass: isDark
          ? "border-neutral-700 border-2"
          : "border-neutral-900 border-2",
        testimonialCard: `rounded-2xl p-6 border-2 ${isDark ? "bg-neutral-900 border-neutral-700" : "bg-white border-neutral-900 shadow-[3px_3px_0px_#000]"}`,
        featureIcon: `w-10 h-10 mb-4 rounded-lg font-black text-xl flex items-center justify-center`,
      };

    case "glassmorphism":
      return {
        card: `rounded-2xl p-6 backdrop-blur-md border ${isDark ? "bg-white/5 border-white/10" : "bg-white/60 border-white/40 shadow-xl"}`,
        cardHover: "hover:bg-white/10 transition-all duration-300",
        headlineClass: "font-bold tracking-wide",
        subtextClass: isDark ? "text-neutral-300" : "text-neutral-600",
        badgeClass: `text-xs font-medium px-3 py-1 rounded-full backdrop-blur border ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-white/70 border-white/50 text-neutral-700"}`,
        sectionBg: isDark
          ? "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950"
          : "bg-gradient-to-br from-slate-100 via-white to-slate-100",
        altSectionBg: isDark
          ? "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
          : "bg-gradient-to-br from-white via-slate-50 to-white",
        dividerClass: isDark ? "border-white/10" : "border-neutral-200/60",
        testimonialCard: `rounded-2xl p-6 backdrop-blur-md border ${isDark ? "bg-white/5 border-white/10" : "bg-white/60 border-white/40 shadow-lg"}`,
        featureIcon: `w-10 h-10 mb-4 rounded-xl backdrop-blur-md`,
      };

    case "elegant":
      return {
        card: `rounded-sm p-8 ${isDark ? "bg-neutral-900 border border-neutral-700" : "bg-white border border-neutral-200 shadow-md"}`,
        cardHover: "hover:shadow-lg transition-shadow duration-300",
        headlineClass:
          "font-serif font-normal tracking-widest uppercase text-sm",
        subtextClass: isDark
          ? "text-neutral-400 italic"
          : "text-neutral-500 italic",
        badgeClass: `text-xs tracking-widest uppercase ${isDark ? "text-neutral-400" : "text-neutral-500"}`,
        sectionBg: isDark ? "bg-neutral-950" : "bg-stone-50",
        altSectionBg: isDark ? "bg-neutral-900" : "bg-white",
        dividerClass: isDark ? "border-neutral-800" : "border-stone-200",
        testimonialCard: `p-8 border-t ${isDark ? "border-neutral-700" : "border-stone-300"}`,
        featureIcon: `w-6 h-6 mb-6`,
      };

    case "corporate":
    default:
      return {
        card: `rounded-xl p-6 ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-100 shadow-md"}`,
        cardHover: "hover:shadow-lg transition-shadow duration-200",
        headlineClass: "font-bold tracking-tight",
        subtextClass: isDark ? "text-neutral-400" : "text-neutral-600",
        badgeClass: `text-xs font-semibold px-3 py-1 rounded-full ${isDark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-700"}`,
        sectionBg: isDark ? "bg-neutral-950" : "bg-white",
        altSectionBg: isDark ? "bg-neutral-900" : "bg-slate-50",
        dividerClass: isDark ? "border-neutral-800" : "border-neutral-200",
        testimonialCard: `rounded-xl p-6 ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-100 shadow"}`,
        featureIcon: `w-10 h-10 mb-4 rounded-lg`,
      };
  }
}

export function getThemeLabel(style: ThemeStyle): string {
  const labels: Record<ThemeStyle, string> = {
    minimal: "Minimal",
    bold: "Bold",
    glassmorphism: "Glass",
    elegant: "Elegant",
    corporate: "Corporate",
  };
  return labels[style] ?? style;
}

export const THEME_STYLES: ThemeStyle[] = [
  "minimal",
  "bold",
  "glassmorphism",
  "elegant",
  "corporate",
];
