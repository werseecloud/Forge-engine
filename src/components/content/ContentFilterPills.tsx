import { contentFilters, type ContentFilter } from "../../lib/assetTypes";
import { useAssetStore } from "../../stores/useAssetStore";

export function ContentFilterPills() {
  const contentFilter = useAssetStore((state) => state.contentFilter) as ContentFilter;
  const setContentFilter = useAssetStore((state) => state.setContentFilter);

  return (
    <div className="filter-pills">
      {contentFilters.map((filter) => (
        <button key={filter} className={contentFilter === filter ? "is-active" : ""} onClick={() => setContentFilter(filter)}>
          {filter}
        </button>
      ))}
    </div>
  );
}

