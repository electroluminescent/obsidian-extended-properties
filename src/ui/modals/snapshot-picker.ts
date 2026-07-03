/**
 * Picker for restoring a configuration snapshot (roadmap L1). Lists the
 * snapshots newest-first; choosing one hands it back to the caller, which
 * confirms, backs up the current settings, and applies the restore.
 */
import { App, FuzzySuggestModal } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { SnapshotMeta } from "../../core/snapshot-store";

/** "ep-snapshot-2026-06-27-184500.json" -> "2026-06-27 18:45:00". */
function pretty(name: string): string {
  const m = name.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : name;
}

export class SnapshotPickerModal extends FuzzySuggestModal<SnapshotMeta> {
  constructor(app: App, i18n: I18n, private snaps: SnapshotMeta[], private onPick: (m: SnapshotMeta) => void) {
    super(app);
    this.setPlaceholder(i18n.t("snapshot.pick"));
  }
  getItems(): SnapshotMeta[] {
    return this.snaps;
  }
  getItemText(m: SnapshotMeta): string {
    return pretty(m.name);
  }
  onChooseItem(m: SnapshotMeta): void {
    this.onPick(m);
  }
}
