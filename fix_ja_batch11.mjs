import fs from 'fs';

const content = fs.readFileSync('src/lib/locales/ja.json', 'utf8');
const ja = JSON.parse(content);

// Fix ja.json - add top-level "ink" key (matching en.json structure)
ja.ink = {
  "groups": {
    "draw": "描画",
    "color": "色",
    "history": "履歴",
    "view": "表示",
    "more": "その他"
  },
  "more": {
    "label": "その他",
    "hint": "めったに使わないツール",
    "modes": "モード",
    "eraser": "消しゴム設定",
    "brushEngine": "ブラシエンジン",
    "brushEngineHint": "ペンの動作、消しゴムエンジン、図形と定規の補助",
    "shapes": "図形",
    "coordinateGraph": "座標グラフ",
    "paper": "用紙",
    "paperStudio": "用紙スタジオ",
    "smartInk": "スマートインク",
    "handwriting": "手書き認識",
    "equation": "数式",
    "resultsSearch": "結果と検索",
    "audio": "オーディオ",
    "record": "録音",
    "stop": "停止",
    "play": "再生",
    "pause": "一時停止",
    "replayInk": "インク再生",
    "removeAudio": "オーディオ削除",
    "overlay": "オーバーレイ",
    "fullPage": "全ページ",
    "inkOverText": "テキスト上にインク",
    "destructive": "破壊的",
    "removeInk": "インク削除",
    "attachOld": "古いページを添付",
    "disabled": "最初に套索でストロークを選択してください"
  },
  "draw": {
    "pen": "ペン",
    "penHint": "ペンを選択",
    "eraser": "消しゴム",
    "eraserHint": "ストロークを消す",
    "lasso": "套索",
    "lassoHint": "ストロークを囲んで選択",
    "width": "幅",
    "saveFavPen": "現在のペンをお気に入りに保存",
    "removeFavPen": "お気に入りのペンを削除",
    "noFavPens": "お気に入りのペン設定をここに保存（最大8個）"
  },
  "color": {
    "picker": "色",
    "pickerHint": "カラーミキサー、パレット、履歴を開く"
  },
  "mode": {
    "select": "選択",
    "shape": "図形",
    "pan": "パン",
    "pick": "ピック",
    "insertSpace": "スペース挿入"
  },
  "groups": {
    "draw": "描画",
    "color": "色",
    "history": "履歴",
    "view": "表示",
    "more": "その他",
    "select": "選択",
    "object": "オブジェクト",
    "strokes": "ストローク",
    "transform": "変換",
    "template": "テンプレート",
    "pageSize": "ページサイズ",
    "pages": "ページ",
    "paperStudio": "用紙スタジオ",
    "recognise": "認識",
    "results": "結果",
    "record": "記録",
    "playback": "再生",
    "manage": "管理"
  },
  "history": {
    "undo": "元に戻す",
    "undoHint": "最後のストロークを元に戻す",
    "redo": "やり直し",
    "redoHint": "やり直し"
  },
  "view": {
    "zoomOut": "ズームアウト",
    "zoomIn": "ズームイン",
    "fit": "フィット",
    "fitHint": "ページをインクにフィット"
  },
  "select": {
    "select": "選択",
    "selectHint": "オブジェクトを選択、移動、サイズ変更、回転",
    "lasso": "套索",
    "lassoHint": "囲んでストロークを選択"
  },
  "object": {
    "delete": "削除",
    "deleteHint": "選択したオブジェクトを削除",
    "front": "最前面",
    "frontHint": "最前面に移動",
    "back": "最背面",
    "backHint": "最背面に移動"
  },
  "strokes": {
    "apply": "適用",
    "applyHint": "移動、スケール、回転を確定",
    "recolor": "再着色",
    "recolorHint": "選択範囲を現在のインクで再着色",
    "delete": "削除",
    "deleteHint": "選択したストロークを削除",
    "deselect": "選択解除",
    "deselectHint": "選択をクリア"
  },
  "transform": {
    "studio": "選択スタジオ",
    "studioHint": "選択範囲を正確に移動、拡大縮小、回転",
    "disabled": "最初に套索でストロークを選択してください"
  },
  "paper": {
    "template": "用紙テンプレート",
    "tone": "用紙トーン",
    "size": "ページサイズ",
    "studio": "用紙スタジオ",
    "studioHint": "すべての用紙オプションを一ヶ所に",
    "clear": "ページクリア",
    "clearHint": "このページのすべてのストロークを削除"
  },
  "pages": {
    "prev": "前のページ",
    "next": "次のページ",
    "page": "ページ {num}"
  },
  "smart": {
    "handwriting": "手書き認識",
    "handwritingHint": "套索選択または表示中のページをテキストに変換",
    "equation": "数式",
    "equationHint": "手書き数式をLaTeXに変換",
    "results": "結果と検索",
    "resultsHint": "認識されたテキスト、ページに挿入、すべての手書きを検索"
  },
  "audio": {
    "record": "録音",
    "recordHint": "書きながら音声を録音；すべてのストロークにタイムスタンプ",
    "stop": "停止",
    "play": "再生",
    "playHint": "録音を再生し、書かれた過程でページを再描画",
    "pause": "一時停止",
    "replayInk": "インク再生",
    "replayInkHint": "音声なしでストロークを再生",
    "noRecording": "録音なし",
    "studio": "オーディオスタジオ",
    "studioHint": "録音をスクラブ",
    "remove": "オーディオ削除",
    "removeHint": "このページから録音を削除",
    "recording": "録音中…"
  },
  "overlay": {
    "fullPage": "全ページ",
    "inkOverText": "テキスト上にインク",
    "fullPageHint": "全ページインクサーフェスに切り替え",
    "inkOverTextHint": "読み取りビューでメモテキスト上にインクを表示"
  },
  "tab": {
    "handwriting": "手書き",
    "startInking": "インク開始",
    "startInkingHint": "このノートに手書きページを追加",
    "attachOldPage": "古いページを添付",
    "attachOldPageHint": "Inkがノート内に移動する前の手書きページを取り込む",
    "noAttachable": "未添付のインクページはありません。",
    "ink": "インク",
    "overlay": "オーバーレイ",
    "handwritingPage": "手書きページ",
    "marks": "{count} マーク",
    "saving": "保存中...",
    "saved": "保存済み",
    "autosave": "自動保存オン",
    "attachOld": "古いページを添付",
    "attachOldHint": "以前に作成した手書きページをこのノートに添付",
    "statusSaving": "保存中…",
    "statusSaved": "保存済み",
    "statusAutosave": "自動保存オン",
    "removeInk": "インク削除",
    "removeInkHint": "このノートのすべての手書きを削除"
  }
};

