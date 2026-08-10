# Shopify AI Toolkit セットアップ

版数 **v1.0** ／ 2026-08-10
出典：[shopify.dev/docs/apps/build/ai-toolkit](https://shopify.dev/docs/apps/build/ai-toolkit)

AI コーディングエージェント（Claude Code / Codex 等）に、Shopify の
**公式ドキュメント・APIスキーマ・コード検証**へのアクセスを与えるツールキット。
エージェントが Shopify の実装を推測せず、公式スキーマに照合して書くようになる。

> **前提の確認**
> 本プロジェクト（BestBike × 教習所マッチング）の技術スタックは
> **Next.js 15 + Supabase + Vercel** であり、Shopify は使っていない。
> 教習料金の決済も[資金決済法の論点回避のため対象外](01_requirements.md)（BR-10）。
> つまり **現時点の設計には Shopify の出番がない**。
> 将来 Shopify を使う案件が発生したとき、あるいは別案件と本リポジトリを
> 同じ環境で扱うときのための導入と位置づけている。
> 不要になった場合の削除手順は §7 に記載した。

---

## 1. 何がセットアップされたか

公式が推奨する **プラグイン方式**（3方式のうち推奨されているもの）で導入した。

| ファイル | 役割 | コミット |
|---|---|---|
| `.claude/settings.json` | マーケットプレイスの宣言・プラグインの有効化・テレメトリOFF | ✅ する |
| `scripts/setup-shopify-toolkit.sh` | 各自の環境で実体を取得するスクリプト（冪等） | ✅ する |
| `~/.claude/plugins/` | プラグイン本体（約100MB）。マシンごとにローカル取得 | ❌ しない |

`.claude/settings.json` の内容：

```json
{
  "extraKnownMarketplaces": {
    "shopify-ai-toolkit": {
      "source": { "source": "github", "repo": "Shopify/shopify-ai-toolkit" }
    }
  },
  "enabledPlugins": { "shopify-plugin@shopify-ai-toolkit": true },
  "env": { "OPT_OUT_INSTRUMENTATION": "true" }
}
```

`--scope project` でインストールしているため、この設定は**リポジトリに属し、チーム全員で共有される**。
個人の `~/.claude/settings.json` には依存しない。

---

## 2. 各自の環境での導入手順

```bash
npm run setup:shopify
```

または直接：

```bash
./scripts/setup-shopify-toolkit.sh
```

実行後に **Claude Code を再起動**すると 21 スキルが有効になる。

スクリプトは冪等で、以下を行う：

1. Node.js 18以上 と `claude` CLI の存在確認
2. マーケットプレイス `Shopify/shopify-ai-toolkit` の取得（初回のみ約100MBのclone）
3. プラグインをプロジェクトスコープで有効化
4. **動作確認**（バージョン・スキル数・GraphQL検証の実動・shopify.dev への到達性）

### 手動で行う場合

```bash
claude plugin marketplace add Shopify/shopify-ai-toolkit
claude plugin install shopify-plugin@shopify-ai-toolkit --scope project
```

> 公式ドキュメントは `claude plugin install shopify-ai-toolkit@claude-plugins-official` を
> 案内しているが、この `claude-plugins-official` マーケットプレイスは検証環境から解決できなかった。
> 上記は Shopify 公式リポジトリを直接指す同等の経路で、
> [Shopify の agents ドキュメント](https://shopify.dev/docs/agents/get-started/authentication)が
> 案内しているものと同じ。取得元は同一の `Shopify/shopify-ai-toolkit`。

---

## 3. 導入されるスキル（21件）

プラグイン v1.6.1 時点。

| 分野 | スキル |
|---|---|
| **Admin / API** | `shopify-admin`（Admin GraphQL）、`shopify-storefront-graphql`、`shopify-customer`、`shopify-partner`、`shopify-payments-apps` |
| **UI拡張（Polaris）** | `shopify-polaris-app-home`、`shopify-polaris-admin-extensions`、`shopify-polaris-checkout-extensions`、`shopify-polaris-customer-account-extensions`、`shopify-pos-ui` |
| **テーマ / ストアフロント** | `shopify-liquid`、`shopify-hydrogen` |
| **データ / 分析** | `shopify-custom-data`（メタフィールド・メタオブジェクト）、`shopify-shopifyql` |
| **開発ワークフロー** | `shopify-use-shopify-cli`、`shopify-functions`、`shopify-dev`、`shopify-app-store-review` |
| **オンボーディング** | `shopify-onboarding-dev`、`shopify-onboarding-merchant` |
| **エージェント決済** | `ucp`（Universal Commerce Protocol） |

### コンテキスト消費

| | トークン |
|---|---|
| 常時（全セッションに加算） | **約 2,895** |
| スキル発火時（都度） | 約 1.1k〜56.3k（`shopify-hydrogen` が最大） |

**Shopify を使わないセッションでも常時約2,900トークンを消費する。**
本プロジェクトのように Shopify と無関係な作業が主体の場合、このコストは無駄になる。
気になる場合は §7 の手順で無効化できる（設定は残るので再有効化は一瞬）。

---

## 4. 動作検証の結果

この環境（Claude Code リモートコンテナ）で実際に実行して確認した。

| 項目 | 結果 |
|---|---|
| プラグイン認識（v1.6.1 / 21スキル） | ✅ |
| Admin GraphQL 検証（正しいクエリ） | ✅ `VALID`（2026-07 スキーマ） |
| Admin GraphQL 検証（誤ったフィールド） | ✅ 誤りを検出し `name` / `metafield` を提案 |
| Storefront GraphQL 検証 | ✅ `VALID` |
| プロジェクト設定からの `env` 反映 | ✅ 実測で確認 |
| セットアップスクリプトの冪等性 | ✅ 再実行しても `EXIT=0` |
| **ドキュメント検索（shopify.dev）** | ❌ §6 参照 |
| **Liquid 検証** | ❌ §6 参照 |

GraphQL のスキーマ検証は**同梱スキーマを使うためオフラインで動作する**。
これがツールキットの中核機能であり、ネットワーク制限下でも生きている。

---

## 5. テレメトリ（重要）

**Shopify AI Toolkit のテレメトリは既定で ON。** 送信先は `https://shopify.dev/mcp/usage`。
公式 README によれば、以下が送信される：

- 検索クエリの文言、検証したコードそのもの
- モデル名・クライアント名・バージョン
- **利用者の直近のメッセージを逐語で**（2000文字まで、base64で受け渡し）

本リポジトリはクライアントの企画資料・見積・事業計画を含むため、
**`.claude/settings.json` で明示的に OFF にしている。**

```json
"env": { "OPT_OUT_INSTRUMENTATION": "true" }
```

この1つの環境変数で、スキルスクリプト・MCPサーバ・フックの
**すべてのテレメトリ経路**が停止する（公式 `hooks/README.md` に明記）。
**機能は一切損なわれない**（送信されるのは分析用データのみ）。

有効に戻したい場合は `.claude/settings.json` から `env` ブロックを削除する。

> Claude Code 以外のツール（Codex 等）では上記の設定は効かない。
> シェルで `export OPT_OUT_INSTRUMENTATION=true` を設定すること。

---

## 6. 既知の制約

### 6.1 ドキュメント検索が使えない（リモート環境のみ）

```
Search failed: HTTP 403: Host not in allowlist: shopify.dev.
```

Claude Code のリモートコンテナは egress 許可リスト方式で、`shopify.dev` が含まれていない。
各スキルは「コードを書く前に必ずドキュメント検索」を指示しているため、この機能が
使えないとスキルの効果は限定的になる（**GraphQL のスキーマ検証は影響を受けない**）。

| 環境 | 状態 | 対処 |
|---|---|---|
| ローカルの Claude Code | ✅ 動く | 対処不要 |
| リモート（claude.ai/code） | ❌ 403 | 環境設定の egress 許可リストに `shopify.dev` を追加 |

### 6.2 Liquid 検証が動かない

`shopify-liquid` の `validate.mjs` は以下3パッケージを import するが、
プラグインに同梱されていない：

- `@shopify/theme-check-common`
- `@shopify/theme-check-docs-updater`
- `@shopify/theme-check-node`

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@shopify/theme-check-common'
```

ESM はスクリプト自身の位置から解決するため、**プロジェクト側に npm install しても解決しない**
（`NODE_PATH` を渡しても解決しない）。プラグインディレクトリは更新時に置き換わるため、
そこへ直接インストールするのも保守性が悪い。

**Liquid のテーマを書く段階になったら**、Shopify CLI の
`shopify theme check` を使うこと（`shopify-use-shopify-cli` スキルが扱う正規の経路）。
本プロジェクトに Liquid は存在しないため、現時点で実害はない。

---

## 7. 無効化・削除

### 一時的に無効化（設定は残す）

```bash
claude plugin disable shopify-plugin@shopify-ai-toolkit
```

### 完全に削除

```bash
claude plugin uninstall shopify-plugin@shopify-ai-toolkit
claude plugin marketplace remove shopify-ai-toolkit
```

あわせてリポジトリから以下を削除する：

- `.claude/settings.json`
- `scripts/setup-shopify-toolkit.sh`
- `package.json` の `setup:shopify`
- 本ドキュメント

---

## 8. Claude Code 以外のツール

本プロジェクトは[開発体制](../README.md)上、**実装を Codex**、
**レビューを Claude Code** が担当する。Codex 側にも同じツールキットを入れる場合：

| ツール | コマンド |
|---|---|
| **Codex** | `codex plugin add shopify@openai-curated` |
| **Cursor** | Cursor Chat で `/add-plugin shopify` |
| **Antigravity CLI** | `agy plugin install https://github.com/Shopify/shopify-ai-toolkit` |
| **VS Code** | コマンドパレット → `Chat: Install Plugin From Source` → リポジトリURLを入力 |

これらの設定は各ツールのユーザ設定（例：`~/.codex/config.toml`）に入るため、
**本リポジトリにはコミットできない**。各自の環境で実行する必要がある。

### MCP サーバ方式（プラグイン非対応ツール向け）

プラグインが使えない場合は Dev MCP サーバを直接指定する。

```json
{
  "mcpServers": {
    "shopify-dev-mcp": { "command": "npx", "args": ["-y", "@shopify/dev-mcp@latest"] }
  }
}
```

Codex は TOML かつ `mcp_servers`（スネークケース）である点に注意：

```toml
[mcp_servers.shopify-dev-mcp]
command = "npx"
args = ["-y", "@shopify/dev-mcp@latest"]
```

> 本リポジトリに `.mcp.json` は**あえて置いていない**。
> プラグイン方式が同じ21スキルを既に提供しており、MCPサーバを併設すると
> 機能が重複してコンテキストを二重に消費するため。
> Shopify 公式プラグインの `.mcp.json` も空（`{"mcpServers": {}}`）で、
> 同じ判断がとられている。

---

## 参考

- [Shopify AI Toolkit 公式ドキュメント](https://shopify.dev/docs/apps/build/ai-toolkit)
- [GitHub: Shopify/shopify-ai-toolkit](https://github.com/Shopify/shopify-ai-toolkit)
- [発表時のチェンジログ（2026-04-09）](https://shopify.dev/changelog/shopify-ai-toolkit-connect-your-ai-tools-to-the-shopify-platform)
