# テスト計画・受入基準 — BestBike × 教習所マッチング

版数 v1.0 ／ 2026-08-04

---

## 1. 方針

| # | 方針 |
|---|---|
| T-1 | **金銭が動く処理は、テストが本体**。T-10（入会確定）はテストが通らない限りマージしない |
| T-2 | セキュリティ要件は自動テストで担保する。目視確認は証跡にならない |
| T-3 | RLS を有効にした状態でテストする。`service_role` で全部通すテストは、RLS の検証にならない |
| T-4 | 異常系・境界値を必ず含める。正常系だけのテストは不合格 |
| T-5 | E2E は主要導線に絞る。網羅は単体・統合で行う |

### 1.1 テストの層

| 層 | ツール | 対象 | 目標 |
|---|---|---|---|
| DB制約 | pgTAP / Vitest + supabase-js | UNIQUE・CHECK・RLS | 制約を1つずつ検証 |
| 単体 | Vitest | バリデーション・計算・状態遷移 | 分岐網羅 |
| 統合（API） | Vitest + テストDB | Route Handlers | 全エンドポイント |
| E2E | Playwright | 主要導線 | 5シナリオ |
| セキュリティ | Vitest（SEC-*） | 認可・情報漏洩 | 全件必須 |
| 非機能 | Lighthouse CI / k6 | 性能・A11y | 目標値 |

### 1.2 カバレッジ目標

| 対象 | 目標 |
|---|---|
| `lib/` 全体 | 70% |
| **金銭処理（確定・紹介料・特典・請求）** | **80%以上** |
| `lib/validation/` | 90% |
| UI コンポーネント | 目標なし（E2Eで担保） |

---

## 2. DB制約テスト（DB-*）

`03_data-model.md` の制約が実際に効いていることを検証する。

| # | ケース | 期待 |
|---|---|---|
| DB-01 | 同一 `application_id` で `referral_fees` を2件 INSERT | 2件目が UNIQUE 違反 |
| DB-02 | 同一 `application_id` で `benefits` を2件 INSERT | 2件目が UNIQUE 違反 |
| DB-03 | 同一 `coupon_code` で `benefits` を2件 INSERT | 2件目が UNIQUE 違反 |
| DB-04 | 同一 `(user_id, school_id)` で `status='submitted'` の申込を2件 | 2件目が部分ユニーク違反 |
| DB-05 | DB-04 の1件目を `rejected` にしてから2件目を INSERT | **成功する**（再申込が可能） |
| DB-06 | `status='confirmed'` かつ `confirmed_at IS NULL` を INSERT | CHECK 違反 |
| DB-07 | `status='confirmed'` かつ `confirmed_by IS NULL` を INSERT | CHECK 違反 |
| DB-08 | `referral_fee_amount = -1` の schools を INSERT | CHECK 違反 |
| DB-09 | `rating = 6` の schools を INSERT | CHECK 違反 |
| DB-10 | `billing_month = '2026-4'`（ゼロ埋めなし）を INSERT | CHECK 違反 |
| DB-11 | `audit_logs` を UPDATE | 権限エラー |
| DB-12 | `audit_logs` を DELETE | 権限エラー |
| DB-13 | `consent_kind='third_party_provision'` かつ `target_school_id IS NULL` | CHECK 違反 |
| DB-14 | 全テーブルの `rowsecurity` を確認 | 全テーブルで `true` |

---

## 3. 単体テスト（UT-*）

### 3.1 バリデーション

| # | ケース | 期待 |
|---|---|---|
| UT-01 | 姓が0文字 | エラー |
| UT-02 | 姓が33文字 | エラー |
| UT-03 | 姓が1文字 / 32文字 | OK |
| UT-04 | メールが `a@b` | エラー |
| UT-05 | 電話が `090-1234-5678` / `09012345678` / `03-1234-5678` | OK・正規化される |
| UT-06 | 電話が `12345` | エラー |
| UT-07 | `preferred_start_date` が本日 | エラー（翌日以降） |
| UT-08 | `preferred_start_date` が翌日 | OK |
| UT-09 | `preferred_start_date` が1年1日後 | エラー |
| UT-10 | 同意が2件のみ | エラー |
| UT-11 | 同意3件すべて | OK |

### 3.2 年齢要件（境界値・重要）

`school_courses.min_age` を、入校予定日（未指定なら申込日）基準で判定する。

