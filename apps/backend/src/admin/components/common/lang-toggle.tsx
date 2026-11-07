import { useLang, setLang } from "../../utils/i18n";

/* 中 / ID switch for the custom pages. */
export const LangToggle = () => {
  const lang = useLang();
  return (
    <div className="inline-flex rounded-md border border-ui-border-base text-xs overflow-hidden">
      {(["zh", "id"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2 py-1 ${lang === l ? "bg-ui-bg-base-pressed font-medium" : "text-ui-fg-subtle"}`}
        >
          {l === "zh" ? "中文" : "ID"}
        </button>
      ))}
    </div>
  );
};
