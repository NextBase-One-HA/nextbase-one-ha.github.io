# NEゲートウェイ接続状態チェック

## 🔍 現在の状態

**NEゲートウェイ: 未起動**

- ポート3000: 使用されていない
- プロセス: 実行中なし

---

## ✅ 接続確認方法

### 1. **GLBアプリ内から確認**

GLBアプリを開いて：
1. 開発者ツールを開く（F12 / Cmd+Option+I）
2. コンソールタブを開く
3. 以下を実行：

```javascript
// APIキーの確認
localStorage.getItem('NB_GATE_NOIR')

// 接続テスト
testGatewayConnection()
```

### 2. **ターミナルから確認**

```bash
# ポート3000が使用されているか確認
lsof -i :3000

# NEゲートウェイプロセスが動いているか確認
ps aux | grep -i "node.*gateway\|ne_gateway" | grep -v grep

# 直接接続テスト
curl -X POST http://127.0.0.1:3000 \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: YOUR_NB_GATE_NOIR_KEY" \
  -H "X-Caller-ID: noir" \
  -d '{"prompt":"test","mode":"low_cost_0.08","from":"ja","to":"en"}'
```

---

## 🚀 NEゲートウェイ起動手順

### 前提条件
- Node.jsがインストールされている
- `momoriri`フォルダにNEゲートウェイファイルがある
- `.env`ファイルに`NB_GATE_NOIR`キーが設定されている

### 起動コマンド

```bash
# 1. momoririフォルダに移動
cd ~/momoriri

# 2. 依存関係をインストール（初回のみ）
npm install

# 3. NEゲートウェイを起動
node ne_gateway.js
```

### 起動確認

起動が成功すると：
```
NE Gateway v2.6 起動中...
ポート: 3000
Caller ID: noir, admin, dev, prod
```

---

## ⚠️ よくある問題

### 1. **ポート3000が既に使用されている**
```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 [PID]
```

### 2. **APIキーが設定されていない**
```bash
# .envファイルを確認
cat ~/momoriri/.env | grep NB_GATE_NOIR
```

### 3. **Node.jsがインストールされていない**
```bash
# Node.jsのバージョン確認
node --version

# インストールされていない場合
# Homebrewでインストール
brew install node
```

---

## 📝 次のステップ

1. **NEゲートウェイを起動**
   ```bash
   cd ~/momoriri && node ne_gateway.js
   ```

2. **GLBアプリで接続テスト**
   - ブラウザで `https://nextbase-one-ha.github.io/apps/glb/` を開く
   - 開発者ツール → コンソール
   - `testGatewayConnection()` を実行

3. **接続成功を確認**
   - アラートで「接続に成功しました！」と表示される
   - コンソールに `[接続テスト] 成功` と表示される

---

**最終更新**: 2024年（GLB Travel v1.0）
