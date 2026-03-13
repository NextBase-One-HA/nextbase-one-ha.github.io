# GLB 自動生成マシン設計書

## 🎯 コンセプト

**「ユーザーが今何をしているか」を検知して、そのシーンに応じた「旅行あるある文章」を自動生成**

---

## 📁 フォルダ構造（シーン別）

### 1. **ホテル（hotel）**
- チェックイン/アウト
- 部屋のトラブル
- 設備の使い方
- サービス依頼
- 予約確認

### 2. **地下鉄・交通（transport）**
- 切符の買い方
- 乗り換え
- 路線の確認
- 遅延・混雑
- 降りる駅の確認

### 3. **買い物（shopping）**
- 値段交渉
- サイズ確認
- 返品・交換
- 免税手続き
- 支払い方法

### 4. **食事（dining）**
- メニューの読み方
- 注文
- アレルギー対応
- 会計
- チップ

### 5. **その他（general）**
- 道を聞く
- 緊急時
- 観光案内
- 文化・マナー

---

## 🔄 処理フロー

```
ユーザー入力
    ↓
[1] シーン検出（_cx1, _dt1 を拡張）
    ├─ ホテル → hotel
    ├─ 地下鉄・交通 → transport
    ├─ 買い物 → shopping
    ├─ 食事 → dining
    └─ その他 → general
    ↓
[2] NE Gateway API呼び出し
    POST /api/generate/phrase
    {
      scene: "hotel",
      userInput: "チェックインしたい",
      fromLang: "ja",
      toLang: "en",
      context: { ... }
    }
    ↓
[3] バックエンド自動生成エンジン（Mac側）
    ├─ シーン別テンプレート読み込み
    ├─ ユーザー入力から文脈抽出
    ├─ Gemini 1.5 Flashで文章生成
    └─ 複数候補生成（3-5個）
    ↓
[4] レスポンス
    {
      phrases: [
        { text: "I'd like to check in.", context: "check-in" },
        { text: "I have a reservation.", context: "reservation" },
        ...
      ],
      scene: "hotel",
      suggestions: [...]
    }
    ↓
[5] Webアプリ側で表示
    ├─ 生成された文章を表示
    ├─ タップでコピー
    └─ 翻訳結果として保存
```

---

## 🛠️ 実装設計

### **NE Gateway側（Mac / バックエンド）**

#### エンドポイント: `POST /api/generate/phrase`

```javascript
// ne_gateway.js (Mac側)
app.post('/api/generate/phrase', async (req, res) => {
  const { scene, userInput, fromLang, toLang, context } = req.body;
  
  // シーン別テンプレート読み込み
  const templates = loadSceneTemplates(scene);
  
  // ユーザー入力から文脈抽出
  const extractedContext = extractContext(userInput, scene);
  
  // Gemini 1.5 Flashで文章生成
  const generatedPhrases = await generatePhrases({
    scene,
    templates,
    context: extractedContext,
    fromLang,
    toLang,
    userInput
  });
  
  res.json({
    phrases: generatedPhrases,
    scene,
    suggestions: getSuggestions(scene)
  });
});
```

#### シーン別テンプレート構造

```javascript
// templates/hotel.json
{
  "check-in": {
    "patterns": [
      "I'd like to check in.",
      "I have a reservation under [name].",
      "Can I check in now?"
    ],
    "contexts": ["reservation", "name", "time"],
    "variations": 5
  },
  "room-issue": {
    "patterns": [
      "The [item] in my room is not working.",
      "I'd like to change rooms.",
      "Can you fix the [item]?"
    ],
    "contexts": ["item", "problem"],
    "variations": 5
  },
  ...
}

// templates/transport.json
{
  "ticket": {
    "patterns": [
      "How do I buy a ticket?",
      "One ticket to [destination], please.",
      "What's the fare to [destination]?"
    ],
    "contexts": ["destination", "fare"],
    "variations": 5
  },
  ...
}
```

#### 自動生成エンジン

```javascript
// generators/phrase_generator.js
async function generatePhrases({ scene, templates, context, fromLang, toLang, userInput }) {
  // 1. テンプレートからベース文章を選択
  const basePhrases = selectBasePhrases(templates, context);
  
  // 2. Gemini 1.5 Flashでバリエーション生成
  const prompt = `
