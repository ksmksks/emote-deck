# EmoteDeck Architecture

## コンポーネント
- `src/extension/panel.html` / `src/extension/panel.css` / `src/extension/panel.js`
- `src/extension/config.html` / `src/extension/config.css` / `src/extension/config.js`
- `src/extension/render.js`（共通レンダラー）

## API連携
- Emotes API  
  `GET /helix/chat/emotes?broadcaster_id={channelId}`
- Badges API  
  `GET /helix/chat/badges?broadcaster_id={channelId}`
- 認証ヘッダー
  - `Client-ID: auth.clientId`
  - `Authorization: Extension {auth.helixToken}`

## UI方針
- タブ UI でカテゴリは同時表示しない
- セクションは縦スクロール制御
  - `.section { max-height: 800px; overflow-y: auto; }`
- テーマは CSS 変数で管理
  - `--primary`
  - `--accent`
  - `--background`
  - `--radius`
  - `--glow`

## レスポンシブ方針
- `viewport-fit=cover` を使用
- `padding-bottom: env(safe-area-inset-bottom);` を使用
- 固定幅は使わない
- グリッドは `repeat(auto-fill, minmax(72px, 1fr))`
