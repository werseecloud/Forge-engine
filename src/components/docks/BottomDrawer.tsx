import { EmptyState } from "../shared/EmptyState";
import { BlueprintsPanel } from "../content/BlueprintsPanel";
import { ConsolePanel } from "../content/ConsolePanel";
import { ContentBrowser } from "../content/ContentBrowser";
import { ContentTabs } from "../content/ContentTabs";
import { OutputLog } from "../content/OutputLog";
import { AnimationTimeline } from "../content/AnimationTimeline";
import { useAppStore } from "../../stores/useAppStore";

interface BottomDrawerProps {
  onImportStatus: (message: string) => void;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function BottomDrawer({ onImportStatus, onRefresh, onError, onSuccess }: BottomDrawerProps) {
  const activeContentTab = useAppStore((state) => state.activeContentTab);

  return (
    <section className="bottom-drawer">
      <ContentTabs />
      <div className="bottom-drawer__body">
        {activeContentTab === "Content Browser" ? (
          <ContentBrowser onImportStatus={onImportStatus} onRefresh={onRefresh} onError={onError} onSuccess={onSuccess} />
        ) : null}
        {activeContentTab === "Blueprints" ? <BlueprintsPanel /> : null}
        {activeContentTab === "Output Log" ? <OutputLog /> : null}
        {activeContentTab === "Console" ? <ConsolePanel /> : null}
        {activeContentTab === "Animation Timeline" ? <AnimationTimeline /> : null}
      </div>
    </section>
  );
}
