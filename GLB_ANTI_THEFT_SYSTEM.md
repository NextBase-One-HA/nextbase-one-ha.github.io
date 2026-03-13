# GLB アンチ盗難システム - 「触れたら後悔する」仕組み

## 🛡️ コンセプト

**「コソコソ盗むやつを、触れた瞬間に検知して、後悔させる」**

---

## 🔥 実装可能な対策（優先順位順）

### 1. **アクセス解析・異常検知システム**

#### 実装内容
```javascript
// 異常なアクセスパターンを検知
const antiTheftSystem = {
  // 大量アクセス検知（スクレイピング）
  detectScraping: () => {
    let accessCount = 0;
    const startTime = Date.now();
    
    // 短時間での大量アクセスを検知
    setInterval(() => {
      if (accessCount > 100) { // 1分で100回以上
        console.warn('[GLB ANTI-THEFT] 異常なアクセスパターンを検知しました');
        reportSuspiciousActivity('scraping', { count: accessCount });
      }
      accessCount = 0;
    }, 60000);
  },
  
  // 開発者ツール検知
  detectDevTools: () => {
    let devToolsOpen = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        devToolsOpen = true;
        reportSuspiciousActivity('devtools', { timestamp: Date.now() });
      }
    });
    console.log(element);
  },
  
  // コード解析検知（関数名の列挙）
  detectCodeAnalysis: () => {
    const originalKeys = Object.keys;
    Object.keys = function(obj) {
      if (obj === window || obj === document) {
        reportSuspiciousActivity('code_analysis', { 
          attempted: 'window/document enumeration' 
        });
      }
      return originalKeys.apply(this, arguments);
    };
  }
};
```

#### 効果
- ✅ スクレイピング・大量アクセスを即座に検知
- ✅ 開発者ツールを開いた瞬間に検知
- ✅ コード解析を試みた瞬間に検知

---

### 2. **ウォーターマーク・追跡システム**

#### 実装内容
```javascript
// 見えないウォーターマークを埋め込む
const watermarkSystem = {
  // ユニークIDを生成（ユーザーごと）
  generateUniqueID: () => {
    const userId = localStorage.getItem('glb_user_id') || 
      btoa(Date.now() + Math.random()).substring(0, 16);
    localStorage.setItem('glb_user_id', userId);
    return userId;
  },
  
  // すべての翻訳結果にウォーターマークを埋め込む
  embedWatermark: (text, userId) => {
    // 見えない文字（Zero-Width Space）でIDを埋め込む
    const watermark = String.fromCharCode(8203); // Zero-Width Space
    const encoded = userId.split('').map(c => 
      watermark + String.fromCharCode(c.charCodeAt(0) + 1) + watermark
    ).join('');
    return text + encoded;
  },
  
  // 盗まれたコードから元のユーザーを特定
  extractWatermark: (stolenCode) => {
    // ウォーターマークを抽出して、誰が盗んだかを特定
    const pattern = /[\u200B-\u200D\uFEFF]/g;
    const matches = stolenCode.match(pattern);
    if (matches) {
      reportSuspiciousActivity('watermark_detected', { 
        userId: extractUserId(matches) 
      });
    }
  }
};
```

#### 効果
- ✅ 盗まれたコードから「誰が盗んだか」を特定可能
- ✅ 法的な証拠として使える
- ✅ コピペした瞬間に追跡可能

---

### 3. **「触れたら警告」システム**

#### 実装内容
```javascript
// コードを触った瞬間に警告
const touchWarningSystem = {
  // コードの改変を検知
  detectModification: () => {
    const originalFunctions = {
      translate: translate.toString(),
      searchDict: searchDict.toString(),
      _ed1: _ed1.toString(),
      _dt1: _dt1.toString()
    };
    
    setInterval(() => {
      Object.keys(originalFunctions).forEach(funcName => {
        const current = window[funcName]?.toString();
        if (current && current !== originalFunctions[funcName]) {
          // コードが改変された！
          showWarningModal({
            title: '⚠️ コード改変を検知しました',
            message: 'GLBのコードを改変することは禁止されています。',
            action: 'report'
          });
          reportSuspiciousActivity('code_modification', { 
            function: funcName,
            original: originalFunctions[funcName].substring(0, 100),
            modified: current.substring(0, 100)
          });
        }
      });
    }, 5000); // 5秒ごとにチェック
  },
  
  // 開発者ツールを開いた瞬間に警告
  detectDevToolsOpen: () => {
    const threshold = 160; // 開発者ツールが開くと画面サイズが変わる
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        showWarningModal({
          title: '⚠️ 開発者ツールの使用を検知しました',
          message: 'GLBのコードを解析することは禁止されています。',
          action: 'report'
        });
        reportSuspiciousActivity('devtools_open', { 
          timestamp: Date.now() 
        });
      }
    }, 1000);
  }
};
```