// Fix ribbon.ink to match en.json structure
ja.ribbon.ink = {
  "draw": {
    "mode": "モード",
    "pens": "ペン",
    "favouritePens": "お気に入りペン",
    "stroke": "ストローク",
    "eraser": "消しゴム",
    "history": "履歴",
    "view": "表示",
    "shapes": "図形",
    "drawMode": "描画",
    "drawModeHint": "現在のペンで描画",
    "shapeMode": "図形",
    "shapeModeHint": "線、四角形、円、座標グラフを描画",
    "selectMode": "選択",
    "selectModeHint": "オブジェクトを選択、移動、サイズ変更、回転",
    "lassoMode": "套索",
    "lassoModeHint": "囲んでストロークを選択",
    "eraseMode": "消しゴム",
    "eraseModeHint": "ストロークを消す",
    "panMode": "パン",
    "panModeHint": "ページを移動",
    "eyedropperMode": "スポイト",
    "eyedropperModeHint": "ページから色を選択",
    "insertSpaceMode": "スペース挿入",
    "insertSpaceModeHint": "ドラッグしてインクストローク間に垂直スペースを挿入または削除",
    "brushEngine": "ブラシエンジン",
    "brushEngineHint": "ペンの動作、消しゴムエンジン、図形と定規の補助",
    "eraseStroke": "ストローク",
    "eraseStrokeHint": "ストローク全体を消去",
    "erasePrecision": "ポイント",
    "erasePrecisionHint": "精密消しゴム",
    "eraserSmall": "小さい消しゴム (12px)",
    "eraserMedium": "中サイズ消しゴム (26px)",
    "eraserLarge": "大きい消しゴム (50px)",
    "eraserRadius": "半径",
    "undo": "元に戻す",
    "undoHint": "最後のストロークを元に戻す",
    "redo": "やり直し",
    "redoHint": "やり直し",
    "zoomOut": "ズームアウト",
    "zoomIn": "ズームイン",
    "fit": "フィット",
    "fitHint": "ページをインクにフィット",
    "clearPage": "ページクリア",
    "clearPageHint": "このページのすべてのストロークを削除",
    "coordinateGraph": "座標グラフ",
    "coordinateGraphHint": "軸、グリッド、目盛り付き座標グラフを挿入",
    "addCoordinateGraph": "座標グラフを追加",
    "insertSpaceToast": "テキストは動きません。線の下のインクは、元々書かれたテキストの位置から離れます。",
    "snapShapes": "図形スナップ",
    "snapShapesHint": "フリーハンドストロークを自動的に幾何学図形に変換",
    "comingSoon": "近日公開",
    "saveFavPen": "現在のペンをお気に入りに保存",
    "removeFavPen": "お気に入りのペンを削除",
    "favPenEmpty": "ここにあなたのお気に入りのペン設定を保存（最大8個）",
    "strokeWidth": "太さ",
    "strokeOpacity": "不透明度"
  },
  "color": {
    "current": "現在",
    "hexPlaceholder": "#RRGGBB",
    "hexAriaLabel": "16進数カラー",
    "hexHelpValid": "3桁または6桁の16進数、#あり/なし",
    "hexHelpInvalid": "無効な16進数 — Escapeで元に戻す",
    "quickInks": "クイックインク",
    "recent": "最近使用",
    "recentEmpty": "使用した色がここに表示されます",
    "studio": "スタジオ",
    "colorStudio": "カラースタジオ",
    "colorStudioHint": "ミキサー、パレット、不透明度、カスタムカラー",
    "pick": "ピック",
    "pickHint": "ページから色を選択",
    "opacity": "不透明度"
  },
  "select": {
    "select": "選択",
    "selectHint": "オブジェクトを選択、移動、サイズ変更、回転",
    "lasso": "套索",
    "lassoHint": "囲んでストロークを選択",
    "selectionInfo": "オブジェクト: {type}",
    "strokesSelected": "{count} ストローク",
    "nothingSelected": "何も選択されていません",
    "apply": "適用",
    "applyHint": "移動、スケール、回転を確定",
    "recolor": "再着色",
    "recolorHint": "選択範囲を現在のインクで再着色",
    "delete": "削除",
    "deleteHint": "選択したストロークを削除",
    "deselect": "選択解除",
    "deselectHint": "選択をクリア",
    "transform": "変換",
    "selectionStudio": "選択スタジオ",
    "selectionStudioHint": "選択範囲を正確に移動、拡大縮小、回転",
    "selectFirst": "まず套索でストロークを選択",
    "selectObjectFirst": "選択ツールでオブジェクトを選択"
  },
  "paper": {
    "template": "テンプレート",
    "paperTemplate": "用紙テンプレート",
    "paperTone": "用紙トーン",
    "pageSize": "ページサイズ",
    "pages": "ページ",
    "previousPage": "前のページ",
    "nextPage": "次のページ",
    "pageNumber": "ページ {num}",
    "studio": "スタジオ",
    "paperStudio": "用紙スタジオ",
    "paperStudioHint": "すべての用紙オプションを一ヶ所に",
    "clearPage": "ページクリア",
    "clearPageHint": "このページのすべてのストロークを削除"
  },
  "frames": {
    "template": "テンプレート",
    "paperTemplate": "用紙テンプレート",
    "paperTone": "用紙トーン",
    "pageSize": "ページサイズ",
    "pages": "ページ",
    "previousPage": "前のページ",
    "nextPage": "次のページ",
    "pageNumber": "ページ {num}",
    "studio": "スタジオ",
    "paperStudio": "用紙スタジオ",
    "paperStudioHint": "すべての用紙オプションを一ヶ所に",
    "coordinateGraph": "座標グラフ",
    "coordinateGraphHint": "軸、グリッド、目盛り付き座標グラフを挿入",
    "addCoordinateGraph": "座標グラフを追加",
    "clearPage": "ページクリア",
    "clearPageHint": "このページのすべてのストロークを削除"
  },
  "objects": {
    "select": "選択",
    "selectHint": "オブジェクトを選択、移動、サイズ変更、回転",
    "lasso": "套索",
    "lassoHint": "囲んでストロークを選択",
    "shapes": "図形",
    "shapesHint": "長方形、円、線、矢印、多角形を挿入",
    "stickers": "ステッカー",
    "stickersHint": "装飾ステッカーを挿入",
    "textbox": "テキストボックス",
    "textboxHint": "テキストボックスを挿入",
    "sticky": "付箋",
    "stickyHint": "付箋を挿入",
    "selectionInfo": "オブジェクト: {type}",
    "strokesSelected": "{count} ストローク",
    "nothingSelected": "何も選択されていません",
    "apply": "適用",
    "applyHint": "移動、スケール、回転を確定",
    "recolor": "再着色",
    "recolorHint": "選択範囲を現在のインクで再着色",
    "delete": "削除",
    "deleteHint": "選択したオブジェクトを削除",
    "deselect": "選択解除",
    "deselectHint": "選択をクリア",
    "transform": "変換",
    "selectionStudio": "選択スタジオ",
    "selectionStudioHint": "選択範囲を正確に移動、拡大縮小、回転",
    "selectFirst": "まず套索でストロークを選択",
    "selectObjectFirst": "選択ツールでオブジェクトを選択"
  },
  "smart": {
    "recognise": "認識",
    "handwriting": "手書き認識",
    "handwritingHint": "套索選択または視野内のページをテキストに変換",
    "equation": "数式",
    "equationHint": "手書き数学をLaTeXに変換",
    "resultsAndSearch": "結果と検索",
    "resultsSearch": "結果と検索",
    "resultsSearchHint": "認識されたテキスト、ページに挿入、すべての手書きを検索"
  },
  "audio": {
    "record": "録音",
    "recordLabel": "書きながら音声を録音；すべてのストロークにタイムスタンプ",
    "stop": "停止",
    "stopLabel": "録音停止",
    "playback": "再生",
    "play": "再生",
    "playHint": "録音を再生し、書かれた過程でページを再描画",
    "pause": "一時停止",
    "replayInk": "インク再生",
    "replayInkHint": "音声なしでストロークを再生",
    "noRecording": "録音なし",
    "manage": "管理",
    "audioStudio": "オーディオスタジオ",
    "audioStudioHint": "録音をスクラブ",
    "removeAudio": "オーディオ削除",
    "removeAudioHint": "このページから録音を削除",
    "recordFirst": "まず音声を録音してください"
  },
  "tab": {
    "ink": "インク",
    "handwriting": "手書き",
    "startInking": "インク開始",
    "startInkingHint": "このノートに手書きページを追加",
    "attachOldPage": "古いページを添付",
    "attachOldPageHint": "Inkがノート内に移動する前の手書きページを取り込む",
    "noUnattachedPages": "未添付のインクページはありません。",
    "about": "について",
    "aboutText": "すべてのノートは独自の手書きページを持てます。ペン、色、選択、用紙、スマートインク、オーディオは開始するとここに表示されます。",
    "subtabDraw": "描画",
    "subtabFrames": "フレーム",
    "subtabObjects": "オブジェクト",
    "subtabView": "表示",
    "subtabColor": "色",
    "subtabSelect": "選択",
    "subtabPaper": "用紙",
    "subtabSmart": "スマートインク",
    "subtabAudio": "オーディオ",
    "overlay": "オーバーレイ",
    "fullPage": "全ページ",
    "inkOverText": "テキスト上にインク",
    "fullPageHint": "全ページインクサーフェスに切り替え",
    "inkOverTextHint": "読み取りビューでメモテキスト上にインクを表示",
    "marks": "{count} マーク",
    "statusSaving": "保存中…",
    "statusSaved": "保存済み",
    "statusAutosave": "自動保存オン",
    "removeInk": "インク削除",
    "removeInkHint": "このノートのすべての手書きを削除"
  },
  "eraserModes": {
    "stroke": "ストローク",
    "precision": "精密"
  },
  "groups": {
    "draw": "描画",
    "frames": "フレーム",
    "objects": "オブジェクト",
    "view": "表示",
    "more": "その他"
  },
  "more": {
    "label": "その他",
    "hint": "めったに使わないツール",
    "modes": "モード",
    "eraser": "消しゴム設定",
    "brushEngine": "ブラシエンジン",
    "brushEngineHint": "ペンの動作、消しゴムエンジン、図形と定規の補助",
    "shapes": "図形",
    "coordinateGraph": "座標グラフ",
    "paper": "用紙",
    "paperStudio": "用紙スタジオ",
    "smartInk": "スマートインク",
    "handwriting": "手書き認識",
    "equation": "数式",
    "resultsSearch": "結果と検索",
    "audio": "オーディオ",
    "record": "録音",
    "stop": "停止",
    "play": "再生",
    "pause": "一時停止",
    "replayInk": "インク再生",
    "removeAudio": "オーディオ削除",
    "overlay": "オーバーレイ",
    "fullPage": "全ページ",
    "inkOverText": "テキスト上にインク",
    "destructive": "破壊的",
    "removeInk": "インク削除",
    "attachOld": "古いページを添付",
    "disabled": "最初に套索でストロークを選択"
  },
  "draw": {
    "pen": "ペン",
    "penHint": "ペンを選択",
    "eraser": "消しゴム",
    "eraserHint": "ストロークを消す",
    "lasso": "套索",
    "lassoHint": "ストロークを囲んで選択",
    "width": "幅",
    "saveFavPen": "現在のペンをお気に入りに保存",
    "removeFavPen": "お気に入りのペンを削除",
    "noFavPens": "お気に入りのペン設定をここに保存（最大8個）"
  },
  "color": {
    "picker": "色",
    "pickerHint": "カラーミキサー、パレット、履歴を開く"
  },
  "tab": {
    "handwriting": "手書き",
    "startInking": "インク開始",
    "startInkingHint": "このノートに手書きページを追加",
    "attachOldPage": "古いページを添付",
    "attachOldPageHint": "Inkがノート内に移動する前の手書きページを取り込む",
    "noAttachable": "未添付のインクページはありません。",
    "ink": "インク",
    "overlay": "オーバーレイ",
    "fullPage": "全ページ",
    "inkOverText": "テキスト上にインク",
    "fullPageHint": "全ページインクサーフェスに切り替え",
    "inkOverTextHint": "読み取りビューでメモテキスト上にインクを表示",
    "handwritingPage": "手書きページ",
    "marks": "{count} マーク",
    "statusSaving": "保存中…",
    "statusSaved": "保存済み",
    "statusAutosave": "自動保存オン",
    "removeInk": "インク削除",
    "removeInkHint": "このノートのすべての手書きを削除"
  }
};

