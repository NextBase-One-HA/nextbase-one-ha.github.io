# 事務長ステラ 最終確認

## 確認手順（iPhoneで「STELLA ADMIN ACTIVE: v1.0.2603」を見る）

1. **Macでサーバー起動**
   ```bash
   cd "nextbase-one-ha.github.ioのコピー"
   npm install
   npx vite --host
   ```

2. **iPhoneを同じWi‑Fiに接続し、ブラウザで開く**
   - ターミナルに表示される `http://192.168.x.x:5173` をメモ
   - iPhoneのSafariで `http://192.168.x.x:5173` を開く

3. **GLBアプリへ**
   - トップで「LAUNCH APP」（または `http://192.168.x.x:5173/apps/glb/index.html`）を開く
   - オンボーディングをスキップしてメイン画面へ

4. **画面の一番下までスクロール**
   - 「API使用量管理」「NEゲートウェイ設定」の下に  
     **STELLA ADMIN ACTIVE: v1.0.2603** と表示されればOK。

---

## 次の一手（ステラ提案）

- **売上レポート機能** … 1.99ドル課金開始後の売上・プラン別集計
- **次のシリーズの弾丸** … GLBビジネス／GLB学習用の特化辞書を装填