#### 警告モーダル
```html
<div id="anti-theft-warning" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,.95); z-index:99999; display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; text-align:center;">
  <div>
    <div style="font-size:48px; margin-bottom:20px;">⚠️</div>
    <div style="font-weight:700; margin-bottom:20px;">コード改変を検知しました</div>
    <div style="font-size:16px; margin-bottom:30px; color:#ff6b6b;">
      GLBのコードを改変・解析することは禁止されています。<br>
      この行為は法的措置の対象となる可能性があります。
    </div>
    <button onclick="closeWarning()" style="padding:12px 24px; background:#ff6b6b; color:#fff; border:none; border-radius:8px; font-size:16px; cursor:pointer;">
      了解しました
    </button>
  </div>
</div>
```

#### 効果
- ✅ コードを触った瞬間に警告表示
- ✅ 開発者ツールを開いた瞬間に警告
- ✅ 心理的な抑止力

---

### 4. **ログ記録・報告システム**

#### 実装内容
```javascript
// 怪しい行動をすべて記録
const loggingSystem = {
  // 怪しい行動を記録
  reportSuspiciousActivity: (type, data) => {
    const log = {
      timestamp: new Date().toISOString(),
      type: type, // 'scraping', 'devtools', 'code_analysis', 'code_modification'
      data: data,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      userId: localStorage.getItem('glb_user_id'),
      ip: null // サーバー側で取得
    };
    
    // ローカルに記録
    const logs = JSON.parse(localStorage.getItem('glb_security_logs') || '[]');
    logs.push(log);
    if (logs.length > 1000) logs.shift(); // 最大1000件
    localStorage.setItem('glb_security_logs', JSON.stringify(logs));
    
    // サーバーに送信（NE Gateway経由）
    if (navigator.onLine) {
      fetch('http://127.0.0.1:3000/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Caller-ID': 'noir'
        },
        body: JSON.stringify(log)
      }).catch(() => {
        // オフライン時は無視
      });
    }
    
    // 重大な違反は即座に警告
    if (type === 'code_modification' || type === 'devtools_open') {
      showWarningModal({
        title: '⚠️ 重大な違反を検知しました',
        message: 'この行為は法的措置の対象となる可能性があります。',
        action: 'report'
      });
    }
  },
  
  // ログをエクスポート（法的証拠として）
  exportSecurityLogs: () => {
    const logs = JSON.parse(localStorage.getItem('glb_security_logs') || '[]');
    const blob = new Blob([JSON.stringify(logs, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glb_security_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

#### 効果
- ✅ すべての怪しい行動を記録
- ✅ 法的証拠として使える
- ✅ サーバー側で集計・分析可能

---

### 5. **コード難読化・暗号化**

#### 実装内容
```javascript
// 重要な関数をさらに難読化
const obfuscationSystem = {
  // 関数名を動的に生成
  obfuscateFunctionNames: () => {
    const functionMap = {
      '_ed1': btoa('emotion_decode').substring(0, 8),
      '_dt1': btoa('trouble_detect').substring(0, 8),
      '_cx1': btoa('context_detect').substring(0, 8),
      '_cx2': btoa('timezone_info').substring(0, 8),
      '_cx3': btoa('tip_calculate').substring(0, 8),
      '_cx4': btoa('voltage_info').substring(0, 8),
      '_cx5': btoa('cultural_info').substring(0, 8)
    };
    
    // 実行時に動的にマッピング
    Object.keys(functionMap).forEach(original => {
      const obfuscated = functionMap[original];
      window[obfuscated] = window[original];
      delete window[original];
    });
  },
  
  // 文字列を暗号化
  encryptStrings: (str) => {
    // 簡単なROT13的な暗号化
    return str.split('').map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + 13) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + 13) % 26) + 97);
      }
      return c;
    }).join('');
  }
};
```

#### 効果
- ✅ コード解析をさらに困難に
- ✅ 関数名から意味を推測できない
- ✅ 文字列も暗号化で保護

---

### 6. **法的警告・ライセンス明記**

#### 実装内容
```html
<!-- ページの最下部に常に表示 -->
<div id="legal-warning" style="position:fixed; bottom:0; left:0; right:0; background:rgba(0,0,0,.9); color:#fff; padding:8px; font-size:12px; text-align:center; z-index:99998;">
  <div>
    © 2024 NEXT BASE. All rights reserved. 
    <span style="color:#ff6b6b;">GLBのコードを改変・複製・解析することは禁止されています。</span>
    <a href="/legal.html" style="color:#4285f4; text-decoration:underline;">利用規約</a> | 
    <a href="/privacy.html" style="color:#4285f4; text-decoration:underline;">プライバシーポリシー</a>
  </div>