// Add missing ribbon.view keys
ja.ribbon.view = {
  ...ja.ribbon.view,
  "navigation": "ナビゲーション",
  "pageWidth": "ページ幅",
  "onePage": "1ページ",
  "twoPages": "2ページ",
  "pageScroll": "ページスクロール",
  "narrow": "狭い",
  "medium": "標準",
  "wide": "広い",
  "full": "全幅",
  "attachTable": "テーブル添付",
  "importPdf": "PDFインポート",
  "importPdfHint": "PDFファイルを新しいノートとしてインポート",
  "importPdfPrompt": "このPDFを新しいノートとしてインポートしますか？",
  "pdfImported": "PDFをノートとしてインポートしました",
  "pdfImportError": "PDFのインポートに失敗しました",
  "prevPage": "前のページ",
  "nextPage": "次のページ",
  "page": "ページ {current} / {total}",
  "resetZoom": "ズームリセット",
  "print": "印刷",
  "download": "ダウンロード",
  "loadingPdf": "PDF読み込み中…",
  "pdfLoadError": "PDF読み込みエラー",
  "noPdf": "PDFが読み込まれていません",
  "editorA11y": "エディタとアクセシビリティ",
  "annotate": {
    "enter": "注釈",
    "enterHint": "このPDFページに描画",
    "exit": "注釈終了",
    "exitHint": "描画をやめて表示に戻る",
    "save": "PDFに保存",
    "saveHint": "注釈をPDFファイルに保存",
    "saved": "注釈をPDFに保存しました",
    "export": "PDFエクスポート",
    "exportHint": "編集可能/フラット化した注釈付きでコピーをダウンロード",
    "exportAnnotated": "注釈付きエクスポート",
    "exportAnnotatedHint": "注釈付きでダウンロード（再開時編集可能）",
    "exportFlattened": "フラット化エクスポート",
    "exportFlattenedHint": "注釈を焼き付けてダウンロード（編集不可）",
    "exported": "PDFをエクスポート",
    "exportedFlattened": "フラット化されたPDFをエクスポート"
  }
};

