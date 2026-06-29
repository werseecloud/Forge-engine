import { useInstallerStore } from "../stores/useInstallerStore";

export function LogPanel() {
  const logs = useInstallerStore((s) => s.logs);
  return <pre className="log-box">{logs.join("\n")}</pre>;
}

