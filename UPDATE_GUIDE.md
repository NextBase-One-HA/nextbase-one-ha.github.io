# GLB Webアプリ アップデートガイド

## 📋 概要

このガイドは、GLB Webアプリを安全にアップデートする方法を説明します。

**重要**: Webアプリは、ファイルを編集して`git push`するだけで自動的に反映されます。GitHub Pagesが自動的に更新をデプロイします。

---

## 🔄 アップデート方法（2つの方法）

### 方法1: 直接更新（簡単・推奨）

現在の方法。ファイルを編集して`git push`するだけ。

```bash
# 1. ファイルを編集
# apps/glb/index.html などを編集

# 2. 変更をコミット
git add .
git commit -m "アップデート内容の説明"

# 3. GitHubにプッシュ（自動的に反映される）
git push origin main
```

**反映時間**: 数秒〜数分（GitHub Pagesの自動デプロイ）

---

### 方法2: 陰で準備して一気に差し替え（安全）

大きな変更やテストしたい場合に推奨。

#### ステップ1: developブランチで作業

```bash
# developブランチに切り替え
git checkout develop

# ファイルを編集
# apps/glb/index.html などを編集

# 変更をコミット
git add .
git commit -m "アップデート内容の説明"

# developブランチにプッシュ（本番には反映されない）
git push origin develop
```

**この時点では本番（main）には反映されません**

#### ステップ2: 準備ができたら本番に反映

```bash
# mainブランチに切り替え
git checkout main

# developブランチの変更をマージ
git merge develop

# 本番にプッシュ（自動的に反映される）
git push origin main
```

**反映時間**: 数秒〜数分（GitHub Pagesの自動デプロイ）

---

## 💾 バックアップ方法

### 方法1: Gitタグでバージョン管理（推奨）

リリース時にタグを付けておくと、いつでもそのバージョンに戻せます。

```bash
# 現在のバージョンにタグを付ける
git tag v1.0.0 -m "GLB v1.0 正式リリース"
git push origin v1.0.0

# 特定のバージョンに戻す場合
git checkout v1.0.0
git checkout -b rollback-v1.0.0
git push origin rollback-v1.0.0
```

### 方法2: ローカルにバックアップコピー

```bash
# 現在のバージョンをバックアップフォルダにコピー
cp -r /Users/user/nextbase-one-ha.github.io /Users/user/nextbase-one-ha.github.io.backup-$(date +%Y%m%d)
```

### 方法3: GitHubのリリース機能

GitHubのリリース機能を使って、各バージョンのスナップショットを保存。

---

## 🔙 ロールバック方法（元に戻す）

### 方法1: Gitで前のバージョンに戻す

```bash
# 前のコミットを確認
git log --oneline -10

# 特定のコミットに戻す
git checkout <コミットハッシュ>
git checkout -b rollback-<日付>
git push origin rollback-<日付>

# mainブランチに反映
git checkout main
git merge rollback-<日付>
git push origin main
```

### 方法2: タグから復元

```bash
# タグ一覧を確認
git tag -l

# 特定のタグに戻す
git checkout v1.0.0
git checkout -b rollback-v1.0.0
git push origin rollback-v1.0.0

# mainブランチに反映
git checkout main
git merge rollback-v1.0.0
git push origin main
```

---

## 🛠️ 推奨ワークフロー

### 日常的な小さな更新

```bash
# 直接mainブランチで作業
git checkout main
# ファイル編集
git add .
git commit -m "小さな修正"
git push origin main
```

### 大きな機能追加・変更

```bash
# 1. developブランチで作業
git checkout develop
# ファイル編集
git add .
git commit -m "新機能追加"
git push origin develop

# 2. ローカルでテスト（必要に応じて）
# http://localhost:8000/apps/glb/ などで確認

# 3. 準備ができたら本番に反映
git checkout main
git merge develop
git push origin main

# 4. バージョンタグを付ける
git tag v1.1.0 -m "GLB v1.1 新機能追加"
git push origin v1.1.0
```

---

## 📁 ファイル構成

```
nextbase-one-ha.github.io/
├── index.html              # ランディングページ
├── apps/
│   └── glb/
│       └── index.html      # GLBアプリ本体（メイン）
├── dictionary/
│   └── 150k.csv           # 150k辞書データ
├── RELEASE_NOTES_v1.0.md  # リリースノート
├── GLB_REVENUE_READINESS.md
└── GLB_MARKET_STRATEGY.md
```

**重要なファイル**:
- `apps/glb/index.html`: GLBアプリ本体（ここを編集することが多い）
- `index.html`: ランディングページ
- `dictionary/150k.csv`: 辞書データ

---

## ⚠️ 注意事項

### 1. 本番反映のタイミング

- `git push origin main` を実行すると、**数秒〜数分で自動的に反映されます**
- 大きな変更の場合は、developブランチで準備してから反映することを推奨

### 2. バックアップの重要性

- 重要な変更の前には、必ずタグを付けておく
- ローカルにバックアップコピーを取ることも推奨

### 3. テストの重要性

- developブランチで作業して、ローカルでテストしてから本番に反映
- 特にJavaScriptの変更は、ブラウザのコンソールでエラーを確認

### 4. コミットメッセージ

- 変更内容を明確に記録する
- 例: `"カメラ翻訳機能のバグ修正"`、`"新機能: オフラインマップ連携追加"`

---

## 🚀 クイックリファレンス

### よく使うコマンド

```bash
# 現在のブランチ確認
git branch

# ブランチ切り替え
git checkout main        # 本番ブランチ
git checkout develop     # 開発ブランチ

# 変更を確認
git status
git diff

# 変更をコミット
git add .
git commit -m "変更内容"
git push origin <ブランチ名>

# バージョンタグを付ける
git tag v1.0.0 -m "説明"
git push origin v1.0.0

# タグ一覧
git tag -l

# 特定のタグに戻す
git checkout v1.0.0
```

---

## 📞 トラブルシューティング

### 問題: 変更が反映されない

```bash
# GitHub Pagesのデプロイ状況を確認
# GitHubリポジトリの「Actions」タブで確認

# キャッシュをクリア
# ブラウザのキャッシュをクリア（Cmd+Shift+R / Ctrl+Shift+R）
```

### 問題: 間違えて本番に反映してしまった

```bash
# 前のバージョンに戻す
git log --oneline -10  # 前のコミットを確認
git checkout <前のコミットハッシュ>
git checkout -b rollback
git push origin rollback
git checkout main
git merge rollback
git push origin main
```

### 問題: コンフリクト（競合）が発生した

```bash
# コンフリクトを解決
git status  # 競合ファイルを確認
# ファイルを編集して競合を解決
git add .
git commit -m "コンフリクト解決"
git push origin <ブランチ名>
```

---

## ✅ まとめ

### 簡単な更新
1. ファイル編集
2. `git add .`
3. `git commit -m "変更内容"`
4. `git push origin main`

### 安全な更新（大きな変更）
1. `git checkout develop`
2. ファイル編集・テスト
3. `git add .` → `git commit` → `git push origin develop`
4. 準備ができたら `git checkout main` → `git merge develop` → `git push origin main`

### バックアップ
- リリース時にタグを付ける: `git tag v1.0.0`
- ローカルにコピー: `cp -r ...`

**これで安全にアップデートできます！**