// Add missing ribbon.insert keys
ja.ribbon.insert = {
  ...ja.ribbon.insert,
  "mathBlock": "数式ブロック",
  "mathBlockHint": "数式ブロックを挿入 ($$ … $$)",
  "htmlMath": "数式 (KaTeX)",
  "htmlMathHint": "ローカルCSS参照付きレンダリング済みKaTeX数式マークアップを挿入（HTML形式のみ）"
};

// Add missing fileMenu keys
ja.fileMenu = {
  ...ja.fileMenu,
  "printExport": {
    ...ja.fileMenu.printExport,
    "htmlEmbedded": "単一ファイル（画像埋め込み）",
    "openAsCanvas": "キャンバスとして開く",
    "openAsCanvasHint": "このノートの内容でA4フレームのキャンバスを作成",
    "canvasCreated": "キャンバス作成: {name}"
  },
  "migration": {
    "title": "ノート形式移行",
    "message": "このバージョンのLemonNoteはノート形式を簡素化します。YAML、XML、JSON、TOML、CSV、INI、CSS、JavaScript、TypeScript、Python、Rust、Bash、SQL形式のノートは、フェンスコードブロック付きMarkdownに変換され、正確な内容が保持されます。",
    "backupTitle": "移行前にバックアップを作成",
    "backupMessage": "移行実行前に、保存庫の完全バックアップが作成されます。問題が発生した場合に復元できるよう、強く推奨されます。",
    "backupButton": "バックアップを作成して移行",
    "skipButton": "バックアップをスキップ（非推奨）",
    "backupSuccess": "バックアップ作成成功。移行開始…",
    "backupFailed": "バックアップ失敗: {error}。データ保護のため移行中止。",
    "migrationComplete": "移行完了。{count}件のノートを変換。",
    "migrationFailed": "移行失敗: {error}"
  }
};

