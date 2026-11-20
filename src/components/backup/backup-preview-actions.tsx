"use client";

import { useRef, useState } from "react";
import { BackupExampleDetail } from "@/components/backup/backup-example-detail";
import { useBackupExplorer } from "@/components/backup/use-backup-explorer";
import { backupExampleLabel, selectBackupExample, type BackupExample, type BackupExplorerKind } from "@/components/backup/backup-explorer-view";
import { backupAction } from "@/components/backup/backup-navigation";

export function BackupPreviewActions({ kind }: { kind: BackupExplorerKind }) {
  const { state, contextKey, retry } = useBackupExplorer(kind);
  if (state.kind !== "ready") return <div aria-live="polite" className="space-y-3 text-sm text-ink-300"><p>{state.kind === "error" ? state.message : state.kind === "loading" ? "Loading example inspection actions…" : "Live example inspection is unavailable."}</p>{state.kind === "error" && <button type="button" className={backupAction} onClick={retry}>Retry example inspection</button>}</div>;
  return <PreviewActions key={contextKey} records={state.records} kind={kind} />;
}

function PreviewActions({ records, kind }: { records: readonly BackupExample[]; kind: BackupExplorerKind }) {
  const [selected, setSelected] = useState<string | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const record = selected ? selectBackupExample({ kind: "ready", records }, selected) : null;
  return <div className="space-y-4"><h3 className="text-sm font-semibold text-ink-100">Inspect individual {kind === "assets" ? "asset" : "job"} examples</h3><div className="flex flex-wrap gap-3">{records.map(record => <button key={record.id} type="button" className={backupAction} onClick={event => { trigger.current = event.currentTarget; setSelected(record.id); }}>View {backupExampleLabel(record)}</button>)}</div>{!records.length && <p className="text-sm text-ink-300">No fictional examples are available; this is not a production inventory result.</p>}{record && <BackupExampleDetail key={record.id} record={record} trigger={trigger.current} onClose={() => setSelected(null)} />}</div>;
}
