#!/usr/bin/env bash
#
# Shopify AI Toolkit セットアップ（Claude Code / 冪等）
#
#   参照: https://shopify.dev/docs/apps/build/ai-toolkit
#   詳細: docs/10_shopify-ai-toolkit.md
#
# リポジトリの .claude/settings.json には「どのプラグインを使うか」が
# コミット済みだが、マーケットプレイスの実体（clone）はマシンごとに必要。
# このスクリプトはその実体を取得し、プロジェクトスコープで有効化する。
#
# 何度実行しても安全（既に入っていれば何もしない）。
#
set -euo pipefail

MARKETPLACE_REPO="Shopify/shopify-ai-toolkit"
MARKETPLACE_NAME="shopify-ai-toolkit"
PLUGIN_REF="shopify-plugin@${MARKETPLACE_NAME}"
EXPECTED_SKILLS=21

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$1" >&2; exit 1; }

echo "Shopify AI Toolkit セットアップ"
echo "──────────────────────────────────────────────"

# ── 1. 前提条件 ───────────────────────────────────────────────
echo "[1/4] 前提条件を確認"

command -v node >/dev/null 2>&1 || die "Node.js が見つかりません。18 以上が必要です。"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node.js 18 以上が必要です（現在: $(node -v)）。"
ok "Node.js $(node -v)"

command -v claude >/dev/null 2>&1 \
  || die "claude CLI が見つかりません。https://claude.com/claude-code を参照してください。"
ok "claude $(claude --version 2>/dev/null | head -1)"

# ── 2. マーケットプレイス ────────────────────────────────────
echo "[2/4] マーケットプレイス '${MARKETPLACE_NAME}' を取得"
# 初回は約100MBのcloneが走る（Admin APIスキーマ同梱のため）。2回目以降は即時。
claude plugin marketplace add "$MARKETPLACE_REPO" >/dev/null 2>&1 \
  || die "マーケットプレイスの追加に失敗しました。ネットワーク（github.com）を確認してください。"
ok "${MARKETPLACE_REPO}"

# ── 3. プラグイン ────────────────────────────────────────────
echo "[3/4] プラグインをプロジェクトスコープで有効化"
# --scope project → .claude/settings.json に記録され、チーム全員に共有される
claude plugin install "$PLUGIN_REF" --scope project >/dev/null 2>&1 \
  || die "プラグインのインストールに失敗しました。"
ok "$PLUGIN_REF"

# ── 4. 検証 ──────────────────────────────────────────────────
echo "[4/4] 動作確認"

DETAILS="$(claude plugin details "$PLUGIN_REF" 2>&1)" \
  || die "プラグインが認識されていません。"

VERSION="$(printf '%s' "$DETAILS" | head -1 | awk '{print $2}')"
ok "バージョン ${VERSION}"

SKILL_COUNT="$(printf '%s' "$DETAILS" | sed -n 's/.*Skills (\([0-9]*\)).*/\1/p' | head -1)"
if [ "${SKILL_COUNT:-0}" -ge "$EXPECTED_SKILLS" ]; then
  ok "スキル ${SKILL_COUNT} 件をロード"
else
  warn "スキルが ${SKILL_COUNT:-0} 件（期待値 ${EXPECTED_SKILLS} 件）。upstream の更新かもしれません。"
fi

# GraphQL 検証はバンドル済みスキーマを使うのでオフラインで動く。
# ここが通れば「スキーマ照合」機能は確実に生きている。
VALIDATOR="$(claude plugin marketplace list --json 2>/dev/null \
  | MP_NAME="$MARKETPLACE_NAME" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{
      const m=JSON.parse(s);const a=Array.isArray(m)?m:(m.marketplaces||[]);
      const e=a.find(x=>x&&x.name===process.env.MP_NAME);
      const p=e&&(e.installLocation||e.path);
      if(p)process.stdout.write(p);}catch(_){}})' 2>/dev/null || true)"
[ -n "$VALIDATOR" ] || VALIDATOR="${HOME}/.claude/plugins/marketplaces/${MARKETPLACE_NAME}"
VALIDATE_SCRIPT="${VALIDATOR}/skills/shopify-admin/scripts/validate.mjs"

if [ -f "$VALIDATE_SCRIPT" ]; then
  if OPT_OUT_INSTRUMENTATION=true node "$VALIDATE_SCRIPT" \
       --code 'query { shop { name } }' 2>&1 | grep -q 'VALID'; then
    ok "Admin GraphQL スキーマ検証（オフライン）が動作"
  else
    warn "GraphQL 検証のスモークテストが通りませんでした。"
  fi
else
  warn "validate.mjs が見つかりません（パス: ${VALIDATE_SCRIPT}）。"
fi

# ドキュメント検索は shopify.dev への通信が必要。閉じた環境では落ちる。
# search_docs.mjs は失敗時も exit 0 を返すため、終了コードではなく出力で判定する。
SEARCH_SCRIPT="${VALIDATOR}/skills/shopify-admin/scripts/search_docs.mjs"
if [ -f "$SEARCH_SCRIPT" ]; then
  SEARCH_OUT="$(OPT_OUT_INSTRUMENTATION=true timeout 60 node "$SEARCH_SCRIPT" \
                  'shop name' 2>&1 || true)"
  if printf '%s' "$SEARCH_OUT" | grep -qi 'Search failed\|HTTP [45][0-9][0-9]'; then
    warn "shopify.dev へ到達できません。ドキュメント検索は使えません。"
    warn "  → $(printf '%s' "$SEARCH_OUT" | head -1)"
    warn "  リモート/閉域環境では egress 許可リストに shopify.dev を追加してください。"
    warn "  GraphQL のスキーマ検証はオフラインで動くため、そのまま利用できます。"
  else
    ok "shopify.dev へ到達可能（ドキュメント検索が使えます）"
  fi
else
  warn "search_docs.mjs が見つかりません（パス: ${SEARCH_SCRIPT}）。"
fi

echo "──────────────────────────────────────────────"
echo "完了。Claude Code を再起動すると 21 スキルが有効になります。"
echo
echo "テレメトリは .claude/settings.json で OFF（OPT_OUT_INSTRUMENTATION=true）にしています。"
echo "詳細は docs/10_shopify-ai-toolkit.md を参照してください。"
