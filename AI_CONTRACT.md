# AI_CONTRACT

## 1. AI制約
- Node.js / npm / package manager を使用しない
- サーバーコードを追加しない
- 外部ライブラリや CDN フレームワークを導入しない
- Twitch Extension Helper と Helix API のみ使用する

## 2. レンダリング統一ルール
- 画面描画は `src/extension/render.js` に統一
- `render(container, data, config)` を Panel / Config から共通利用
- タブUIを維持し、カテゴリ同時表示を禁止

## 3. Configルール
- 設定値は Twitch `configuration` API で保存
- 変更はリアルタイムでプレビュー反映
- `showEmotes` / `showSubBadges` / `showBitsBadges` を必須保持
- テーマは CSS 変数を JS から更新する

## 4. テーマ変数
以下の変数を常に使用する:

- `--primary`
- `--accent`
- `--background`
- `--radius`
- `--glow`

## 5. モバイル・縦制御ルール
- `viewport-fit=cover` を必ず使用
- `padding-bottom: env(safe-area-inset-bottom);` を使用
- `.section { max-height: 800px; overflow-y: auto; }` を維持
- 固定幅は禁止し、レスポンシブレイアウトで実装

## 6. 禁止事項
- React / Vue / Angular / Svelte の導入
- Node.js ベースのビルド依存追加
- カテゴリ同時描画への変更
- テーマ変数を経由しない直接色固定