| # | コース | min_age | 入校予定日時点の年齢 | 期待 |
|---|---|---:|---:|---|
| UT-12 | 普通二輪MT | 16 | 15歳364日 | エラー |
| UT-13 | 普通二輪MT | 16 | 16歳ちょうど（誕生日当日） | **OK** |
| UT-14 | 大型二輪 | 18 | 17歳364日 | エラー |
| UT-15 | 大型二輪 | 18 | 18歳ちょうど | **OK** |
| UT-16 | 大型二輪 | 18 | 申込日は17歳、入校予定日に18歳 | **OK**（入校予定日基準） |
| UT-17 | うるう年 2/29 生まれ、非うるう年の 2/28 時点 | — | 民法の年齢計算に従う |

### 3.3 状態遷移

| # | From | To | 実行者 | 期待 |
|---|---|---|---|---|
| UT-18 | `submitted` | `under_review` | school_staff | OK |
| UT-19 | `under_review` | `scheduled` | school_staff | OK（入校日必須） |
| UT-20 | `scheduled` | `confirmed` | school_staff | OK |
| UT-21 | `submitted` | `confirmed` | school_staff | **拒否**（BR-4） |
| UT-22 | `under_review` | `confirmed` | school_staff | **拒否**（BR-4） |
| UT-23 | `confirmed` | `rejected` | school_staff | **拒否**（BR-6） |
| UT-24 | `confirmed` | `revoked` | school_staff | **拒否**（BR-6） |
| UT-25 | `confirmed` | `revoked` | platform_admin | OK（理由必須） |
| UT-26 | `confirmed` | `withdrawn` | user | **拒否** |
| UT-27 | `scheduled` | `withdrawn` | user | OK |
| UT-28 | `rejected` | 任意 | 全員 | **拒否**（終端） |

### 3.4 クーポンコード生成

| # | ケース | 期待 |
|---|---|---|
| UT-29 | 10,000回生成 | 重複0件 |
| UT-30 | 形式検証 | 全件 `/^EDU10-[0-9A-HJKMNP-TV-Z]{8}$/` にマッチ |
| UT-31 | 実装の検査 | `Math.random` を使用していない（`crypto` を使う） |
| UT-32 | 氏名からの推測不能性 | 同一ユーザーが2件発行しても関連のない値になる |

### 3.5 その他

| # | ケース | 期待 |
|---|---|---|
| UT-33 | Haversine 距離計算（既知の2地点） | 誤差1%以内 |
| UT-34 | `application_no` 生成 | `BB-EDU-2026-04221138` 形式 |
| UT-35 | `application_no` の同分衝突 | 連番サフィックスが付く |
| UT-36 | メールマスク `sho@baller.inc` | `sh***@baller.inc` |
| UT-37 | メールマスク `a@b.com`（1文字） | 元の文字列が復元できないこと |
| UT-38 | Outbox バックオフ計算 | 1分→5分→30分→2時間→12時間 |
| UT-39 | Outbox 5回失敗 | `dead` に遷移し Sentry に送られる |

---

## 4. セキュリティテスト（SEC-*）【全件必須】

> **1件でも失敗したらリリース不可。**

### 4.1 特典情報の漏洩（最重要）

| # | ケース | 期待 |
|---|---|---|
| **SEC-01** | `status='submitted'` の申込で `GET /api/me/applications` | レスポンスJSONに `benefit` キーが**存在しない** |
| **SEC-02** | `status='under_review'` で同上 | 同上 |
| **SEC-03** | `status='scheduled'` で同上 | 同上 |
| **SEC-04** | 上記3ケースのレスポンス全文に `coupon_code` / `EDU10` の文字列が含まれない | 含まれない |
| SEC-05 | `status='confirmed'` で同上 | `benefit` が含まれ、`coupon_code` が取得できる |
| SEC-06 | `status='revoked'` で同上 | `benefit` キーが存在しない |
| SEC-07 | anon key で `benefits` テーブルを直接クエリ | 自分以外の行が0件 |
| SEC-08 | anon key で `benefits` を `status='revoked'` 込みでクエリ | `active` 以外が返らない |

### 4.2 教習所間のデータ分離

