# Deployment Guide

## 1. ZIP作成
### バッチ実行
```bat
build\build.bat
```

### PowerShell実行
```powershell
.\build\build.ps1
```

実行後、ルートに `EmoteDeck-extension.zip` が作成されます。

## 2. Twitch Developer Console への提出
1. 対象 Extension を開く
2. `Versions` で新規バージョン作成
3. `EmoteDeck-extension.zip` をアップロード
4. `Hosted Test` で Config / Panel / Mobile を確認
5. 問題なければ `Release`

## 3. 動作確認チェック
- `Stamps` タブで Follower / Tier 1 / Tier 2 / Tier 3 / Cheermotes が表示される
- `Badges` タブで Subscriber Badges / Bits Badges が表示される
- Visibility でカテゴリ・個別の ON/OFF が反映される
- ドラッグアンドドロップ並び替えが反映される
- Hover Tooltip とクリックコピーが動作する
- Config 変更がリアルタイムでプレビューに反映される
- Config 保存後に Panel / Mobile 表示へ反映される
- モバイル表示でレイアウト崩れや不自然な余白がない
