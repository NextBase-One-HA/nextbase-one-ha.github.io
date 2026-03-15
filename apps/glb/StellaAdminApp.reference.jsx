/**
 * 【事務長ステラ管理】収益・防衛フロー参考実装（React）
 * 本番ロジックは apps/glb/index.html の STELLA_CORE + 既存フローで実装済み。
 * このファイルは仕様・フロー確認用のリファレンスです。
 */
import React, { useState, useEffect } from 'react';

const STELLA_CORE = {
  VERSION: "1.0.2603",
  MODE_LIMITS: {
    FREE: 0,       // AI使用不可（150k辞書のみ）
    BASIC: 3,      // 1日のAIお試し回数（あとはオンデバイスへ）
    TRAVELER: 50   // 1日の実質上限（これ以上はTRAVELER+へ誘導）
  },
  PAYMENT_LINKS: {
    BASIC: "https://buy.stripe.com/dRm3cx7Rj8KA0B1gyHasg01",
    TRAVELER: "https://buy.stripe.com/cNi8wR8Vn8KA4Rh82basg02"
  }
};

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [plan, setPlan] = useState('FREE'); // 市場投入時はFREEから

  // 【オンライン風演出】あえて少し待たせて価値を出す
  const processTranslation = async () => {
    if (!input) return;

    // 1. まずはオンデバイス辞書（0円）をチェック
    const localResult = await searchLocalDict(input);
    if (localResult) {
      setOutput("Thinking...");
      setTimeout(() => setOutput(localResult), 600); // 爆速だけどあえて演出
      return;
    }

    // 2. プランによる「B」と「FREE」の切り捨て
    if (plan === 'FREE') {
      setOutput("⚠️ この単語は高度なAI判断が必要です。$1.99のBASICプランで解放し、自分専用の辞書に保存しませんか？");
      return;
    }

    // 3. 有料版でもAPIコスト（ビー）を切る
    if (checkApiOverLimit(plan)) {
      setOutput("☁️ クラウドAIが混雑しています。オンデバイス辞書を優先使用中...");
      return;
    }

    // 4. ここで初めてクラウドAPI（Gemini）へ
    const aiResult = await callNoirAI(input);
    setOutput(aiResult);
    saveToLocalDict(input, aiResult); // 資産化（次からは0円）
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '40px 20px' }}>
      <img src="/glb-hero.jpg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ letterSpacing: '12px', color: '#d6b25e', fontSize: '3rem' }}>GLB</h1>
        <p style={{ fontSize: '10px', color: '#888' }}>STELLA ADMIN ACTIVE: v{STELLA_CORE.VERSION}</p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Translate..."
          style={{ width: '100%', maxWidth: '500px', height: '120px', borderRadius: '15px', padding: '15px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #d6b25e' }}
        />

        <br /><br />

        <button onClick={processTranslation} style={{ padding: '15px 80px', borderRadius: '50px', border: 'none', background: '#d6b25e', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
          START
        </button>

        {output && <div style={{ marginTop: '30px', padding: '20px', borderLeft: '4px solid #d6b25e', background: 'rgba(255,255,255,0.05)' }}>{output}</div>}
      </div>
    </div>
  );
}

// 内部ロジック：ダミー（実際はIndexedDBとAPI通信）
async function searchLocalDict(q) { return null; }
async function callNoirAI(q) { return "AI Translated Result"; }
function saveToLocalDict(q, a) {}
function checkApiOverLimit(p) { return false; }

export default App;