| # | ケース | 期待 |
|---|---|---|
| SEC-09 | A校スタッフが `GET /api/school/applications` | B校の申込が0件 |
| SEC-10 | A校スタッフが B校の `application_id` を GET | **404**（403 ではない） |
| SEC-11 | A校スタッフが B校の申込を PATCH | 404 |
| SEC-12 | A校スタッフが B校の申込を confirm | 404 |
| SEC-13 | A校スタッフが `GET /api/school/referral-fees` | B校の紹介料が含まれない |
| SEC-14 | anon key で `applications` を直接クエリ | 自分の申込以外0件 |
| SEC-15 | school_staff が `benefits` を直接クエリ | **0件**（教習所にクーポンは見せない） |
| SEC-16 | confirm API のレスポンス | `coupon_code` が含まれない |

### 4.3 ロール昇格

| # | ケース | 期待 |
|---|---|---|
| SEC-17 | `/signup` に `role: 'platform_admin'` を含めて POST | `role='user'` で作成される |
| SEC-18 | user が `PATCH /api/users/me` で `role` を変更 | 変更されない（またはエンドポイントが存在しない） |
| SEC-19 | user が `/admin` にアクセス | 404 |
| SEC-20 | user が `GET /api/admin/dashboard` | 404 |
| SEC-21 | school_staff が `POST /api/admin/applications/:id/revoke` | 404 |
| SEC-22 | JWT の `role` クレームを改ざんして送信 | 拒否される（DBの `users.role` を正とする） |

### 4.4 金銭処理の保護

| # | ケース | 期待 |
|---|---|---|
| SEC-23 | MFA未完了セッションで confirm | 403 `MFA_REQUIRED` |
| SEC-24 | `can_confirm=false` のスタッフで confirm | 403 `CONFIRM_NOT_PERMITTED` |
| SEC-25 | `Idempotency-Key` なしで confirm | 400 |
| SEC-26 | 同一キー・異なるボディで confirm | 422 |
| SEC-27 | MFA未完了で `revoke` | 403 |

### 4.5 一般

| # | ケース | 期待 |
|---|---|---|
| SEC-28 | 申込フォームに `<script>alert(1)</script>` を入力 | エスケープされて表示。実行されない |
| SEC-29 | 検索クエリに `' OR 1=1--` | 通常の検索として処理される |
| SEC-30 | クライアントJSを無効化して不正なペイロードを直接POST | サーバ側で400 |
| SEC-31 | 認証APIに11回/分アクセス | 429 |
| SEC-32 | `POST /api/applications` を6回/10分 | 429 |
| SEC-33 | Webhook に不正な署名 | 401。ログにボディが残らない |
| SEC-34 | Webhook にタイムスタンプ6分前 | 401 |
| SEC-35 | ビルド成果物に `SUPABASE_SERVICE_ROLE_KEY` の値が含まれないか | 含まれない |
| SEC-36 | エラーレスポンスにスタックトレース・SQL文が含まれないか | 含まれない |
| SEC-37 | アプリログに氏名・メール・電話が平文で出ないか | マスクされている |

---

## 5. 統合テスト（IT-*）— 入会確定 【最重要】

> `06_dev-instructions-codex.md` T-10 のテスト要件と対応する。

| # | ケース | 期待 |
|---|---|---|
| **IT-01** | `scheduled` → confirm（正常系） | `applications.status='confirmed'`、`referral_fees` 1件、`benefits` 1件、`application_events` 1件、`audit_logs` 1件、`outbox_events` 2件 |
| **IT-02** | 同一 `Idempotency-Key` で2回 confirm | `referral_fees` は1件のまま。2回目も 200 で同一レスポンス |
| **IT-03** | **10本の confirm を `Promise.all` で並行実行** | `referral_fees` が**必ず1件**。`benefits` も1件。成功は1本、他は冪等 200 か 409 |
| IT-04 | `Idempotency-Key` なし | 400 `IDEMPOTENCY_KEY_REQUIRED` |
| IT-05 | 同一キー・異なるボディ | 422 `IDEMPOTENCY_KEY_REUSED` |
| IT-06 | `submitted` から confirm | 409 `APPLICATION_NOT_CONFIRMABLE` |
| IT-07 | `under_review` から confirm | 409 |
| IT-08 | `rejected` から confirm | 409 |
| IT-09 | 既に `confirmed` から confirm（別キー） | 200・冪等。`referral_fees` は増えない |
| IT-10 | 他校スタッフから confirm | 404 |
| IT-11 | `can_confirm=false` | 403 |
| IT-12 | MFA未完了 | 403 |
| **IT-13** | `outbox_events` の INSERT を強制的に失敗させる | 全ロールバック。`status` が `scheduled` のまま、`referral_fees` も `benefits` も0件 |
| IT-14 | `benefits` の INSERT を強制的に失敗させる | 全ロールバック |
| IT-15 | `schools.referral_fee_amount = 8000` の校で confirm | `referral_fees.amount = 8000`（5000のハードコードでない） |
| IT-16 | `benefit_masters.discount_rate = 15` で confirm | `benefits.discount_rate = 15`（10のハードコードでない） |
| IT-17 | confirm 後、`billing_month` が `confirmed_at` の年月と一致 | 一致 |
| IT-18 | 月末23:59 に confirm（タイムゾーン境界） | JST基準の `billing_month` になる |