You are a travel phrase generator for GLB Travel app.
Scene: ${scene}
User input: ${userInput}
Context: ${JSON.stringify(context)}

Generate 5 natural, practical travel phrases in ${toLang} based on the scene and context.
Each phrase should be:
- Natural and conversational
- Culturally appropriate
- Practical for travelers
- Short and easy to say

Base phrases to work from:
${basePhrases.map(p => `- ${p}`).join('\n')}

Generate 5 variations:
  `;
  
  const response = await callGemini(prompt);
  const phrases = parsePhrases(response);
  
  return phrases.map((text, index) => ({
    text,
    context: context.type || scene,
    confidence: 0.8 - (index * 0.1), // 最初の方が高信頼度
    source: "auto_generated"
  }));
}
```

---

### **Webアプリ側（フロントエンド）**

#### シーン検出の拡張

```javascript
// apps/glb/index.html
function detectSceneEnhanced(userInput) {
  const lower = userInput.toLowerCase();
  
  // ホテル
  if (/(ホテル|hotel|チェックイン|check-in|部屋|room|予約|reservation)/i.test(lower)) {
    return { scene: 'hotel', confidence: 0.9 };
  }
  
  // 地下鉄・交通
  if (/(地下鉄|subway|電車|train|切符|ticket|乗り換え|transfer|駅|station)/i.test(lower)) {
    return { scene: 'transport', confidence: 0.9 };
  }
  
  // 買い物
  if (/(買い物|shopping|店|shop|値段|price|サイズ|size|返品|return)/i.test(lower)) {
    return { scene: 'shopping', confidence: 0.9 };
  }
  
  // 食事
  if (/(レストラン|restaurant|食事|dining|メニュー|menu|注文|order|会計|bill)/i.test(lower)) {
    return { scene: 'dining', confidence: 0.9 };
  }
  
  return { scene: 'general', confidence: 0.5 };
}
```

#### 自動生成API呼び出し

```javascript
// apps/glb/index.html
async function generateTravelPhrases(userInput, fromLang, toLang) {
  // シーン検出
  const sceneInfo = detectSceneEnhanced(userInput);
  
  // NE Gateway API呼び出し
  const NE_GATEWAY_URL = "http://127.0.0.1:3000";
  const API_KEY = localStorage.getItem('NB_GATE_NOIR');
  
  try {
    const response = await fetch(`${NE_GATEWAY_URL}/api/generate/phrase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Caller-ID': 'noir',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        scene: sceneInfo.scene,
        userInput,
        fromLang,
        toLang,
        context: {
          detectedScene: sceneInfo.scene,
          confidence: sceneInfo.confidence,
          timestamp: Date.now()
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('API呼び出し失敗');
    }
    
    const data = await response.json();
    return data.phrases; // [{ text, context, confidence, source }]
    
  } catch (e) {
    console.warn('自動生成失敗:', e);
    return null;
  }
}
```

#### UI統合

```javascript
// apps/glb/index.html
async function handleSend() {
  const text = (inputEl.value || "").trim();
  if (!text) return;
  
  // ... 既存の翻訳処理 ...
  
  // 自動生成フレーズを取得
  const generatedPhrases = await generateTravelPhrases(text, currentFromLang, currentToLang);
  
  if (generatedPhrases && generatedPhrases.length > 0) {
    // 生成されたフレーズを表示
    displayGeneratedPhrases(generatedPhrases);
  }
}

function displayGeneratedPhrases(phrases) {
  const phrasesContainer = document.getElementById('generated-phrases');
  if (!phrasesContainer) {
    // コンテナがなければ作成
    const container = document.createElement('div');
    container.id = 'generated-phrases';
    container.style.cssText = 'margin-top:16px; padding:16px; background:var(--panel); border:1px solid var(--line); border-radius:12px;';
    answerEl.parentNode.insertBefore(container, answerEl.nextSibling);
  }
  
  let html = '<div style="font-size:14px; font-weight:700; margin-bottom:12px; color:var(--primary);">✨ 旅行あるあるフレーズ（自動生成）</div>';
  
  phrases.forEach((phrase, index) => {
    html += `
      <div style="padding:12px; margin-bottom:8px; background:var(--bg-secondary); border-radius:8px; cursor:pointer; transition:all 0.2s;" 
           onclick="copyPhrase('${phrase.text.replace(/'/g, "\\'")}')"
           onmouseover="this.style.background='var(--primary-light)'"
           onmouseout="this.style.background='var(--bg-secondary)'">
        <div style="font-size:16px; font-weight:500; margin-bottom:4px;">${phrase.text}</div>
        <div style="font-size:12px; color:var(--text-secondary);">${phrase.context}</div>
      </div>
    `;
  });
  
  phrasesContainer.innerHTML = html;
}

