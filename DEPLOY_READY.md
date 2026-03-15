# 実務執行モード — 実行報告

## ✅ 完了した作業

1. **apps/glb/index.html の書き換え**
   - ステラ提示の緊急・生活動線版に差し替え済み。
   - 150k辞書検索（STELLA_BUS）、Stripe BASIC/TRAVELER ボタン、法的書類リンク（Privacy / Terms / Legal / Support）を実装。

2. **辞書パス**
   - 固定: `../../dictionary/150k.csv`
   - `apps/glb/index.html` から見て `GLB_FINAL/dictionary/150k.csv` を参照（15万語ロード可能）。

3. **フッターリンク検証**
   - `../../privacy.html` → GLB_FINAL/privacy.html ✓
   - `../../terms.html` → GLB_FINAL/terms.html ✓
   - `../../legal.html` → GLB_FINAL/legal.html ✓
   - `../../support.html` → GLB_FINAL/support.html ✓  
   上記4ファイルはルートに存在し、相対パスで正しく繋がる。

---

## ⚠️ 親方による手動実行が必要な作業

**Mac で Xcode ライセンス未同意のため、この環境からは git / Vercel を実行できません。**

ターミナルで以下を順に実行してください。

```bash
# 1. Xcode ライセンスに同意（初回のみ・要 sudo）
sudo xcodebuild -license accept

# 2. GLB_FINAL でコミット & プッシュ（リモート設定済みの場合）
cd /Users/user/Desktop/GLB_FINAL
git add apps/glb/index.html
git commit -m "glb: 緊急・生活動線版 — 150k辞書検索・Stripe・法的リンク"
git push

# 3. Vercel デプロイ（CLI 利用時）
vercel --prod
# または GitHub 連携済みなら push で自動デプロイ
```

---

## 📱 デプロイ後のURL（親方の最終確認用）

**※ Vercel デプロイ完了後、ここに本番URLを記入してください。**

- **GLB アプリ（150k検索）**: `https://_______________.vercel.app/apps/glb/`
- （またはプロジェクトの本番ドメイン）

---

親方の iPhone Safari での最終確認を待つ。
