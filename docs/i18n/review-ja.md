# Japanese Translation Review Notes

## Placeholder Mismatches (to fix in future batches)

The following keys are flagged by the i18n checker as having placeholder mismatches. They are not yet translated in ja.json (missing keys). When translating the batches containing these keys, ensure placeholders are preserved exactly.

| Key | English Placeholders | Notes |
|-----|---------------------|-------|
| ribbon.view.accessibilityIssues | [{count}] | |
| ribbon.insert.chartTablePrompt | [{count}] | |
| ribbon.insert.codeBlockMenu | [{label}] | |
| ribbon.insert.codeBlockSearchPlaceholder | [{count}] | |
| ribbon.insert.fileSizeError | [{size}] | |
| ribbon.insert.quickLanguageHint | [{lang}] | |
| ribbon.ink.select.selectionInfo | [{type}] | |
| ribbon.ink.select.strokesSelected | [{count}] | |
| ribbon.ink.paper.pageNumber | [{num}] | |
| ribbon.ink.tab.marks | [{count}] | |
| fileMenu.templates.confirmReplaceDesc | [{name}] | |
| fileMenu.templates.confirmDeleteDesc | [{name}] | |
| fileMenu.templates.deleted | [{name}] | |
| fileMenu.templates.deleteFailed | [{error}] | |
| fileMenu.printExport.exported | [{format}] | |
| fileMenu.printExport.exportFailed | [{error}] | |
| backup.skipped | [{count}] | |
| vault.cards.stats | [{due}, {total}] | |
| vault.cards.nextCard | [{date}] | |
| vault.cards.reps | [{count}] | |
| vault.graph.subtitle | [{links}, {notes}] | |
| vault.canvas.subtitle | [{cards}, {connections}] | |
| vault.canvas.stats | [{cards}, {connections}] | |
| vault.tables.subtitle | [{fields}, {rows}] | |
| vault.tables.stats | [{fields}, {rows}] | |
| vault.tables.tableGrid.renameColumn | [{name}] | |
| vault.tables.tableGrid.deleteColumn | [{name}] | |
| vault.code.subtitle | [{lines}] | |
| vault.queries.notesCount | [{all}, {total}] | |
| vault.extensions.activeCount | [{active}, {contracts}, {total}] | |
| vault.trash.description | [{days}] | |
| vault.trash.itemCount | [{count}, {plural}] | |
| vault.trash.deletedAgo | [{daysLeft}, {time}] | |
| vault.trash.daysLeft | [{count}] | |
| vault.trash.toastRestored | [{title}] | |
| vault.trash.deleteForeverDialog.description | [{title}] | |
| vault.trash.ariaDeleteForever | [{title}] | |
| vault.search.noNoteMentions | [{query}] | |
| vault.search.createNote | [{query}] | |

## Technical Terms Kept as English (Intentional)

| Key | Value | Reason |
|-----|-------|--------|
| ribbon.code.json | JSON | Standard technical format |
| ribbon.design.hexColorPlaceholder | #rrggbb | Hex color format placeholder |

## Glossary Consistency

Using glossary-ja.md terms consistently:
- note → ノート
- vault → ボルト
- tag → タグ
- link → リンク
- backlink → バックリンク
- graph → グラフ
- canvas → キャンバス
- table → テーブル
- flashcard → フラッシュカード
- journal → ジャーナル
- task → タスク
- ink / handwriting → インク / 手書き
- ribbon → リボン
- tab → タブ
- template → テンプレート
- theme → テーマ
- trash → ゴミ箱
- restore → 復元
- export → エクスポート
- import → インポート
- backup → バックアップ
- search → 検索
- settings → 設定
- extension → 拡張機能
- encryption / lock → 暗号化 / ロック
- attachment → 添付ファイル
- bookmark → ブックマーク
- figure → 図