function copyPhrase(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`コピーしました: ${text}`);
  });
}
```

---

## 📂 Mac側ファイル構造

```
~/ne_gateway/
├── generators/
│   ├── phrase_generator.js      # メイン生成エンジン
│   ├── context_extractor.js     # 文脈抽出
│   └── template_loader.js       # テンプレート読み込み
├── templates/
│   ├── hotel.json               # ホテル用テンプレート
│   ├── transport.json           # 交通用テンプレート
│   ├── shopping.json            # 買い物用テンプレート
│   ├── dining.json              # 食事用テンプレート
│   └── general.json              # その他用テンプレート
├── ne_gateway.js                # メインサーバー（既存）
└── package.json
```

---

## 🎯 実装優先順位

### フェーズ1: 基本実装（今すぐ）
1. ✅ **NE Gateway側エンドポイント追加** (`/api/generate/phrase`)
2. ✅ **シーン検出の拡張** (`detectSceneEnhanced`)
3. ✅ **テンプレート構造の定義** (JSON形式)
4. ✅ **基本生成エンジン** (Gemini 1.5 Flash統合)

### フェーズ2: 強化（1週間以内）
5. ✅ **文脈抽出の精度向上**
6. ✅ **複数候補生成** (3-5個)
7. ✅ **UI統合** (生成フレーズ表示)

### フェーズ3: 最適化（2週間以内）
8. ✅ **キャッシュ機能** (同じシーン・文脈は再利用)
9. ✅ **学習機能** (ユーザーが選んだフレーズを優先)
10. ✅ **多言語対応** (25言語すべて)

---

## 💡 使用例

### 例1: ホテル
**ユーザー入力**: "チェックインしたい"
**検出**: `scene: "hotel"`
**生成フレーズ**:
- "I'd like to check in."
- "I have a reservation under [name]."
- "Can I check in now?"
- "I booked a room for tonight."
- "Check-in, please."

### 例2: 地下鉄
**ユーザー入力**: "切符の買い方教えて"
**検出**: `scene: "transport"`
**生成フレーズ**:
- "How do I buy a ticket?"
- "One ticket to [destination], please."
- "What's the fare to [destination]?"
- "Can you help me buy a ticket?"
- "Where can I buy a ticket?"

### 例3: 買い物
**ユーザー入力**: "サイズが合わない"
**検出**: `scene: "shopping"`
**生成フレーズ**:
- "This size doesn't fit."
- "Do you have a larger size?"
- "Can I exchange this for a different size?"
- "This is too small/big."
- "I need a different size."

---

## 🔒 セキュリティ・パフォーマンス

### API使用量管理
- 自動生成は**1回の翻訳につき1回のみ**
- キャッシュで重複生成を防止
- ユーザープランに応じた制限（無料版は制限あり）

### エラーハンドリング
- NE Gateway接続失敗時は**フォールバック**（既存の翻訳のみ）
- 生成失敗時は**エラーを表示せず、翻訳結果のみ表示**

---

## 📊 期待効果

### ユーザー体験
- ✅ **「あるある」フレーズが自動で表示** → 使いやすさ向上
- ✅ **シーンに応じた適切なフレーズ** → 実用性向上
- ✅ **複数候補から選択可能** → 柔軟性向上

### ビジネス効果
- ✅ **ユーザーリテンション向上** → 「GLBがないと困る」状態
- ✅ **シェア機能との相乗効果** → 「このフレーズ便利！」→ シェア
- ✅ **差別化要因** → 競合にはない機能

---

**最終更新**: 2024年（GLB Travel v1.0）