> **IT-03 は必須**。逐次実行のテストでは代替にならない。
> 行ロックと UNIQUE 制約の両方が効いていることを、実際の並行実行で確認する。

### 5.1 その他のAPI統合テスト

| # | 対象 | ケース |
|---|---|---|
| IT-19 | `GET /api/schools` | 絞り込み・ソート・ページング・`per_page` 上限の丸め |
| IT-20 | `GET /api/schools` | `status != 'active'` が返らない |
| IT-21 | `POST /api/applications` | 正常系・同意欠落・年齢不足・重複・冪等 |
| IT-22 | `POST /api/applications` | トランザクション失敗時に `applications` も `consents` も残らない |
| IT-23 | `GET /api/me/applications` | `timeline` が `application_events` の実データから生成される |
| IT-24 | `PATCH /api/school/applications/:id` | `confirmed` への遷移を試みると 400 |
| IT-25 | `POST /api/school/applications/:id/reject` | `confirmed` からは 409 |
| IT-26 | `POST /api/admin/applications/:id/revoke` | `referral_fees='cancelled'`・`benefits='revoked'` が同一Txで更新される |
| IT-27 | `POST /api/admin/referral-fees/close-month` | 締め済月の再締めが 409 |

---

## 6. E2Eテスト（E2E-*）

| # | シナリオ | ステップ |
|---|---|---|
| **E2E-01** | ユーザーの申込〜特典取得（**本命導線**） | LP → 一覧 → 絞り込み → 詳細 → ログイン → 申込フォーム → 完了 → マイページ（特典なし）→ [教習所側で入校日登録・入会確定] → マイページ再読込（特典表示）→ コードをコピー |
| E2E-02 | 教習所の申込処理 | school_staff でログイン → MFA → 一覧 → 詳細 → 入校日登録 → 入会確定（ダイアログ）→ 一覧のステータスとサマリー更新を確認 |
| E2E-03 | 権限の分離 | user で `/school`・`/admin` にアクセス → いずれも404 |
| E2E-04 | 申込のバリデーション | 未入力送信 → エラー表示 → 同意なし送信 → 送信不可 → 全入力 → 成功 |
| E2E-05 | 検索の状態保持 | 絞り込み → URL変化を確認 → リロード → 条件が復元される |

### 6.1 E2E の実行環境

- Playwright / Chromium・WebKit・Mobile Safari（iPhone 14）の3構成
- テストDBは各実行前に `supabase db reset` + seed で初期化
- 認証は `storageState` で再利用し、ログイン処理を毎回走らせない

---

## 7. 非機能テスト

### 7.1 性能

| # | 対象 | 目標 | 手段 |
|---|---|---|---|
| PF-01 | 一覧ページ LCP（モバイル4G） | 2.5秒以内 | Lighthouse CI |
| PF-02 | 詳細ページ LCP | 2.5秒以内 | Lighthouse CI |
| PF-03 | `GET /api/schools` p95 | 500ms | k6 |
| PF-04 | confirm API p95 | 1秒 | k6 |
| PF-05 | 同時接続500 | エラー率1%未満 | k6 |
| PF-06 | 教習所1,000件での検索 | 1秒以内 | シードを1,000件に増やして計測 |

### 7.2 アクセシビリティ

| # | 対象 | 目標 |
|---|---|---|
| A11Y-01 | 全公開ページ | axe-core で critical / serious が0件 |
| A11Y-02 | 申込フォーム | キーボードのみで送信完了できる |
| A11Y-03 | 入会確定ダイアログ | フォーカストラップ・Escで閉じる |
| A11Y-04 | Lighthouse Accessibility | 90以上 |

