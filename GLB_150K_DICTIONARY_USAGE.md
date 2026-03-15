# 150系辞書と momoriri の確認・最適な使い方

## 1. momoriri の場所

| 場所 | 状態 | 内容 |
|------|------|------|
| **`~/momoriri`** | 現状なし | 設計上は NEゲートウェイ＋自動生成マシンの置き場。実体は Mac にまだない。 |
| **`Desktop/RIMO/docs/momoriri/`** | あり | **自動生成マシン_実装ガイド.md** のみ。フレーズ自動生成の設計・実装例が書いてある。 |

**結論**: 「momoriri ファイル」＝実装ガイドなら `RIMO/docs/momoriri/自動生成マシン_実装ガイド.md`。NE ゲートウェイ用の `~/momoriri` は必要なら別途作成する。

---

## 2. 150系辞書の置き場所（確認済み）

| パス | 行数 | 用途 |
|------|------|------|
| `nextbase-one-ha.github.io/dictionary/150k.csv` | 150001 | **Web GLB** が fetch で参照（`../../dictionary/150k.csv`） |
| `GoogleDrive_GLB/for_glb_150/assets/dictionary/custom_dictionary_150.csv` | 150001 | 150系の配布用（Flutter GLB など） |
| `GoogleDrive_GLB/GLB_Dictionary_Package/dictionary_data/custom_dictionary_150k.csv` | 150001 | ビルド出力先（`expand_to_150k.py` の出力） |

**フォーマット**: いずれも同じ。  
`source,target,from,to`（1行目ヘッダー、以降は `en,ja` など）。Web GLB の `load150kDict()` はこの形式をそのままパースしている。

---

## 3. 最適な使い方（一本化）

### 正本（たった一つの元ファイル）を決める

- **更新するとき**: `NE_GATEWAY` で `expand_to_150k.py --build-bloom` を実行 → 出てくる **custom_dictionary_150k.csv** を正本にする。  
  通常は `Desktop/GLB_Dictionary_Package/dictionary_data/custom_dictionary_150k.csv`（README_150K の記載どおり）。

### Web GLB に反映する

Web GLB は **`dictionary/150k.csv`** だけを読む。正本をここにコピーすればよい。

```bash
# 例: 正本を nextbase-one-ha の dictionary にコピー
cp "/Users/user/Desktop/GoogleDrive_GLB/GLB_Dictionary_Package/dictionary_data/custom_dictionary_150k.csv" \
   "/Users/user/nextbase-one-ha.github.io/dictionary/150k.csv"
```

または `for_glb_150` を正本にしている場合:

```bash
cp "/Users/user/Desktop/GoogleDrive_GLB/for_glb_150/assets/dictionary/custom_dictionary_150.csv" \
   "/Users/user/nextbase-one-ha.github.io/dictionary/150k.csv"
```

### Flutter GLB に反映する

既存の `sync_dict_150_to_glb.py` のままでよい。

```bash
cd /Users/user/Desktop/GoogleDrive_GLB/for_glb_150
python3 sync_dict_150_to_glb.py --glb-root /path/to/flutter_glb_project
```

---

## 4. 運用フロー（推奨）

1. 辞書を更新したくなったら  
   `cd /Users/user/NE_GATEWAY`（または 150k ビルドを実行している場所）で  
   `python3 expand_to_150k.py --build-bloom` を実行。
2. 出た **custom_dictionary_150k.csv** を正本として扱う。
3. **Web GLB**: 上記 `cp` で `nextbase-one-ha.github.io/dictionary/150k.csv` を上書き。
4. **Flutter GLB**: `sync_dict_150_to_glb.py` で `assets/dictionary/custom_dictionary_150.csv` を更新。

これで「150系辞書を下ろした Mac」のどこに正本があっても、**正本 → 各 GLB（Web / Flutter）にコピーするだけ**の最適解になる。

---

## 5. 補足

- **momoriri** の自動生成マシン（フレーズバッチ生成）は、ガイドどおり `~/momoriri` に NE ゲートウェイと generators を用意してから使う想定。ガイドは `RIMO/docs/momoriri/自動生成マシン_実装ガイド.md` で確認可能。
- 辞書の取り扱い・保護方針は `GLB_SPEC_AND_PATENT.md` の「辞書データの取り扱い・保護方針」を参照。
