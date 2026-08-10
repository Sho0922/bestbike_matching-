# BestBike × 教習所マッチング

バイクレンタル／シェアリング事業「ベストBike」が運営する、バイク免許取得の教習所マッチングプラットフォーム。

ユーザーが提携教習所に本プラットフォーム経由で「仮申込」し、教習所が「入校」→「**卒業**」と操作を進める。
**卒業した時点で、ユーザーにクーポン2種（初回5,000円OFF／2回目以降 永久10%OFF）が自動発行される。**

---

## このリポジトリにあるもの

| | 内容 |
|---|---|
| [`docs/`](docs/00_index.md) | 設計ドキュメント10本（要件定義・画面仕様・データモデル・API・非機能・開発指示書・テスト計画・見積・**企画資料突合**） |
| `prototype/index.html` | **クライアント提示用プロトタイプ**。ビルド不要・外部通信なしの単体HTML |
| `src/` | プロトタイプの React ソース |

### まず読むもの

**→ [docs/00_index.md](docs/00_index.md)**

---

## プロトタイプを見る

### ビルド不要（推奨・クライアント提示用）

`prototype/index.html` をブラウザで開くだけ。
CSS・JS をすべてインライン化しており、**外部への通信が一切発生しない**（検証済み）。
社内共有サーバに置く、メールに添付する、オフラインで見せる、いずれも可能。

```bash
open prototype/index.html          # macOS
xdg-open prototype/index.html      # Linux
```

### 開発サーバ

```bash
npm install
npm start                          # http://localhost:3000
```

### プロトタイプを再生成する

`src/App.js` を編集したあと：

```bash
npm run build:prototype            # build → Tailwind CSS生成 → 単体HTMLへインライン化
```

---

## 業務フロー

```
仮申込 → 入校確認中 → 入校確定 → 教習中 → ⚡卒業 → クーポン2種を自動発行
                                              └ 初回 5,000円OFF
                                              └ 2回目以降 永久10%OFF
                                              └ シェアリングオーナーで報酬額5%アップ
```

お金と特典が動くのは「卒業」ボタン1つだけ。詳細は [docs/00_index.md](docs/00_index.md)。

---

## 開発体制

| 役割 | 担当 |
|---|---|
| 要件定義・設計・チケット分解・マージ判断 | プロジェクト責任者（CTO） |
| 実装・テストコードの記述 | Codex |
| コードレビュー・仕様突合・受入判定 | Claude Code |

進め方は [docs/06_dev-instructions-codex.md](docs/06_dev-instructions-codex.md) を参照。
チケットは §3 のブロックをそのまま Codex に貼れる形式になっている。

### AI 開発環境（任意）

[Shopify AI Toolkit](docs/10_shopify-ai-toolkit.md) をプロジェクトスコープで導入済み。
各自の環境で実体を取得するには：

```bash
npm run setup:shopify     # 実行後に Claude Code を再起動
```

本プロジェクトの技術スタック（Next.js + Supabase）に Shopify は含まれないため、
**導入は任意**。常時約2,900トークンを消費する点と、テレメトリを既定でOFFにしている点を含め、
判断材料は [docs/10_shopify-ai-toolkit.md](docs/10_shopify-ai-toolkit.md) にまとめた。

---

## 現時点の前提

- 企画資料（PDF）2件を反映済み（v1.1）。差分は [docs/09_pdf-reconciliation.md](docs/09_pdf-reconciliation.md)
- 確認事項 A〜L（[docs/01_requirements.md §8](docs/01_requirements.md)）が未回答
- 特に **A（紹介料の計算ルール）・B（ベストBike本体との連携）・C（ステータスの変更権限）** は
  企画レビューが「システム会社へ渡す前に必ず確定した方がよい」とした3点
- A・B は設定テーブル／Adapter で吸収する設計のため、回答が遅れても Phase 1 の着手はブロックされない
