# ARCHITECTURE

## エクステンション構成
EmoteDeck は Twitch Panel Extension 向けの完全フロントエンド実装です。

- `src/extension/panel.*`: 視聴者向けパネル表示
- `src/extension/config.*`: 配信者向け設定画面
- `src/extension/render.js`: 共通レンダリング処理
- `build/build.bat`, `build/build.ps1`: ZIP 生成

## データフロー
1. `Twitch.ext.onAuthorized` で `auth.helixToken` / `auth.clientId` / `auth.channelId` を取得
2. Helix API を Extension JWT で呼び出し
   - `GET /helix/chat/emotes?broadcaster_id={channelId}`
   - `GET /helix/chat/badges?broadcaster_id={channelId}`
3. API レスポンスを UI モデルへ正規化
4. `render(container, data, config)` で描画
5. Config 保存は `Twitch.ext.configuration.set`、Panel 反映は `onChanged`

## レンダリング設計
- 画面描画は `src/extension/render.js` に集約
- タブUIでカテゴリ同時表示を禁止
  - Emotes
  - Subscriber Badges
  - Bits Badges
- セクション縦制御を標準適用
  - `.section { max-height: 800px; overflow-y: auto; }`

## テーマ設計
テーマは CSS 変数で制御し、JS から `setProperty` で更新します。

- `--primary`
- `--accent`
- `--background`
- `--radius`
- `--glow`

## モバイル対応
- `panel.html` に viewport 指定を必須化
  - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `padding-bottom: env(safe-area-inset-bottom);` で safe-area 対応
- 固定幅を避け、レスポンシブグリッドを採用
  - `grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));`

## ZIP生成フロー
1. `dist` を削除
2. `dist/extension` を再生成
3. `src/extension` をコピー
4. `EmoteDeck-extension.zip` を生成

実装は Windows 標準の `Compress-Archive` のみを使用します。