// Add missing backup keys
ja.backup = {
  ...ja.backup,
  "exportSuccess": "バックアップを正常にエクスポートしました。",
  "largeWarning": "大きなバックアップファイル — 分割または外部ストレージの使用を検討してください。",
  "exportFailed": "バックアップのエクスポートに失敗しました。",
  "readFailed": "バックアップファイルの読み取りに失敗しました。",
  "importFailed": "バックアップのインポートに失敗しました。",
  "previewFailed": "インポートプレビューに失敗しました。",
  "selectFilesAgain": "ファイルをもう一度選択してください。",
  "selectFolderAgain": "フォルダをもう一度選択してください。",
  "inFile": "ファイル内",
  "willImport": "インポート予定",
  "replaceWarning": "これにより保存庫のすべての既存データが置き換えられます。",
  "attachmentsWarning": "バックアップに添付ファイルが含まれています ({size})。インポートに時間がかかる場合があります。",
  "confirmFolderImport": "フォルダインポートを確認",
  "confirmFileImport": "ファイルインポートを確認",
  "filesFound": "ファイルが見つかりました",
  "notesToImport": "インポート対象ノート",
  "duplicatesFound": "重複が見つかりました",
  "duplicateAction": "重複時の処理",
  "andMore": "+{count} 件以上",
  "preserveFolders": "フォルダ構造を保持",
  "wholeVault": "保存庫全体",
  "exportBackup": "バックアップをエクスポート",
  "importBackup": "バックアップをインポート",
  "importFiles": "Markdownファイルをインポート",
  "importMarkdown": "Markdown / テキストファイルをインポート",
  "importMarkdownDesc": ".md、.markdown、.txtファイルを選択してノートとしてインポート。",
  "importFilesBtn": "ファイル選択",
  "importFolderBtn": "フォルダ選択",
  "onImport": "インポート時",
  "keepExisting": "既存を保持",
  "replaceEverything": "すべて置換",
  "confirmImport": "インポート確認"
};

// Add missing vault.canvas keys
ja.vault = {
  ...ja.vault,
  "canvas": {
    ...ja.vault.canvas,
    "addFrame": "フレーム追加",
    "fitToPage": "ページに合わせる",
    "fitToWidth": "幅に合わせる",
    "zoomOut": "ズームアウト",
    "zoomIn": "ズームイン",
    "resetView": "ビューをリセット",
    "export": "エクスポート",
    "import": "インポート",
    "exportTooltip": ".lemoncanvasとしてエクスポート",
    "importTooltip": ".lemoncanvasファイルをインポート",
    "importSuccess": "キャンバスを正常にインポート",
    "exportPdf": "PDFとしてエクスポート",
    "exportPng": "PNGとしてエクスポート",
    "exportWholeCanvas": "キャンバス全体",
    "exportSelectedFrame": "選択フレーム",
    "exportPdfTooltip": "キャンバスをPDFにエクスポート",
    "exportPngTooltip": "キャンバスをPNGにエクスポート",
    "selectFrameFirst": "個別エクスポートするにはまずフレームを選択",
    "newDesign": "新規デザイン",
    "modeDesign": "デザイン",
    "kindDesign": "デザイン",
    "frameTypes": {
      "a4": "A4縦",
      "a4-landscape": "A4横",
      "letter": "レター",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "正方形",
      "free": "フリー"
    },
    "textFrame": {
      "locked": "上にインクが描かれているためテキストがロックされています",
      "unlock": "ロック解除",
      "unlockWarning": "ロック解除で編集可能になりますが、インクストロークがテキスト内容と一致しなくなる可能性があります。"
    }
  }
};

