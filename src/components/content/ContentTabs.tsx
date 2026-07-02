import type { ContentTab } from "../../stores/useAppStore";
import { useAppStore } from "../../stores/useAppStore";

const tabs: ContentTab[] = ["Content Browser", "Blueprints", "Characters", "Output Log", "Console", "Animation Timeline"];

export function ContentTabs() {
  const activeContentTab = useAppStore((state) => state.activeContentTab);
  const setActiveContentTab = useAppStore((state) => state.setActiveContentTab);

  return (
    <div className="content-tabs">
      {tabs.map((tab) => (
        <button key={tab} className={activeContentTab === tab ? "is-active" : ""} onClick={() => setActiveContentTab(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );
}
