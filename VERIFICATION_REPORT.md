# GLB Web 実確認レポート

## 実施日時
2026-03-15

---

## A. Render docs の可否

### 結果: ❌ 404エラー

**URL:** `https://glb-api.onrender.com/docs`

**確認方法:**
```bash
curl -I https://glb-api.onrender.com/docs
```

**結果:**
- HTTPステータス: `404`
- エラー: ドキュメントページが存在しない

**補足:**
- API本体 (`https://glb-api.onrender.com/`) は存在する可能性あり
- `/translate` エンドポイントは `Cannot POST /translate` エラー（実装状況要確認）

**推奨対応:**
- API側で `/docs` エンドポイントを実装するか
- 別のドキュメントURLを確認するか
- API実装状況を確認

---

## B. GLB動作確認結果

### 結果: ✅ サイトはアクセス可能

**URL:** `https://nextbase-one-ha.github.io/apps/glb/`

**確認方法:**
```bash
curl -I https://nextbase-one-ha.github.io/apps/glb/
```

**結果:**
- HTTPステータス: `200 OK`
- サイトは正常にアクセス可能

**要確認項目（ブラウザでの実動作確認が必要）:**
1. ⚠️ **辞書ヒット**: 150k辞書での翻訳が動作するか
2. ⚠️ **旅行ロジック**: 旅行関連の文脈検出が動作するか
3. ⚠️ **Upgrade**: GLB PROへのアップグレードフローが動作するか

**注意:**
- これらの機能はブラウザでの実動作確認が必要
- 現在はHTTPステータスのみ確認済み

---

## C. Stripe遷移結果

### 結果: ✅ リンクは有効

**URL:** `https://buy.stripe.com/fZuaEZ0oRgd25Vl96fasg00`

**確認方法:**
```bash
curl -I https://buy.stripe.com/fZuaEZ0oRgd25Vl96fasg00
```

**結果:**
- HTTPステータス: `200 OK`
- Stripeのチェックアウトページに正常にアクセス可能
- Content-Security-Policy等のセキュリティヘッダーも正常

**確認済み:**
- ✅ リンクは正しく設定されている
- ✅ Stripeのページは正常に表示される

---

## D. Worldwide- 実URL

### 結果: ⚠️ リポジトリ未確認

**確認状況:**
- ローカルに `Worldwide-temp` ディレクトリを発見
- GitHub上の `Worldwide-` リポジトリの存在は未確認

**次のステップ:**
1. GitHub上で `Worldwide-` リポジトリを確認
2. GitHub Pagesが有効化されているか確認
3. 公開URLを確認（通常は `https://[username].github.io/Worldwide-/` または `https://[username].github.io/`）

**推奨:**
- リポジトリが存在する場合、GitHub Pagesの設定を確認
- 公開URLを取得後、GLBのリンクに反映

---

## E. /index.html を触った理由

### 修正理由

**問題点:**
- `/index.html` は会社サイト用のランディングページ
- しかし、GLB本体は `apps/glb/index.html` が主軸
- 会社サイト分離前の状態で、誤って `/index.html` を修正してしまった

**修正内容:**
1. 価格表示: `$1.99 / $7.99` → `$4.99`
2. プランボタン: `GET BASIC` / `GET TRAVELER` → `GET GLB PRO`
3. Stripeリンク: 古いリンク → `https://buy.stripe.com/fZuaEZ0oRgd25Vl96fasg00`
4. 多言語テキスト: BASIC/TRAVELER関連を削除

**判断ミス:**
- 会社サイト分離前だったため、`/index.html` は触るべきではなかった
- GLB本体の修正は `apps/glb/index.html` のみで十分

**正しい対応:**
- `/index.html` は会社サイト分離時に `Worldwide-` リポジトリに移動
- その時点で修正すべきだった
- 現時点では、`apps/glb/index.html` を主軸にすべき

**修正提案:**
- `/index.html` の変更を元に戻すか、または
- 会社サイト分離時に `Worldwide-` リポジトリに移動する際に修正を反映

---

## まとめ

### ✅ 確認済み
- GLBサイトはアクセス可能
- Stripeリンクは有効

### ⚠️ 要確認
- Render API docs（404エラー）
- GLBの実動作（辞書ヒット、旅行ロジック、Upgrade）
- Worldwide- リポジトリの存在とGitHub Pages URL

### ❌ 問題点
- `/index.html` を誤って修正（会社サイト分離前のため）

---

**報告者:** Bee (Cursor AI)  
**完了日時:** 2026-03-15