// Add format capability
ja.format = {
  "capability": {
    "markdown": {
      "ink": "Markdownでは利用不可",
      "shapes": "Markdownでは利用不可"
    },
    "plain": {
      "richFormat": "プレーンテキストでは利用不可",
      "codeBlocks": "プレーンテキストでは利用不可",
      "math": "プレーンテキストでは利用不可",
      "images": "プレーンテキストでは利用不可",
      "tables": "プレーンテキストでは利用不可",
      "ink": "プレーンテキストでは利用不可",
      "shapes": "プレーンテキストでは利用不可",
      "insert": "プレーンテキストでは利用不可",
      "design": "プレーンテキストでは利用不可",
      "layout": "プレーンテキストでは利用不可",
      "exportPdf": "プレーンテキストでは利用不可"
    },
    "html": {
      "ink": "HTMLでは利用不可",
      "shapes": "HTMLでは利用不可",
      "design": "HTMLスタイルはソースにあります",
      "layout": "HTMLスタイルはソースにあります"
    },
    "pdf": {
      "editText": "PDFでは利用不可",
      "richFormat": "PDFでは利用不可",
      "codeBlocks": "PDFでは利用不可",
      "math": "PDFでは利用不可",
      "images": "PDFでは利用不可",
      "tables": "PDFでは利用不可",
      "links": "PDFでは利用不可",
      "insert": "PDFでは利用不可",
      "design": "PDFでは利用不可",
      "layout": "PDFでは利用不可"
    },
    "canvas": {}
  }
};

