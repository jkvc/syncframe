import { createHighlighter, type Highlighter, type ThemeRegistration } from "shiki";

/** Light theme tuned to syncframe blueprint tokens. */
export const syncframeLight: ThemeRegistration = {
  name: "syncframe-light",
  displayName: "Syncframe Light",
  type: "light",
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#0c1222",
  },
  settings: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#8b9cb3", fontStyle: "italic" },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: "#0d9488", fontStyle: "bold" },
    },
    {
      scope: ["entity.name.type", "support.type", "entity.name.type.interface"],
      settings: { foreground: "#3d4f66", fontStyle: "bold" },
    },
    {
      scope: ["entity.name.function", "support.function"],
      settings: { foreground: "#0c1222", fontStyle: "bold" },
    },
    {
      scope: ["variable", "variable.parameter", "meta.definition.variable"],
      settings: { foreground: "#0c1222" },
    },
    {
      scope: ["string", "constant.other.placeholder"],
      settings: { foreground: "#0f766e" },
    },
    {
      scope: ["constant.numeric"],
      settings: { foreground: "#0891b2" },
    },
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#8b9cb3" },
    },
  ],
};

const LANGS = ["typescript", "tsx", "bash", "shellscript"] as const;

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [syncframeLight],
      langs: [...LANGS],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  lang: (typeof LANGS)[number] = "typescript",
): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code.trimEnd(), {
    lang,
    theme: "syncframe-light",
  });
}