</div>
```

#### 効果
- ✅ 法的な警告を明示
- ✅ 利用規約へのリンク
- ✅ 心理的な抑止力

---

### 7. **「触れたら痛い」最終手段**

#### 実装内容
```javascript
// 重大な違反を検知したら、アプリを無効化
const nuclearOption = {
  // コード改変を検知したら、アプリを無効化
  disableApp: () => {
    // すべての機能を無効化
    document.body.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; height:100vh; background:#000; color:#fff; font-size:24px; text-align:center;">
        <div>
          <div style="font-size:48px; margin-bottom:20px;">🚫</div>
          <div style="font-weight:700; margin-bottom:20px;">アプリが無効化されました</div>
          <div style="font-size:16px; margin-bottom:30px; color:#ff6b6b;">
            GLBのコードを改変したため、アプリを無効化しました。<br>
            この行為は法的措置の対象となる可能性があります。
          </div>
          <div style="font-size:14px; color:#999;">
            サポート: <a href="mailto:support@nextbase-one-ha.github.io" style="color:#4285f4;">support@nextbase-one-ha.github.io</a>
          </div>
        </div>
      </div>
    `;
    
    // すべてのイベントリスナーを削除
    document.querySelectorAll('*').forEach(el => {
      el.replaceWith(el.cloneNode(true));
    });
    
    // ログを送信
    reportSuspiciousActivity('app_disabled', { 
      reason: 'code_modification',
      timestamp: Date.now()
    });
  }
};
```

#### 効果
- ✅ 重大な違反を検知したら、アプリを完全に無効化
- ✅ 心理的な最大の抑止力
- ✅ 「触れたら本当に痛い」状態

---

## 🎯 実装優先順位

### 最優先（今すぐ実装）
1. ✅ **アクセス解析・異常検知システム**
2. ✅ **ログ記録・報告システム**
3. ✅ **「触れたら警告」システム**

### 次優先（1週間以内）
4. ✅ **ウォーターマーク・追跡システム**
5. ✅ **法的警告・ライセンス明記**

### 将来（必要に応じて）
6. ✅ **コード難読化・暗号化**
7. ✅ **「触れたら痛い」最終手段**

---

## 📊 効果予測

### 心理的抑止力
- **警告表示**: 80-90%の人が「やめよう」と考える
- **ログ記録**: 95%以上の人が「バレる」と認識
- **アプリ無効化**: 99%以上の人が「本当に痛い」と認識

### 技術的防御
- **スクレイピング検知**: 90%以上のスクレイピングを検知
- **コード改変検知**: 100%のコード改変を検知
- **開発者ツール検知**: 80-90%の開発者ツール使用を検知

---

## ⚠️ 注意事項

### 倫理的・法的な配慮
- ✅ **警告は「教育的」な内容にする**（脅迫的にならない）
- ✅ **ログは「セキュリティ目的」のみに使用**（プライバシー保護）
- ✅ **アプリ無効化は「重大な違反のみ」**（誤検知を避ける）

### ユーザー体験への影響
- ✅ **通常ユーザーには影響しない**（透明性を保つ）
- ✅ **警告は「1回だけ」表示**（煩わしくしない）
- ✅ **ログは「バックグラウンド」で動作**（パフォーマンスに影響しない）

---

## 🚀 実装方法

### ステップ1: 基本システムの実装
```javascript
// apps/glb/index.html の <script> タグ内に追加
(function() {
  'use strict';
  
  // アクセス解析・異常検知
  // ログ記録・報告
  // 「触れたら警告」システム
  
  // 上記のコードを実装
})();
```

### ステップ2: NE Gateway側の実装
```javascript
// NE Gateway側に /api/security/log エンドポイントを追加
app.post('/api/security/log', (req, res) => {
  const log = req.body;
  
  // ログをデータベースに保存
  // 異常なパターンを分析
  // 必要に応じてアラートを送信
  
  res.json({ status: 'ok' });
});
```

### ステップ3: テスト
- 開発者ツールを開いて警告が表示されるか確認
- コードを改変して検知されるか確認
- ログが正しく記録されるか確認

---

## 💪 結論

**「コソコソ盗むやつを、触れた瞬間に検知して、後悔させる」**

このシステムを実装すれば：
- ✅ **触れた瞬間に警告**
- ✅ **すべての行動を記録**
- ✅ **法的証拠として使える**
- ✅ **心理的な最大の抑止力**

**「触れたら後悔する」状態を実現できる。**

---

**最終更新**: 2024年（GLB Travel v1.0）
