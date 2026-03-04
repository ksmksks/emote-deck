# EmoteDeck

EmoteDeck は Twitch Extension 向けのスタンプ/バッジ表示パネルです。  
サーバーや Node.js を使わないフロントエンド構成で、配信者ごとに高いカスタマイズ性を提供します。

## 主な機能（v1.1.0）
- `Stamps` タブで以下を表示
  - Follower
  - Tier 1 / Tier 2 / Tier 3
  - Cheermotes
- `Badges` タブで以下を表示
  - Subscriber Badges
  - Bits Badges
- `Visibility` でカテゴリ/サブカテゴリ/個別アイテムの ON/OFF
- ドラッグアンドドロップによる並び替え
- `Labels and Interactions`
  - 名前表示 ON/OFF
  - 名前サイズ調整
  - Hover Tooltip ON/OFF
  - クリックでスタンプ名コピー（Copy フィードバック）
- `Layout Settings`
  - Columns
  - Stamp Size
  - Inner Padding
  - Gap
- `Theme and Colors` / `Effects`
  - Primary / Accent / Background
  - Header / Footer / Panel / Stamp 背景色
  - Radius / Glow
  - Font Family
- Config のリアルタイムプレビュー（デスクトップではプレビュー固定表示）
- モバイル表示対応（Twitch アプリ内拡張表示を含む）

## ディレクトリ
```text
emote-deck/
├─ src/
│  └─ extension/
│     ├─ panel.html
│     ├─ panel.css
│     ├─ panel.js
│     ├─ config.html
│     ├─ config.css
│     ├─ config.js
│     └─ render.js
├─ dist/
│  └─ extension/
├─ build/
│  ├─ build.bat
│  └─ build.ps1
├─ docs/
│  ├─ architecture.md
│  └─ deployment.md
├─ assets/
├─ LICENSE
├─ README.md
├─ CHANGELOG.md
├─ .gitignore
├─ ARCHITECTURE.md
├─ AI_CONTRACT.md
└─ DECISIONS.md
```

## ZIP生成（Node 不使用）
1. プロジェクトルートで以下を実行
2. `EmoteDeck-extension.zip` を作成

```bat
build\build.bat
```

```powershell
.\build\build.ps1
```

## Twitch への提出手順（概要）
1. Developer Console で対象 Extension の `Versions` を開く
2. 新規バージョンを作成し `EmoteDeck-extension.zip` をアップロード
3. `Hosted Test` で Config / Panel / Mobile を確認
4. 問題なければ `Release`

## 設定保存について
- 設定は Twitch Extension Configuration（broadcaster）に保存されます。
- 同一 Extension ID のバージョン更新では、既存設定を引き継いで動作します（新規項目はデフォルト補完）。
