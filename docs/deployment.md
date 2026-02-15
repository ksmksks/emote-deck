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
4. `Hosted Test` で動作確認
5. 問題なければ `Release`

## 3. 動作確認チェック
- Panel で Emotes/Sub Badges/Bits Badges がタブ表示できる
- Config 変更がリアルタイムでプレビュー反映される
- Config 保存後に Panel へ反映される
- popout URL をスマホで開いて safe-area が崩れない