### 7.3 ブラウザ・デバイス

| 対象 | バージョン |
|---|---|
| Chrome / Edge | 最新2バージョン |
| Safari | 最新2バージョン |
| iOS Safari | iOS 16以上 |
| Android Chrome | 最新 |
| 画面幅 | 375 / 768 / 1024 / 1440 |

---

## 8. UAT（受入テスト）

### 8.1 参加者

| ロール | 担当 |
|---|---|
| ユーザー役 | BestBike 運営メンバー 2名 |
| 教習所役 | 提携予定の教習所 1〜2校の実担当者 |
| 運営役 | BestBike 運営責任者 |

### 8.2 シナリオ

| # | シナリオ | 確認したいこと |
|---|---|---|
| UAT-01 | スマホで教習所を探して申し込む | 説明なしで完了まで到達できるか |
| UAT-02 | 教習所担当者が申込を確認して確定する | **PC操作に不慣れな担当者が、迷わず「入会確定」を押せるか** |
| UAT-03 | 特典コードを受け取り、BestBikeで使う | 特典が「もらえた」と実感できるか |
| UAT-04 | 誤って確定しそうになる | 確認ダイアログで踏みとどまれるか |
| UAT-05 | 運営が当月の紹介料を確認する | 教習所側の表示と一致しているか |

> **UAT-02 が最重要**。教習所の担当者が「入会確定」を押さなければ、
> このビジネスは1円も生まない。ここの操作性は、機能の正しさと同じ重みを持つ。

---

## 9. リリース判定基準

以下を**すべて**満たしたときのみリリースする。

| # | 基準 | 判定 |
|---|---|---|
| R-1 | SEC-01 〜 SEC-37 が**全件合格** | 必須 |
| R-2 | IT-01 〜 IT-18 が**全件合格**（特に IT-03 並行実行） | 必須 |
| R-3 | DB-01 〜 DB-14 が全件合格 | 必須 |
| R-4 | E2E-01 〜 E2E-05 が全件合格 | 必須 |
| R-5 | 金銭処理のカバレッジ 80%以上 | 必須 |
| R-6 | Lighthouse: Performance 80以上 / Accessibility 90以上 | 必須 |
| R-7 | 未クローズの Blocker / Critical バグが0件 | 必須 |
| R-8 | UAT の全シナリオで「実運用できる」判定 | 必須 |
| R-9 | 本番環境で Outbox ワーカーの稼働を確認 | 必須 |
| R-10 | バックアップ・リストアの手順を1度実行して確認 | 必須 |
| R-11 | 個人情報の取扱いについて、プライバシーポリシーが更新・公開されている | 必須 |
| R-12 | 提携教習所との契約書に「確定操作の義務」が記載されている（`05_nonfunctional.md` L-5） | 必須 |
| R-13 | 「立ちゴケ安心制度」の表示が、内容確定まで無効化されている | 必須 |

### 9.1 バグの重要度

| 重要度 | 定義 | 対応 |
|---|---|---|
| **Blocker** | 金銭の二重計上／特典の不正取得／個人情報漏洩 | 即時修正。リリース中止 |
| **Critical** | 主要導線が完了できない／確定操作が失敗する | リリース前に必ず修正 |
| Major | 一部機能が動作しない | リリース前に修正を検討 |
| Minor | 表示崩れ・軽微な文言 | 次リリースで対応可 |

---

## 10. リリース後の監視

| # | 項目 | 頻度 | 閾値 |
|---|---|---|---|
| M-1 | `outbox_events.status='dead'` の件数 | リアルタイム | 1件でアラート |
| M-2 | confirm API の 5xx 率 | リアルタイム | 0.1%でアラート |
| M-3 | `referral_fees` と `applications(confirmed)` の件数一致 | 日次 | 不一致でアラート |
| M-4 | `benefits` と `applications(confirmed)` の件数一致 | 日次 | 不一致でアラート |
| M-5 | 入校予定日超過7日の未確定申込 | 日次 | 一覧を運営へ |
| M-6 | 申込完了率（フォーム表示→送信） | 週次 | 前週比▲20%で調査 |
| M-7 | 教習所別の確定率 | 月次 | 全体平均の半分以下で調査 |

> M-3 / M-4 は「確定したのに紹介料が立っていない」「特典が出ていない」を検知する
> 最後の砦。件数が1件でもズレたら、その日のうちに原因を特定する。