// Remove extra keys
// Remove old ribbon.ink keys that don't match en.json structure
delete ja.ribbon.ink.color.colorStudio;
delete ja.ribbon.ink.color.colorStudioHint;
delete ja.ribbon.ink.color.current;
delete ja.ribbon.ink.color.hexAriaLabel;
delete ja.ribbon.ink.color.hexHelpInvalid;
delete ja.ribbon.ink.color.hexHelpValid;
delete ja.ribbon.ink.color.hexPlaceholder;
delete ja.ribbon.ink.color.opacity;
delete ja.ribbon.ink.color.pick;
delete ja.ribbon.ink.color.pickHint;
delete ja.ribbon.ink.color.quickInks;
delete ja.ribbon.ink.color.recent;
delete ja.ribbon.ink.color.recentEmpty;
delete ja.ribbon.ink.color.studio;
delete ja.ribbon.ink.draw.addCoordinateGraph;
delete ja.ribbon.ink.draw.brushEngine;
delete ja.ribbon.ink.draw.brushEngineHint;
delete ja.ribbon.ink.draw.clearPage;
delete ja.ribbon.ink.draw.clearPageHint;
delete ja.ribbon.ink.draw.coordinateGraph;
delete ja.ribbon.ink.draw.coordinateGraphHint;
delete ja.ribbon.ink.draw.drawMode;
delete ja.ribbon.ink.draw.drawModeHint;
delete ja.ribbon.ink.draw.eraseMode;
delete ja.ribbon.ink.draw.eraseModeHint;
delete ja.ribbon.ink.draw.erasePrecision;
delete ja.ribbon.ink.draw.erasePrecisionHint;
delete ja.ribbon.ink.draw.eraseStroke;
delete ja.ribbon.ink.draw.eraseStrokeHint;
delete ja.ribbon.ink.draw.eraserLarge;
delete ja.ribbon.ink.draw.eraserMedium;
delete ja.ribbon.ink.draw.eraserRadius;
delete ja.ribbon.ink.draw.eraserSmall;
delete ja.ribbon.ink.draw.eyedropperMode;
delete ja.ribbon.ink.draw.eyedropperModeHint;
delete ja.ribbon.ink.draw.favPenEmpty;
delete ja.ribbon.ink.draw.favouritePens;
delete ja.ribbon.ink.draw.fit;
delete ja.ribbon.ink.draw.fitHint;
delete ja.ribbon.ink.draw.history;
delete ja.ribbon.ink.draw.insertSpaceMode;
delete ja.ribbon.ink.draw.insertSpaceModeHint;
delete ja.ribbon.ink.draw.insertSpaceToast;
delete ja.ribbon.ink.draw.lassoMode;
delete ja.ribbon.ink.draw.lassoModeHint;
delete ja.ribbon.ink.draw.mode;
delete ja.ribbon.ink.draw.panMode;
delete ja.ribbon.ink.draw.panModeHint;
delete ja.ribbon.ink.draw.pens;
delete ja.ribbon.ink.draw.redo;
delete ja.ribbon.ink.draw.redoHint;
delete ja.ribbon.ink.draw.selectMode;
delete ja.ribbon.ink.draw.selectModeHint;
delete ja.ribbon.ink.draw.shapeMode;
delete ja.ribbon.ink.draw.shapeModeHint;
delete ja.ribbon.ink.draw.shapes;
delete ja.ribbon.ink.draw.stroke;
delete ja.ribbon.ink.draw.strokeOpacity;
delete ja.ribbon.ink.draw.strokeWidth;
delete ja.ribbon.ink.draw.undo;
delete ja.ribbon.ink.draw.undoHint;
delete ja.ribbon.ink.draw.view;
delete ja.ribbon.ink.draw.zoomIn;
delete ja.ribbon.ink.draw.zoomOut;
delete ja.ribbon.ink.tab.about;
delete ja.ribbon.ink.tab.aboutText;
delete ja.ribbon.ink.tab.noUnattachedPages;
delete ja.ribbon.ink.tab.subtabAudio;
delete ja.ribbon.ink.tab.subtabColor;
delete ja.ribbon.ink.tab.subtabDraw;
delete ja.ribbon.ink.tab.subtabPaper;
delete ja.ribbon.ink.tab.subtabSelect;
delete ja.ribbon.ink.tab.subtabSmart;
delete ja.ribbon.view.pageDisplay;
delete ja.wordGoal.wordGoal;
delete ja.wordGoal.targetWords;
delete ja.wordGoal.setGoal;
delete ja.wordGoal.updateGoal;
delete ja.wordGoal.editGoal;
delete ja.wordGoal.clearGoal;
delete ja.vault.shortcuts.cards.heroTitle;
delete ja.vault.shortcuts.cards.newCard;
delete ja.vault.shortcuts.cards.stats;
delete ja.vault.shortcuts.cards.nothingDue;
delete ja.vault.shortcuts.cards.noCards;
delete ja.vault.shortcuts.cards.nextCard;
delete ja.vault.shortcuts.cards.emptyHint;
delete ja.vault.shortcuts.cards.allCards;
delete ja.vault.shortcuts.cards.reps;
delete ja.vault.shortcuts.cards.deleteCard;
delete ja.vault.shortcuts.graph.heroTitle;
delete ja.vault.shortcuts.graph.subtitle;
delete ja.vault.shortcuts.graph.emptyState;
delete ja.vault.shortcuts.graph.backToVault;
delete ja.vault.shortcuts.canvas.heroTitle;
delete ja.vault.shortcuts.canvas.subtitle;
delete ja.vault.shortcuts.canvas.emptyState;
delete ja.vault.shortcuts.canvas.backToCanvases;
delete ja.vault.shortcuts.canvas.cardInspector;
delete ja.vault.shortcuts.canvas.canvasGuide;
delete ja.vault.shortcuts.canvas.guideText1;
delete ja.vault.shortcuts.canvas.guideText2;
delete ja.vault.shortcuts.canvas.stats;
delete ja.vault.shortcuts.canvas.newCardTitle;
delete ja.vault.shortcuts.canvas.addCard;
delete ja.vault.shortcuts.canvas.saving;
delete ja.vault.shortcuts.canvas.saved;
delete ja.vault.shortcuts.canvas.autosaveOn;
delete ja.vault.shortcuts.canvas.canvasName;
delete ja.vault.shortcuts.canvas.status.saving;
delete ja.vault.shortcuts.canvas.status.saved;
delete ja.vault.shortcuts.canvas.status.autosaveOn;
delete ja.vault.shortcuts.canvas.addFrame;
delete ja.vault.shortcuts.canvas.fitToPage;
delete ja.vault.shortcuts.canvas.fitToWidth;
delete ja.vault.shortcuts.canvas.zoomOut;
delete ja.vault.shortcuts.canvas.zoomIn;
delete ja.vault.shortcuts.canvas.resetView;
delete ja.vault.shortcuts.canvas.export;
delete ja.vault.shortcuts.canvas.import;
delete ja.vault.shortcuts.canvas.exportTooltip;
delete ja.vault.shortcuts.canvas.importTooltip;
delete ja.vault.shortcuts.canvas.importSuccess;
delete ja.vault.shortcuts.canvas.exportPdf;
delete ja.vault.shortcuts.canvas.exportPng;
delete ja.vault.shortcuts.canvas.exportWholeCanvas;
delete ja.vault.shortcuts.canvas.exportSelectedFrame;
delete ja.vault.shortcuts.canvas.exportPdfTooltip;
delete ja.vault.shortcuts.canvas.exportPngTooltip;
delete ja.vault.shortcuts.canvas.selectFrameFirst;
delete ja.vault.shortcuts.canvas.newDesign;
delete ja.vault.shortcuts.canvas.modeDesign;
delete ja.vault.shortcuts.canvas.kindDesign;
delete ja.vault.shortcuts.canvas.frameTypes.a4;
delete ja.vault.shortcuts.canvas.frameTypes["a4-landscape"];
delete ja.vault.shortcuts.canvas.frameTypes.letter;
delete ja.vault.shortcuts.canvas.frameTypes["3:4"];
delete ja.vault.shortcuts.canvas.frameTypes["4:3"];
delete ja.vault.shortcuts.canvas.frameTypes["16:9"];
delete ja.vault.shortcuts.canvas.frameTypes.square;
delete ja.vault.shortcuts.canvas.frameTypes.free;
delete ja.vault.shortcuts.canvas.textFrame.locked;
delete ja.vault.shortcuts.canvas.textFrame.unlock;
delete ja.vault.shortcuts.canvas.textFrame.unlockWarning;
delete ja.vault.shortcuts.tables.heroTitle;
delete ja.vault.shortcuts.tables.subtitle;
delete ja.vault.shortcuts.tables.emptyState;
delete ja.vault.shortcuts.tables.backToTables;
delete ja.vault.shortcuts.tables.viewTable;
delete ja.vault.shortcuts.tables.viewBoard;
delete ja.vault.shortcuts.tables.viewGallery;
delete ja.vault.shortcuts.tables.addColumn;
delete ja.vault.shortcuts.tables.addRow;
delete ja.vault.shortcuts.tables.priorityPlaceholder;
delete ja.vault.shortcuts.tables.typePlaceholder;
delete ja.vault.shortcuts.tables.optionsPlaceholder;
delete ja.vault.shortcuts.tables.tablePickerPlaceholder;
delete ja.vault.shortcuts.tables.addButton;
delete ja.vault.shortcuts.tables.status.saving;
delete ja.vault.shortcuts.tables.status.saved;
delete ja.vault.shortcuts.tables.status.autosaveOn;
delete ja.vault.shortcuts.tables.stats;
delete ja.vault.shortcuts.tables.tableName;
delete ja.vault.shortcuts.tables.columnTypes.text;
delete ja.vault.shortcuts.tables.columnTypes.number;
delete ja.vault.shortcuts.tables.columnTypes.select;
delete ja.vault.shortcuts.tables.columnTypes.date;
delete ja.vault.shortcuts.tables.columnTypes.checkbox;
delete ja.vault.shortcuts.tables.columnTypes.relation;
delete ja.vault.shortcuts.tables.typeBadge.text;
delete ja.vault.shortcuts.tables.typeBadge.number;
delete ja.vault.shortcuts.tables.typeBadge.select;
delete ja.vault.shortcuts.tables.typeBadge.date;
delete ja.vault.shortcuts.tables.typeBadge.checkbox;
delete ja.vault.shortcuts.tables.typeBadge.relation;
delete ja.vault.shortcuts.tables.tableGrid.placeholder;
delete ja.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete ja.vault.shortcuts.tables.tableGrid.renameColumn;
delete ja.vault.shortcuts.tables.tableGrid.deleteColumn;
delete ja.vault.shortcuts.tables.tableGrid.deleteRow;
delete ja.vault.shortcuts.tables.tableGrid.noRows;
delete ja.vault.shortcuts.tables.boardView.needsSelect;
delete ja.vault.shortcuts.tables.boardView.addSelect;
delete ja.vault.shortcuts.tables.boardView.ungrouped;
delete ja.vault.shortcuts.tables.galleryView.noRows;
delete ja.vault.shortcuts.tables.galleryView.addRow;
delete ja.vault.shortcuts.tables.galleryView.checkboxYes;
delete ja.vault.shortcuts.code.heroTitle;
delete ja.vault.shortcuts.code.subtitle;
delete ja.vault.shortcuts.code.emptyState;
delete ja.vault.shortcuts.code.backToCode;
delete ja.vault.shortcuts.code.fileName;
delete ja.vault.shortcuts.code.languagePlaceholder;
delete ja.vault.shortcuts.code.findButton;
delete ja.vault.shortcuts.code.status.saving;
delete ja.vault.shortcuts.code.status.saved;
delete ja.vault.shortcuts.code.status.autosaveOn;
delete ja.vault.shortcuts.queries.heroTitle;
delete ja.vault.shortcuts.queries.description;
delete ja.vault.shortcuts.queries.placeholder;
delete ja.vault.shortcuts.queries.saveButton;
delete ja.vault.shortcuts.queries.resultsLabel;
delete ja.vault.shortcuts.queries.indexing;
delete ja.vault.shortcuts.queries.notesCount;
delete ja.vault.shortcuts.queries.savedQueriesLabel;
delete ja.vault.shortcuts.queries.noSavedQueries;
delete ja.vault.shortcuts.queries.syntaxLabel;
delete ja.vault.shortcuts.extensions.heroTitle;
delete ja.vault.shortcuts.extensions.description;
delete ja.vault.shortcuts.extensions.installedLabel;
delete ja.vault.shortcuts.extensions.activeCount;
delete ja.vault.shortcuts.extensions.cssOverridesLabel;
delete ja.vault.shortcuts.extensions.cssOverridesDesc;
delete ja.vault.shortcuts.extensions.customThemeExample;
delete ja.vault.shortcuts.extensions.applyButton;
delete ja.vault.shortcuts.extensions.resetButton;
delete ja.vault.shortcuts.extensions.appliedStatus;
delete ja.vault.shortcuts.extensions.runtimeLogLabel;
delete ja.vault.shortcuts.extensions.liveStatus;
delete ja.vault.shortcuts.extensions.tabManifestLabel;
delete ja.vault.shortcuts.extensions.tabManifestDesc;
delete ja.vault.shortcuts.trash.heroTitle;
delete ja.vault.shortcuts.trash.description;
delete ja.vault.shortcuts.trash.itemCount;
delete ja.vault.shortcuts.trash.loading;
delete ja.vault.shortcuts.trash.emptyState;
delete ja.vault.shortcuts.trash.emptyDescription;
delete ja.vault.shortcuts.trash.noteSnippet;
delete ja.vault.shortcuts.trash.deletedAgo;
delete ja.vault.shortcuts.trash.expiresToday;
delete ja.vault.shortcuts.trash.daysLeft;
delete ja.vault.shortcuts.trash.restoreButton;
delete ja.vault.shortcuts.trash.toastRestored;
delete ja.vault.shortcuts.trash.deleteForeverDialog.title;
delete ja.vault.shortcuts.trash.deleteForeverDialog.description;
delete ja.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete ja.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete ja.vault.shortcuts.trash.ariaDeleteForever;

// Write back
fs.writeFileSync('src/lib/locales/ja.json', JSON.stringify(ja, null, 2) + '\n', 'utf8');
console.log('Done!');