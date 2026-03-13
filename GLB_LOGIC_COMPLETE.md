# GLB Travel v1.0 - 全ロジック仕様書

## 📋 目次

1. [翻訳エンジンロジック](#翻訳エンジンロジック)
2. [API削減ロジック](#api削減ロジック)
3. [旅行トラブル検出ロジック](#旅行トラブル検出ロジック)
4. [文脈理解ロジック](#文脈理解ロジック)
5. [データ管理ロジック](#データ管理ロジック)
6. [パフォーマンス最適化ロジック](#パフォーマンス最適化ロジック)
7. [モネタイゼーションロジック](#モネタイゼーションロジック)
8. [UI/UXロジック](#uiuxロジック)

---

## 🔄 翻訳エンジンロジック

### 1. **3段階翻訳システム（優先順位順）**

#### 処理フロー
```
ユーザー入力
    ↓
[1] 150k辞書検索 (searchDict)
    ├─ 見つかった → 結果返却（最速）
    └─ 見つからない ↓
[2] オンデバイス辞書検索 (userDict)
    ├─ 見つかった → 結果返却
    └─ 見つからない ↓
[3] API翻訳 (translateWithGemini)
    ├─ キャッシュチェック (getCachedResult)
    ├─ API呼び出し許可チェック (checkAPICallAllowed)
    ├─ NE Gateway接続
    └─ 結果をユーザー辞書に保存 (saveToUserDict)
```

#### 実装詳細

**`searchDict(query, fromLang, toLang)`**
- **入力**: クエリ文字列、ソース言語、ターゲット言語
- **処理**:
  1. クエリを正規化（`trim().toLowerCase()`）
  2. キー生成: `${fromLang}-${toLang}:${normalized}`
  3. 優先順位で検索:
     - `dictIndex.has(key)` → 150k辞書
     - `userDict.has(key)` → ユーザー辞書
     - `fallbackDict.has(fallbackKey)` → フォールバック
- **出力**: `{ result: string, source: "150k_dict" | "user_dict" | "fallback" }` または `null`

**`translate(text, fromLang, toLang, updateStatus)`**
- **無料版制限**:
  - 150k辞書のみ使用（API不可）
  - 5回/月の制限（`FREE_LIMIT.translations`）
  - 上限到達時はアップグレード誘導
- **会話モード**:
  - `conversationContext`配列に文脈を保持（最大10件）
  - 前3件の会話をプロンプトに追加
- **ステータス更新**:
  - "15万語アセットを確認しています..."
  - "オンデバイス辞書を確認しています..."
  - "探しています..."
  - "NEゲートウェイに接続中..."
  - "GLBしています..."

**`translateWithGemini(text, fromLang, toLang, updateStatus)`**
- **NE Gateway接続**:
  - URL: `http://127.0.0.1:3000` (Mac側ローカル)
  - ヘッダー: `X-Caller-ID: noir`
  - APIキー: `localStorage.getItem('NB_GATE_NOIR')`
- **辞書コンテキスト生成**:
  - 入力テキストを単語分割
  - 最大5エントリに制限（パフォーマンス向上）
  - 150k辞書から関連エントリを検索
  - プロンプトに辞書コンテキストを追加
- **会話コンテキスト**:
  - `conversationContext`から前3件を取得
  - プロンプトに追加
- **エラーハンドリング**:
  - APIキー未設定 → "API未設定 - NB_GATE_NOIRキーを設定してください"
  - クォータ超過 → アップグレード誘導
  - ネットワークエラー → フォールバックメッセージ

---

## ⚡ API削減ロジック

### 2. **クライアント側軽量版API削減**

#### 実装詳細

**`checkAPICallAllowed(purpose = "prod_user_request")`**
- **クールダウン**:
  - 前回のAPI呼び出しから5秒以内は拒否
  - `apiCooldown` Mapで管理
  - キー: `${callerId}_${purpose}`
- **レート制限**:
  - 1時間あたり60回まで
  - `apiCallHistory`配列でタイムスタンプ管理
  - 1時間以上前の記録は自動削除
- **出力**: `{ allowed: boolean, reason?: string, useCache?: boolean }`

**`recordAPICall(purpose = "prod_user_request")`**
- クールダウン記録: `apiCooldown.set(cacheKey, now)`
- レート制限記録: `apiCallHistory.push(now)`
- 古い記録の削除: 1時間以上前をフィルタ

**`getCachedResult(inputHash)`**
- **L1: Exact Cache**:
  - `apiCallCache` Map（最大50件）
  - 完全一致のみ
  - 最優先でチェック
- **L2: LRU Cache**:
  - `apiCallCacheL2` Map（最大100件）
  - `apiCallCacheL2Keys`配列でLRU管理
  - 使用されたキーを最後に移動
- **出力**: キャッシュされた結果または `null`

**`setCachedResult(inputHash, result)`**
- **L1更新**:
  - 50件超過時は最初のキーを削除（FIFO）
- **L2更新**:
  - 100件超過時は最古のキーを削除（LRU）
  - 使用されたキーを最後に移動

---

## 🛡️ 旅行トラブル検出ロジック

### 3. **自動トラブル検出システム**

#### 実装詳細

**`_dt1(text)` - トラブル検出（BLACKBOX）**
- **医療緊急事態** (priority: "critical"):
  - パターン: `/(痛い|苦しい|吐き気|熱|倒れた|血|怪我|死ぬ|死にそう|助けて|pain|sick|hurt|fever|injury|blood|dying|help)/i`
  - アクション: "医療緊急対応"
  - 表示時間: 10秒（最優先）
- **食事アレルギー** (priority: "critical"):
  - パターン: `/(アレルギー|アナフィラキシー|allergy|anaphylaxis|食べられない|ダメ)/i`
  - アクション: "食事アレルギー対応"
  - 表示時間: 10秒（最優先）
- **法的問題** (priority: "high"):
  - パターン: `/(警察|盗まれた|盗難|紛失|パスポート|police|stolen|theft|lost|passport)/i`
  - アクション: "法的問題対応"
  - 表示時間: 5秒
- **ホテルトラブル** (priority: "medium"):
  - パターン1: `/(ホテル|予約|部屋|チェックイン|hotel|reservation|room|check-in)/i`
  - パターン2: `/(最悪|ひどい|詐欺|違う|間違|問題|worst|terrible|fraud|wrong|problem)/i`
  - 両方マッチで検出
- **空港トラブル** (priority: "medium"):
  - パターン1: `/(空港|飛行機|荷物|バゲージ|airport|flight|baggage|luggage)/i`
  - パターン2: `/(どうすれば|どうしよう|困った|やばい|遅延|what|how|delay|late)/i`
- **買い物トラブル** (priority: "medium"):
  - パターン1: `/(ショップ|店|買い物|shop|store|shopping)/i`
  - パターン2: `/(最悪|ひどい|詐欺|返せ|返金|worst|terrible|fraud|refund)/i`
- **食事トラブル** (priority: "medium"):
  - パターン1: `/(レストラン|食事|注文|restaurant|dining|order)/i`
  - パターン2: `/(頼んでない|違う|間違|来てない|まだ|wrong|different|not yet)/i`
- **交通トラブル** (priority: "medium"):
  - パターン1: `/(タクシー|バス|電車|交通|taxi|bus|train|transport)/i`
  - パターン2: `/(遅延|遅れ|高すぎ|delay|late|too expensive|overcharge)/i`

**`_ed1(text)` - 感情デコード（BLACKBOX）**
- **医療パニックマップ**:
  - `死ぬ|死にそう` → `重篤な症状を訴える`
  - `やばい` → `緊急の医療対応が必要`
  - `パニック` → `強い不安を感じている`
  - `無理` → `限界を感じている`
  - `助けて` → `緊急の支援を必要としている`
- **一般感情マップ**:
  - `金返せ` → `返金を要求する`
  - `詐欺` → `掲載内容との不一致を報告する`
  - `最悪|ひどい` → `状況が許容範囲を超えている`
  - `許せない` → `適切な対応を求める`
- **処理**: 正規表現でパターンマッチング、置換

**`detectVagueExpressions(text)` - 曖昧表現検出**
- **時間の曖昧さ**:
  - パターン: `/(あとで|そのうち|いつか|適当に|later|sometime|eventually)/i`
  - 質問: "具体的な日時を教えてください。"
- **場所の曖昧さ**:
  - パターン: `/(あっち|そっち|あそこ|ここら辺|近く|over there|around here|nearby)/i`
  - 質問: "場所の基準が必要です（住所・駅名・ランドマーク等）。"
- **金額の曖昧さ**:
  - パターン: `/(?<![\d:])(\d{3,})(?![\d:号室])/i` かつ `!/(円|ドル|ユーロ|USD|JPY|EUR)/i`
  - 質問: "通貨単位を教えてください（円・ドル・ユーロ等）。"
- **出力**: `{ vague: { time, location, amount }, questions: string[] }`

**`generateDetailedQuestions(troubleType, text)`**
- **医療緊急事態**:
  - 質問: "具体的な症状（部位、いつから発症したか、痛みのレベル1〜10）を特定してください。"
  - 質問: "現在服用中の薬、または既存のアレルギー（薬効・食物）はありますか？"
  - 証拠: "海外旅行保険証 / お薬手帳の提示"
- **食事アレルギー**:
  - 質問: "これは命に関わる『アレルギー』ですか？それとも『嗜好（好き嫌い）』ですか？"
  - 質問: "予算、肉/魚の希望、または避けるべき食材を指定してください。"
- **法的問題**:
  - 質問: "警察署で被害届を提出しましたか？事件番号を記録してください。"
  - 質問: "日本大使館・領事館の連絡先を確認していますか？"
  - 証拠: "警察の被害届受理証明 / 事件番号", "パスポートのコピー / 顔写真"
- **出力**: `{ questions: string[], evidence: string[] }`

---

## 🌍 文脈理解ロジック

### 4. **コンテキスト理解型アシスタント**

#### 実装詳細

**`_cx1(userInput)` - 文脈検出（BLACKBOX）**
- **時差関連**:
  - パターン: `/(時差|時間|何時|timezone|time|jet lag|時差ボケ)/i`
  - タイプ: `'timezone'`, 優先度: `'medium'`
- **チップ関連**:
  - パターン: `/(チップ|tip|サービス料|いくら|いくら払う|支払い|料金)/i`
  - タイプ: `'tip'`, 優先度: `'medium'`
- **電圧・プラグ関連**:
  - パターン: `/(充電|コンセント|プラグ|電圧|変圧器|adapter|voltage|charge)/i`
  - タイプ: `'voltage'`, 優先度: `'low'`
- **文化・マナー関連**:
  - パターン: `/(マナー|タブー|してはいけない|文化|習慣|custom|manners|taboo)/i`
  - タイプ: `'culture'`, 優先度: `'medium'`
- **出力**: `{ type: string, priority: string, needsInfo: boolean }` または `null`

**`_cx2(userInput, countryCode)` - タイムゾーン情報（BLACKBOX）**
- **タイムゾーンデータ**:
  ```javascript
  {
    'US': { offset: -5, name: 'EST (UTC-5)', jetLag: '時差ボケ注意（6-9時間差）' },
    'UK': { offset: 0, name: 'GMT (UTC+0)', jetLag: '時差ボケ軽微（9時間差）' },
    'JP': { offset: 9, name: 'JST (UTC+9)', jetLag: '時差なし' },
    // ... その他
  }
  ```
- **時差計算**:
  - ローカルオフセット: `new Date().getTimezoneOffset() / -60`
  - ターゲットオフセット: `timezones[countryCode].offset`
  - 時差: `diff = target.offset - localOffset`
  - ターゲット時刻: `new Date(localTime.getTime() + diff * 60 * 60 * 1000)`
- **文脈理解**:
  - "明日会議" → 時差警告 + 会議時刻の確認
  - "時差ボケ" → 時差ボケアドバイス
- **出力**: タイムゾーン情報 + 文脈に応じた提案

**`_cx3(userInput, amount, countryCode, serviceType)` - チップ計算（BLACKBOX）**
- **チップ率データ**:
  ```javascript
  {
    'US': { restaurant: 0.15, hotel: 2, taxi: 0.15, min: 1 },
    'CA': { restaurant: 0.15, hotel: 2, taxi: 0.15, min: 1 },
    'JP': { restaurant: 0, hotel: 0, taxi: 0, min: 0 }, // チップ不要
    // ... その他
  }
  ```
- **文脈理解**:
  - "サービスが悪い" → チップ率を下げる（例: 10%）
  - "サービスが良い" → チップ率を上げる（例: 20%）
  - "チップ不要" → 0（日本など）
- **計算ロジック**:
  - 基本チップ: `amount * tipRates[countryCode][serviceType]`
  - 文脈調整: サービス満足度に応じて±5%
  - 最小値: `tipRates[countryCode].min`
- **出力**: チップ額 + 文脈に応じた説明

**`_cx4(userInput, countryCode)` - 電圧・プラグ情報（BLACKBOX）**
- **電圧データ**:
  ```javascript
  {
    'US': { voltage: 120, plug: 'A', frequency: 60 },
    'UK': { voltage: 230, plug: 'G', frequency: 50 },
    'JP': { voltage: 100, plug: 'A', frequency: 50 },
    // ... その他
  }
  ```
- **文脈理解**:
  - "充電できない" → 電圧・プラグの不一致を警告
  - "変圧器必要" → 変圧器の推奨
- **出力**: 電圧・プラグ情報 + 文脈に応じた警告

**`_cx5(userInput, countryCode)` - 文化・マナー情報（BLACKBOX）**
- **文化データ**:
  - タブーリスト（国別）
  - マナーチップ（国別）
  - 習慣情報（国別）
- **文脈理解**:
  - 翻訳内容から関連する文化情報を抽出
  - 特定の行動に対する警告を表示
- **出力**: 文化・マナー情報 + 文脈に応じた警告

---

## 💾 データ管理ロジック

### 5. **GLBシリーズ標準データ構造**

#### 実装詳細

**`initializeEmptyDict()`**
- **データ構造**:
  ```javascript
  {
    version: "1.0",
    user_dict: [],
    history: [],
    metadata: {
      created: "ISO日時",
      app: "GLB Travel",
      last_updated: "ISO日時"
    }
  }
  ```
- **保存先**: `localStorage.getItem('glb_series_data')`

**`saveGLBSeriesData()`**
- **処理**:
  1. `userDict` Mapを配列に変換
  2. `history`配列を取得
  3. メタデータを更新
  4. JSON文字列化して`localStorage`に保存
- **キー**: `'glb_series_data'`

**`loadGLBSeriesData()`**
- **処理**:
  1. `localStorage`から`'glb_series_data'`を取得
  2. JSON解析
  3. `userDict` Mapを復元
  4. `history`配列を復元
  5. メタデータを確認

**`saveToUserDict(source, target, fromLang, toLang)`**
- **キー生成**: `${fromLang}-${toLang}:${source.trim().toLowerCase()}`
- **保存**: `userDict.set(key, target.trim())`
- **永続化**: `saveGLBSeriesData()`を呼び出し

**翻訳メモリ (`translationMemory`)**
- **データ構造**: `Map<sourceKey, { targetValue, timestamp }>`
- **最大件数**: 100件（超過時は最古を削除）
- **保存先**: `localStorage.getItem('glb_translation_memory')`
- **`addToTranslationMemory(sourceKey, targetValue)`**:
  - メモリに追加
  - 100件超過時は最古を削除（タイムスタンプでソート）
  - `localStorage`に保存
- **`getFromTranslationMemory(sourceKey)`**:
  - 小文字化して検索
  - 見つかったら返却、なければ`undefined`

**履歴管理 (`history`)**
- **データ構造**: `Array<{ source, target, fromLang, toLang, timestamp }>`
- **最大件数**: 1000件（最新100件を保持）
- **保存先**: `localStorage.getItem('glb_history')`
- **`saveHistory(source, target, fromLang, toLang)`**:
  - 履歴配列の先頭に追加（`unshift`）
  - 1000件超過時は末尾を削除（`pop`）
  - `localStorage`に保存

**エクスポート/インポート**
- **`exportTranslationData()`**:
  - 翻訳メモリ、ユーザー辞書、履歴を統合
  - JSON形式でダウンロード
  - ファイル名: `glb_translation_data_YYYY-MM-DD.json`
- **`importTranslationData(file)`**:
  - FileReaderで読み込み
  - JSON解析
  - データ構造検証
  - `userDict`, `history`, `translationMemory`を復元
  - `localStorage`に保存

---

## ⚡ パフォーマンス最適化ロジック

### 6. **辞書読み込み最適化**

#### 実装詳細

**`load150kDict()`**
- **ストリーミング読み込み**:
  - `fetch().body.getReader()`でストリーム取得
  - `TextDecoder`でデコード
  - バッファリング（不完全な行を保持）
- **チャンク処理**:
  - `DICT_CHUNK_SIZE`（1000行）ごとに処理を一時停止
  - `setTimeout(resolve, 0)`でUIブロックを防ぐ
  - 進捗率を計算: `Math.floor((processedCount / 150000) * 100)`
- **インデックス構築**:
  - キー: `${from}-${to}:${source.trim().toLowerCase()}`
  - 値: `target.trim()`
  - `dictIndex` Mapに保存
- **エラーハンドリング**:
  - ファイルが見つからない場合: `null`を返却
  - 読み込み失敗時: 警告を表示して`null`を返却

**`buildSuggestionTrie()` - Trie構築**
- **遅延ロード**:
  - `suggestionTrieBuilt`フラグで重複構築を防止
- **チャンク処理**:
  - 1フレームあたり100件まで処理
  - `requestAnimationFrame`で非同期処理
  - UIブロックを防ぐ
- **Trie構造**:
  ```javascript
  {
    'h': {
      'e': {
        'l': {
          'l': {
            'o': {
              '_word': 'hello'
            }
          }
        }
      }
    }
  }
  ```
- **処理**:
  1. `dictIndex`から全エントリを取得
  2. 各単語を文字ごとに分割
  3. Trieノードを構築
  4. 終端ノードに`_word`を設定

**`getSuggestions(prefix, limit = 10)`**
- **処理**:
  1. Trieが未構築なら構築
  2. プレフィックスまでノードを移動
  3. プレフィックスから始まる全単語を再帰的に収集
  4. 最大`limit`件まで返却
- **最適化**:
  - 早期終了: `suggestions.length >= limit`で停止
  - 再帰的探索: `collectWords`関数

**`translateBatch(words, fromLang, toLang)`**
- **バッチ分割**:
  - 最大10件ずつに分割
  - それ以上は複数バッチに分割
- **並列処理**:
  - `Promise.all`で並列翻訳
  - バッチ間に10msの遅延（UIブロックを防ぐ）
- **出力**: `{ [word]: translation }`形式のオブジェクト

**`getPerformanceStats()`**
- **統計計算**:
  - 総クエリ数: `apiCallCache.size + apiCallCacheL2.size`
  - L1ヒット率: `(l1Hits / totalQueries * 100)`
  - L2ヒット率: `(l2Hits / totalQueries * 100)`
  - キャッシュ効率: `(l1Rate + l2Rate)`
  - メモリ使用量: `(l1Memory + l2Memory) / 1024` KB
- **出力**: 統計オブジェクト

---

## 💰 モネタイゼーションロジック

### 7. **プラン管理・API使用量管理**

#### 実装詳細

**`loadUserPlanAndUsage()`**
- **データ構造**:
  ```javascript
  {
    userPlan: "FREE" | "BASIC" | "TRAVELER",
    monthlyUsage: {
      used: 0,
      freeTranslations: 0,
      lastReset: "ISO日時"
    },
    premiumFreeDays: [],
    planMonths: 0
  }
  ```
- **保存先**: `localStorage.getItem('glb_user_plan')`, `localStorage.getItem('glb_monthly_usage')`

**`checkAPIQuota()`**
- **無料版**:
  - クォータ: `0`
  - 制限: `FREE_LIMIT.translations`（5回/月）
  - 使用量: `monthlyUsage.freeTranslations`
- **BASICプラン**:
  - 初月: `$0.5`
  - 2ヶ月目以降: `$0.12/月`
  - 使用量: `monthlyUsage.used`
- **TRAVELERプラン**:
  - クォータ: `$1.99/月`
  - 使用量: `monthlyUsage.used`
- **プレミアム無料日**:
  - `isPremiumFreeDay()`でチェック
  - 無料日は無制限（使用量を記録しない）
- **月次リセット**:
  - `resetMonthlyQuota()`で自動リセット
  - 前回リセットから1ヶ月経過で実行
- **出力**: `{ canUse: boolean, quota: number, used: number, usagePercent: number, remaining: number }`

**`recordAPIUsage()`**
- **プレミアム無料日チェック**:
  - 無料日は記録しない（`return`）
- **使用量記録**:
  - `monthlyUsage.used += API_COST_PER_REQUEST`（`$0.00017`）
  - `saveUserPlanAndUsage()`で保存
- **80%到達時警告**:
  - `showUpgradeWarning(quotaInfo)`を呼び出し

**`recordFreeTranslation()`**
- **無料版のみ**:
  - `monthlyUsage.freeTranslations += 1`
  - `saveUserPlanAndUsage()`で保存

**`isPremiumFreeDay()`**
- **処理**:
  1. `premiumFreeDays`配列を取得
  2. 今日の日付を取得
  3. 配列に含まれているかチェック
- **出力**: `boolean`

**`getCurrentQuota()`**
- **処理**:
  1. `userPlan`を確認
  2. `planMonths`を確認
  3. 初月（`planMonths === 1`）なら`$0.5`、それ以外は`$0.12`
  4. TRAVELERプランは`$1.99`
- **出力**: クォータ額（ドル）

**`showUpgradeModal()`**
- **無料版**:
  - "BASICプラン（$1.99/月）で全機能が使えます"
  - Stripeリンク: `https://buy.stripe.com/dRm3cx7Rj8KA0B1gyHasg01`
- **BASICプラン**:
  - "TRAVELERプラン（$7.99/月）でさらに使えます"
  - Stripeリンク: `https://buy.stripe.com/cNi8wR8Vn8KA4Rh82basg02`
- **TRAVELERプラン（上限超過）**:
  - "只今プラン準備中"

**`showUpgradeWarning(quotaInfo)`**
- **表示条件**:
  - 使用量が80%を超えている
  - TRAVELERプラン以外
- **表示内容**:
  - "⚠️ 使用量XX% - BASICプラン（$1.99/月）で無制限に"
  - 画面上部に固定表示

---

## 🎨 UI/UXロジック

### 8. **リアルタイム翻訳・会話モード・シーンガイド**

#### 実装詳細

**`handleRealtimeTranslate()`**
- **デバウンス**:
  - `realtimeTimer`でタイマー管理
  - 500ms待機してから翻訳実行
  - 入力中はタイマーをリセット
- **処理**:
  1. 入力テキストを取得
  2. 空の場合は何もしない
  3. 500ms待機
  4. `translate()`を呼び出し
  5. 結果を表示

**会話モード (`conversationMode`)**
- **文脈保持**:
  - `conversationContext`配列（最大10件）
  - 各エントリ: `{ from: "user", text: string, to: string, timestamp: number }`
- **プロンプト生成**:
  - 前3件の会話を取得
  - 形式: `[会話の文脈]\n${contextText}\n\n[現在の入力]\n${text}`
- **設定永続化**:
  - `localStorage.setItem('glb_conversation_mode', 'true'/'false')`

**シーンガイド (`guideMode`)**
- **シーン検出** (`detectScene(text, fromLang, toLang)`):
  - レストラン: `/(レストラン|restaurant|dining|menu|order)/i`
  - ホテル: `/(ホテル|hotel|check-in|room|reservation)/i`
  - ショッピング: `/(ショップ|shop|buy|purchase|shopping)/i`
  - 交通: `/(タクシー|taxi|bus|train|transport)/i`
  - 医療: `/(病院|hospital|doctor|medicine|pharmacy)/i`
  - 観光: `/(観光|sightseeing|tour|attraction)/i`
- **ガイド取得** (`getSceneGuide(scene, fromLang, toLang)`):
  - 軽量データから取得（オフライン対応）
  - なければAI（NE Gateway）から取得
- **表示**:
  - シーンガイドパネルに表示
  - 設定でON/OFF切り替え可能

**単語タップ機能 (`makeWordsTappable(text, toLang, fromLang)`)**
- **処理**:
  1. テキストを単語分割（スペース、句読点で分割）
  2. 各単語を`<span>`タグでラップ
  3. クリックイベントを追加
  4. クリック時: `getWordExplanation(word, fromLang, toLang)`を呼び出し
- **説明取得** (`getWordExplanation(word, fromLang, toLang)`):
  1. 150k辞書を検索
  2. ユーザー辞書を検索
  3. AI（NE Gateway）から取得
  4. 見つからない場合: "Sorry, I don't know"
- **表示**:
  - モーダルで説明を表示

**オンボーディング画面**
- **表示条件**:
  - `localStorage.getItem('glb_onboarding_completed')`が`null`
- **処理**:
  1. 言語選択（25言語対応）
  2. 使い方説明（3ステップ）
  3. 翻訳方法説明（3つの方法）
  4. "始める"または"スキップ"ボタン
- **完了時**:
  - `localStorage.setItem('glb_onboarding_completed', 'true')`
  - オンボーディング画面を非表示

**多言語UI (`updateUITexts()`)**
- **データ構造**:
  - `uiTexts`オブジェクト（7言語対応）
  - キー: `ja`, `en`, `zh`, `ko`, `es`, `fr`, `de`
  - フォールバック: `en`
- **処理**:
  1. `appLang`を取得
  2. `uiTexts[appLang]`または`uiTexts.en`を取得
  3. `data-i18n`属性を持つ要素を更新
  4. 各要素のテキストを更新

---

## 🔒 セキュリティロジック

### 9. **NE Gateway接続・APIキー管理**

#### 実装詳細

**APIキー取得**
- **ソース**: `localStorage.getItem('NB_GATE_NOIR')`
- **フォールバック**: `"YOUR_NB_GATE_NOIR_KEY_HERE"`
- **検証**:
  - プレースホルダーと一致する場合は警告
  - 実際のキーが設定されているかチェック

**NE Gateway接続**
- **URL**: `http://127.0.0.1:3000` (Mac側ローカル)
- **ヘッダー**:
  - `X-Caller-ID: noir`
  - `Content-Type: application/json`
  - `Authorization: Bearer ${API_KEY}`
- **エラーハンドリング**:
  - ネットワークエラー: フォールバックメッセージ
  - 認証エラー: "API未設定"メッセージ
  - タイムアウト: 10秒でタイムアウト

**技術ブラックボックス化**
- **関数名の難読化**:
  - `decodeEmotions` → `_ed1`
  - `detectTravelTrouble` → `_dt1`
  - `detectTravelContext` → `_cx1`
  - `getContextualTimezoneInfo` → `_cx2`
  - `calculateContextualTip` → `_cx3`
  - `getContextualVoltageInfo` → `_cx4`
  - `getContextualCulturalInfo` → `_cx5`
- **コメント削除**:
  - 詳細ロジックの説明を削除
  - `[BLACKBOX] 技術保護のため詳細は非公開`のみ残す

---

## 📊 統計・分析ロジック

### 10. **使用統計・パフォーマンス監視**

#### 実装詳細

**`showUsageStats()`**
- **データ取得**:
  - 総翻訳数: `history.length`
  - ログインストリーク: `localStorage.getItem('glb_login_streak')`
  - シェア回数: `localStorage.getItem('glb_share_stats')`
- **表示**:
  - モーダルで統計を表示
  - グラフやチャートは未実装（将来拡張可能）

**`checkDailyLogin()`**
- **処理**:
  1. 前回ログイン日を取得
  2. 今日の日付と比較
  3. 連続日数を計算
  4. ストリークを更新
- **通知**:
  - 連続ログイン日数が増えた場合、通知を表示

**`recordShareAction(platform)`**
- **処理**:
  1. シェア統計を取得
  2. プラットフォーム別のカウントを増加
  3. 初回シェアまたは5回ごとに報酬を付与
  4. `localStorage`に保存

**`generateReferralCode()`**
- **処理**:
  1. ユーザーIDを取得（なければ生成）
  2. ハッシュ化（簡易版）
  3. 形式: `GLB${code}`（例: `GLB1A2B3C4D`）
- **保存**: `localStorage.setItem('glb_referral_code', code)`

**`checkReferralCode()`**
- **処理**:
  1. URLパラメータから`ref`を取得
  2. リファラルコードを検証
  3. 有効な場合は報酬を付与
  4. `localStorage`に記録

---

## 🎯 実装済みロジックの総数: **10カテゴリ、50+ロジック**

---

## 📝 技術仕様

### データ構造
- **辞書インデックス**: `Map<string, string>` (`dictIndex`)
- **ユーザー辞書**: `Map<string, string>` (`userDict`)
- **翻訳メモリ**: `Map<string, { targetValue, timestamp }>` (`translationMemory`)
- **履歴**: `Array<{ source, target, fromLang, toLang, timestamp }>` (`history`)
- **APIキャッシュ**: `Map<string, any>` (`apiCallCache`, `apiCallCacheL2`)
- **会話コンテキスト**: `Array<{ from, text, to, timestamp }>` (`conversationContext`)

### パフォーマンス定数
- **DICT_CHUNK_SIZE**: 1000行
- **COOLDOWN_SECONDS**: 5秒
- **MAX_CALLS_PER_HOUR**: 60回
- **L1_CACHE_MAX_SIZE**: 50件
- **L2_CACHE_MAX_SIZE**: 100件
- **TRANSLATION_MEMORY_MAX**: 100件
- **HISTORY_MAX**: 1000件
- **CONVERSATION_CONTEXT_MAX**: 10件

### API定数
- **API_COST_PER_REQUEST**: `$0.00017` (0.025 JPY)
- **API_QUOTA_FREE**: `$0`
- **API_QUOTA_BASIC_INITIAL**: `$0.5`
- **API_QUOTA_BASIC_NORMAL**: `$0.12`
- **API_QUOTA_TRAVELER**: `$1.99`
- **FREE_LIMIT**: `{ translations: 5 }`

---

**最終更新**: 2024年（GLB Travel v1.0）
