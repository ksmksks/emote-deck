# EmoteDeck

EmoteDeck は Twitch Panel Extension 用の完全フロントエンド実装です。  
サーバー、Node.js、npm、外部フレームワークを使わずに、Helix API と Extension JWT 認証のみでエモート/バッジ表示を行います。

## 機能一覧
- サブスクエモート表示（Tier 1000 / 2000 / 3000）
- サブスクバッジ表示
- ビッツバッジ表示
- Config で ON/OFF 切替
- Config で色・角丸・グロー・サイズなどを調整
- Config のリアルタイムプレビュー
- タブUI（カテゴリ同時表示なし）
- モバイル最適化（safe-area / viewport-fit=cover）
- 縦サイズ制御（`max-height + overflow`）

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
├─ LICENSE
├─ README.md
├─ CHANGELOG.md
├─ .gitignore
├─ ARCHITECTURE.md
├─ AI_CONTRACT.md
└─ DECISIONS.md
```

## ZIP生成方法（Node 不使用）
1. PowerShell でプロジェクトルートへ移動
2. `build\build.bat` を実行
3. ルートに `EmoteDeck-extension.zip` が生成される

PowerShell 版:
```powershell
.\build\build.ps1
```

## Twitch Developer Console 提出手順
1. Twitch Developer Console で対象 Extension を開く
2. `Versions` から新規バージョンを作成
3. `EmoteDeck-extension.zip` をアップロード
4. `Hosted Test` で Panel/Config を確認
5. 問題なければ `Release` に進む

## popout をスマホで使う手順
1. Extension の popout URL を取得
2. スマホブラウザで URL を開く
3. 画面下の safe-area を含めて最適表示されることを確認
4. Config 変更後、再読み込みで反映を確認
