# テスト計画・受入基準 — BestBike × 教習所マッチング

版数 **v1.1** ／ 2026-08-04

> **v1.1 での変更**：特典発行トリガーが「入会確定」から **「卒業」** に、
> 特典が1種から **2種** に変わったことに伴い、SEC-* / IT-* を全面的に見直した。
> 料金2テーブル・エリア階層・教習所セルフ管理のテストを追加。

---

## 1. 方針

| # | 方針 |
|---|---|
| T-1 | **特典が動く処理は、テストが本体**。T-12（卒業）はテストが通らない限りマージしない |
| T-2 | セキュリティ要件は自動テストで担保する。目視確認は証跡にならない |
| T-3 | RLS を有効にした状態でテストする。`service_role` で全部通すテストは RLS の検証にならない |
| T-4 | 異常系・境界値を必ず含める。正常系だけのテストは不合格 |
| T-5 | **マスタ値を変えて結果が変わることを確認する**（ハードコード検出） |
| T-6 | E2E は主要導線に絞る。網羅は単体・統合で行う |

### 1.1 テストの層

| 層 | ツール | 対象 | 件数目安 |
|---|---|---|---|
| DB制約 | Vitest + supabase-js | UNIQUE・CHECK・RLS | 20 |
| 単体 | Vitest | バリデーション・料金・状態遷移・採番 | 55 |
| 統合（API） | Vitest + テストDB | Route Handlers | 45 |
| E2E | Playwright | 主要導線 | 6 |
| セキュリティ | Vitest（SEC-*） | 認可・情報漏洩 | 42 |
| 非機能 | Lighthouse CI / k6 | 性能・A11y | 10 |

### 1.2 カバレッジ目標

| 対象 | 目標 |
|---|---|
| `lib/` 全体 | 70% |
| **特典・金銭処理（卒業・クーポン・紹介料・請求）** | **80%以上** |
| `lib/validation/` | 90% |
| `lib/coupon/` | **95%** |

---

## 2. DB制約テスト（DB-*）

| # | ケース | 期待 |
|---|---|---|
| DB-01 | 同一 `(application_id, kind)` で `coupons` を2件 INSERT | 2件目が UNIQUE 違反 |
| DB-02 | 同一 `application_id` で kind 違い（`first_time`/`lifetime`）を2件 | **成功する** |
| DB-03 | 同一 `code` で `coupons` を2件 | 2件目が UNIQUE 違反 |
| DB-04 | `used_count > max_uses` の `coupons` を INSERT | CHECK 違反 |
| DB-05 | 同一 `application_id` で `referral_fees` を2件 | 2件目が UNIQUE 違反 |
| DB-06 | 同一 `(school_id, desired_license, held_license)` の教習費用を2行 | 2行目が UNIQUE 違反 |
| DB-07 | `school_photos` に `sort_order = 4` | CHECK 違反 |
| DB-08 | `school_photos` に同一 `(school_id, sort_order)` を2件 | 2件目が UNIQUE 違反 |
| DB-09 | `school_notify_emails` に `slot = 3` | CHECK 違反 |
| DB-10 | `school_notify_emails` に同一 `(school_id, slot)` を2件 | 2件目が UNIQUE 違反 |
| DB-11 | 同一 `(user_id, school_id)` で進行中の申込を2件 | 2件目が部分ユニーク違反 |
| DB-12 | DB-11 の1件目を `cancelled` にしてから2件目 | **成功する**（再申込が可能） |
| DB-13 | `status='graduated'` かつ `graduated_at IS NULL` | CHECK 違反 |
| DB-14 | `status='graduated'` かつ `graduated_by IS NULL` | CHECK 違反 |
| DB-15 | `status='entry_confirmed'` かつ `entry_confirmed_at IS NULL` | CHECK 違反 |
| DB-16 | `status='cancelled'` かつ `cancel_reason IS NULL` | CHECK 違反 |
| DB-17 | `inquiries` に `phone` も `email` も NULL | CHECK 違反 |
| DB-18 | `consent_kind='third_party_provision'` かつ `target_school_id IS NULL` | CHECK 違反 |
| DB-19 | `audit_logs` を UPDATE / DELETE | 権限エラー |
| DB-20 | 全テーブルの `rowsecurity` を確認 | 全テーブルで `true` |

---

## 3. 単体テスト（UT-*）

### 3.1 仮申込のバリデーション

| # | ケース | 期待 |
|---|---|---|
| UT-01 | 氏名が0文字 / 65文字 | エラー |
| UT-02 | 氏名が1文字 / 64文字 | OK |
| UT-03 | 郵便番号が6桁 / 8桁 / 英字混じり | エラー |
| UT-04 | 郵便番号が `1570063` / `157-0063` | OK・7桁に正規化される |
| UT-05 | 住所が空 | エラー |
| UT-06 | 電話が `090-1234-5678` / `09012345678` / `03-1234-5678` | OK・正規化される |
| UT-07 | 電話が `12345` | エラー |
| UT-08 | メールが `a@b` | エラー |
| UT-09 | `contact_method` が範囲外の値 | エラー |
| UT-10 | 同意が3件のみ | エラー `CONSENT_REQUIRED` |
| UT-11 | 同意4件すべて | OK |
| UT-12 | `tuition_fee_id` が `held_license` と不一致 | エラー |
| UT-13 | `tuition_fee_id` が `desired_license` と不一致 | エラー |

### 3.2 受講年齢の境界値

| # | 希望免許 | 最低年齢 | 申込日時点の年齢 | 期待 |
|---|---|---:|---:|---|
| UT-14 | 普通二輪MT | 16 | 15歳364日 | エラー |
| UT-15 | 普通二輪MT | 16 | 16歳ちょうど（誕生日当日） | **OK** |
| UT-16 | 小型二輪AT | 16 | 15歳364日 | エラー |
| UT-17 | 大型二輪MT | 18 | 17歳364日 | エラー |
| UT-18 | 大型二輪MT | 18 | 18歳ちょうど | **OK** |
| UT-19 | 大型二輪AT | 18 | 17歳11ヶ月 | エラー |
| UT-20 | うるう年 2/29 生まれ、非うるう年の 2/28 時点 | — | 民法の年齢計算に従う |

### 3.3 料金の解決【重要】

| # | ケース | 期待 |
|---|---|---|
| UT-21 | `desired=moto_mt, held=car` に該当行あり | その行の料金を返す |
| UT-22 | `desired=moto_mt, held=none` と `held=car` の両方が存在 | **それぞれ別の料金を返す** |
| UT-23 | 該当する組合せの行がない | `TUITION_COMBINATION_NOT_FOUND` |
| UT-24 | `price_example`：`held_license` 指定あり | その条件の最安行 |
| UT-25 | `price_example`：`held_license` 指定なし | 全体の最安行 |
| UT-26 | `price_example`：教習費用0行 | 教習所自体を返さない |
| UT-27 | 税込・税別が混在する行の合計目安 | 税別行を税込換算して合算し、注記を付ける |
| UT-28 | 別途費用の合計 | 有効な行のみを合算 |

### 3.4 状態遷移

| # | From | To | 実行者 | 期待 |
|---|---|---|---|---|
| UT-29 | `provisional` | `entry_review` | school_staff | OK |
| UT-30 | `entry_review` | `entry_confirmed` | school_staff | OK |
| UT-31 | `entry_confirmed` | `in_training` | システム（日次） | OK |
| UT-32 | `in_training` | `graduated` | school_staff | OK |
| UT-33 | `provisional` | `entry_confirmed` | school_staff | **拒否**（BR-6） |
| UT-34 | `provisional` | `graduated` | school_staff | **拒否**（BR-5） |
| UT-35 | `entry_review` | `graduated` | school_staff | **拒否**（BR-5） |
| UT-36 | `entry_confirmed` | `graduated` | school_staff | **拒否**（BR-5） |
| UT-37 | `graduated` | `cancelled` | school_staff | **拒否**（BR-7） |
| UT-38 | `graduated` | `in_training` | school_staff | **拒否**（BR-7） |
| UT-39 | `graduated` | `in_training` | platform_admin | OK（理由必須） |
| UT-40 | `graduated` | 任意 | user | **拒否** |
| UT-41 | `in_training` | `cancelled` | school_staff | OK（中途退学・理由必須） |
| UT-42 | `cancelled` | 任意 | 全員 | **拒否**（終端） |

### 3.5 クーポンコードの採番

| # | ケース | 期待 |
|---|---|---|
| UT-43 | 10,000回生成 | 重複0件 |
| UT-44 | 形式検証 | 全件 `/^BB(5000\|10PC)-[0-9A-HJKMNP-TV-Z]{8}$/` にマッチ |
| UT-45 | 実装の検査 | `Math.random` を使用していない（`crypto` を使う） |
| UT-46 | **個人情報の非混入** | メール `sho@baller.inc` の `sho`、生年月日 `19920922` の数字列がコードに現れない |
| UT-47 | 同一ユーザーが2校を卒業 | 4件のコードすべてが無関係な値 |
| UT-48 | 除外文字 | `I` / `L` / `O` / `U` がコードに現れない |

### 3.6 クーポンの適用条件

| # | ケース | 期待 |
|---|---|---|
| UT-49 | `first_time` を1回使用 | `used_count=1`、`status='used_up'` |
| UT-50 | `first_time` を2回目に使用 | 拒否 |
| UT-51 | `lifetime` を初回利用で適用 | **拒否**（2回目以降のみ） |
| UT-52 | `lifetime` を10回使用 | すべて成功（`max_uses` が NULL） |
| UT-53 | `expires_at` を過ぎた `first_time` | 拒否・`status='expired'` |
| UT-54 | `status='revoked'` のクーポン | 拒否 |

### 3.7 その他

| # | ケース | 期待 |
|---|---|---|
| UT-55 | `application_no` 生成 | `BB-EDU-2026-08041438` 形式 |
| UT-56 | `application_no` の同分衝突 | 連番サフィックスが付く |
| UT-57 | メールマスク `sho@baller.inc` | `sh***@baller.inc` |
| UT-58 | メールマスク `a@b.com`（1文字） | 元の文字列が復元できない |
| UT-59 | クーポンコードのマスク | `BB5000-****` |
| UT-60 | Outbox バックオフ計算 | 1分→5分→30分→2時間→12時間 |
| UT-61 | Outbox 5回失敗 | `dead` に遷移し Sentry に送られる |
| UT-62 | エリア集計 | 0件の都道府県も返る |
| UT-63 | 長期滞留判定（T-15 L-1） | 標準期間+29日は対象外、+30日は対象 |

---

## 4. セキュリティテスト（SEC-*）【全件必須】

> **1件でも失敗したらリリース不可。**

### 4.1 特典情報の漏洩（最重要）

| # | ケース | 期待 |
|---|---|---|
| **SEC-01** | `status='provisional'` で `GET /api/me/applications` | レスポンスJSONに `coupons` キーが**存在しない** |
| **SEC-02** | `status='entry_review'` で同上 | 同上 |
| **SEC-03** | `status='entry_confirmed'` で同上 | 同上 |
| **SEC-04** | `status='in_training'` で同上 | 同上 |
| **SEC-05** | `status='cancelled'` で同上 | 同上 |
| **SEC-06** | SEC-01〜05 のレスポンス全文 | `BB5000` / `BB10PC` の文字列が**含まれない** |
| SEC-07 | `status='graduated'` で同上 | `coupons` が2件返り、コードが取得できる |
| SEC-08 | `GET /api/me/coupons` を未卒業ユーザーで | 0件 |
| SEC-09 | anon key で `coupons` を直接クエリ | 自分以外の行が0件 |
| SEC-10 | anon key で `coupons` を `status='revoked'` 込みでクエリ | `active` 以外が返らない |
| SEC-11 | **仮申込直後に `coupons` テーブルを確認** | **0件**（特典は卒業時のみ） |
| SEC-12 | **入校確定直後に `coupons` テーブルを確認** | **0件** |

### 4.2 教習所間のデータ分離

| # | ケース | 期待 |
|---|---|---|
| SEC-13 | A校スタッフが `GET /api/school/applications` | B校の申込が0件 |
| SEC-14 | A校スタッフが B校の申込を GET | **404**（403 ではない） |
| SEC-15 | A校スタッフが B校の申込を PATCH | 404 |
| SEC-16 | A校スタッフが B校の申込を entry-confirm | 404 |
| SEC-17 | A校スタッフが B校の申込を graduate | 404 |
| SEC-18 | A校スタッフが B校の料金を PATCH | 404 |
| SEC-19 | A校スタッフが B校の通知先メールを PUT | 404 |
| SEC-20 | A校スタッフが `GET /api/school/invoices` | B校の請求が含まれない |
| SEC-21 | anon key で `applications` を直接クエリ | 自分の申込以外0件 |
| **SEC-22** | school_staff が `coupons` を直接クエリ | **0件**（教習所にコードを見せない） |
| **SEC-23** | 卒業APIのレスポンス | `code` / `BB5000` / `BB10PC` が**含まれない** |
| SEC-24 | A校スタッフが B校の問合せを GET | 0件 |

### 4.3 ロール昇格

| # | ケース | 期待 |
|---|---|---|
| SEC-25 | `/signup` に `role: 'platform_admin'` を含めて POST | `role='user'` で作成される |
| SEC-26 | user が `role` を変更しようとする | 変更されない |
| SEC-27 | user が `/admin` にアクセス | 404 |
| SEC-28 | user が `GET /api/admin/dashboard` | 404 |
| SEC-29 | school_staff が `POST /api/admin/applications/:id/revert` | 404 |
| SEC-30 | JWT の `role` クレームを改ざんして送信 | 拒否（DBの `users.role` が正） |

### 4.4 特典・金銭処理の保護

| # | ケース | 期待 |
|---|---|---|
| SEC-31 | MFA未完了セッションで graduate | 403 `MFA_REQUIRED` |
| SEC-32 | MFA未完了セッションで entry-confirm | 403 |
| SEC-33 | `can_graduate=false` のスタッフで graduate | 403 `OPERATION_NOT_PERMITTED` |
| SEC-34 | `can_confirm=false` のスタッフで entry-confirm | 403 |
| SEC-35 | `Idempotency-Key` なしで graduate | 400 |
| SEC-36 | 同一キー・異なるボディで graduate | 422 |
| SEC-37 | MFA未完了で `revert` | 403 |

### 4.5 一般

| # | ケース | 期待 |
|---|---|---|
| SEC-38 | 教習所の**自由記入欄**に `<script>alert(1)</script>` を保存し、詳細ページを表示 | エスケープされて文字列表示。実行されない |
| SEC-39 | 「特色」「備考」に `<img onerror=...>` を保存 | 同上 |
| SEC-40 | 検索クエリに `' OR 1=1--` | 通常の検索として処理される |
| SEC-41 | クライアントJSを無効化して不正ペイロードを直接POST | サーバ側で400 |
| SEC-42 | 認証APIに11回/分アクセス | 429 |
| SEC-43 | `POST /api/applications` を6回/10分 | 429 |
| SEC-44 | `POST /api/inquiries` を6回/10分 | 429 |
| SEC-45 | Webhook に不正な署名 | 401。ログにボディが残らない |
| SEC-46 | Webhook にタイムスタンプ6分前 | 401 |
| SEC-47 | ビルド成果物に `SUPABASE_SERVICE_ROLE_KEY` の値が含まれるか | 含まれない |
| SEC-48 | エラーレスポンスにスタックトレース・SQL文が含まれるか | 含まれない |
| SEC-49 | アプリログに氏名・住所・メール・電話が平文で出るか | マスクされている |
| SEC-50 | `navigator.geolocation` の呼び出し箇所 | **0件**（AC-L-3） |

---

## 5. 統合テスト（IT-*）

### 5.1 ⚡ 卒業トランザクション【最重要】

| # | ケース | 期待 |
|---|---|---|
| **IT-01** | `in_training` → graduate（正常系） | `status='graduated'`、**`coupons` 2件**（`first_time` 1 + `lifetime` 1）、`application_events` 1件、`audit_logs` 1件、`outbox_events` 2件 |
| **IT-02** | 同一 `Idempotency-Key` で2回 graduate | `coupons` は2件のまま。2回目も 200 で同一レスポンス |
| **IT-03** | **10本の graduate を `Promise.all` で並行実行** | `coupons` が**必ず2件**。`referral_fees` が**必ず1件**。成功は1本、他は冪等200か409 |
| IT-04 | `Idempotency-Key` なし | 400 |
| IT-05 | 同一キー・異なるボディ | 422 |
| IT-06 | `provisional` から graduate | 409 |
| IT-07 | `entry_review` から graduate | 409 |
| IT-08 | `entry_confirmed` から graduate | 409 |
| IT-09 | `cancelled` から graduate | 409 |
| IT-10 | 既に `graduated` から graduate（別キー） | 200・冪等。`coupons` は増えない |
| IT-11 | 他校スタッフから graduate | 404 |
| IT-12 | `can_graduate=false` | 403 |
| IT-13 | MFA未完了 | 403 |
| **IT-14** | `outbox_events` の INSERT を強制失敗 | 全ロールバック。`status='in_training'` のまま、`coupons` 0件 |
| **IT-15** | `coupons` の2件目の INSERT を強制失敗 | 全ロールバック。1件目の `coupons` も残らない |
| **IT-16** | **`coupon_masters` を 5000→3000 / 10→15 に変更して graduate** | `coupons.discount_amount=3000`、`discount_rate=15`（**ハードコード検出**） |
| IT-17 | `coupon_masters.valid_days=30` で graduate | `expires_at` が発行から30日後 |
| IT-18 | `coupon_masters.valid_days=NULL` で graduate | `expires_at` が NULL |
| **IT-19** | `referral_fee_settings.calculation_type='rate', rate_percent=3` で graduate | `referral_fees.amount` が教習料金の3%（**ハードコード検出**） |
| IT-20 | `referral_fee_settings.trigger_status='entry_confirmed'` で graduate | `referral_fees` が**作られない**（入校確定時に作られている） |
| IT-21 | graduate 後の `billing_month` | `graduated_at` の年月と一致 |
| IT-22 | 月末23:59 に graduate | JST基準の `billing_month` |
| **IT-23** | graduate のレスポンスJSON | `code` / `BB5000` / `BB10PC` を**含まない** |

> **IT-03（並行実行）と IT-16 / IT-19（ハードコード検出）は必須。**
> 逐次実行のテストは IT-03 の代替にならない。

### 5.2 入校確定

| # | ケース | 期待 |
|---|---|---|
| IT-24 | `entry_review` → entry-confirm | `status='entry_confirmed'`、`entry_confirmed_at`/`by` が入る |
| IT-25 | `provisional` から entry-confirm | 409 |
| IT-26 | `referral_fee_settings.trigger_status='entry_confirmed'` | `referral_fees` が1件 |
| IT-27 | `referral_fee_settings.trigger_status='graduated'` | `referral_fees` が**0件** |
| IT-28 | 同一キーで2回 entry-confirm | `referral_fees` は1件のまま |
| **IT-29** | entry-confirm 直後の `coupons` | **0件** |
| IT-30 | `entry_scheduled_date` 到来後の日次バッチ | `in_training` に遷移 |

### 5.3 仮申込

| # | ケース | 期待 |
|---|---|---|
| IT-31 | 正常系 | `applications` 1件、`consents` 4件、`outbox_events` 3件（ユーザー宛・教習所宛・本体連携） |
| **IT-32** | 仮申込直後の `coupons` | **0件** |
| IT-33 | 同意3件のみ | 400 `CONSENT_REQUIRED` |
| IT-34 | 年齢不足 | 400 `AGE_REQUIREMENT_NOT_MET` |
| IT-35 | 該当しない料金組合せ | 400 `TUITION_COMBINATION_NOT_FOUND` |
| IT-36 | 重複申込 | 409 `DUPLICATE_APPLICATION` |
| IT-37 | 同一キーの二重POST | 1件のみ作成 |
| IT-38 | トランザクション失敗 | `applications` も `consents` も残らない |
| IT-39 | `price_snapshot` | 申込時点の料金・税込税別が凍結される |
| IT-40 | 教習所の通知先が2件 | `outbox` の教習所宛が2通 |
| IT-41 | 本体連携が失敗 | 仮申込は成立し、`outbox` が `failed` で再送される |

### 5.4 その他のAPI

| # | 対象 | ケース |
|---|---|---|
| IT-42 | `GET /api/areas` | 0件の都道府県も返る。`prefecture` 指定で市区町村を返す |
| IT-43 | `GET /api/schools` | 絞り込み・ソート・ページング・`per_page` 上限の丸め・`status != active` の除外 |
| IT-44 | `GET /api/schools` | `held_license` 指定で `price_example` が切り替わる |
| IT-45 | `GET /api/schools/:slug` | 料金2テーブル・写真・`benefit.trigger='graduation'` を返す |
| IT-46 | `POST /api/inquiries` | 教習所2件に送信、**運営には送信しない**、履歴が残る |
| IT-47 | `POST /api/inquiries` | `phone` も `email` も空で 400 |
| IT-48 | `POST /api/school/fees/tuition` | 重複組合せで 409 |
| IT-49 | `POST /api/school/photos` | 5枚目で 400 |
| IT-50 | `PUT /api/school/notify-emails` | 3件目で 400 |
| IT-51 | 料金更新 | `school_fee_revisions` に前後が記録され、ISRが再検証される |
| IT-52 | `POST /api/admin/applications/:id/revert`（graduated → in_training） | `coupons` が全件 `revoked`、`referral_fees` が `cancelled`（同一Tx） |
| IT-53 | 使用済みクーポンがある申込の revert | 409 |
| IT-54 | `POST /api/admin/referral-fees/close-month` | 締め済月の再締めが 409 |
| IT-55 | `GET /api/admin/dashboard` | `by_school` の合計が `totals` と一致 |

---

## 6. E2Eテスト（E2E-*）

| # | シナリオ | ステップ |
|---|---|---|
| **E2E-01** | **ユーザーの仮申込〜卒業〜特典取得（本命導線）** | トップ → 都道府県 → 市区町村 → 教習所一覧 → 詳細（料金確認）→ ログイン → 仮申込 → 完了 → マイページ（**特典なし**）→ [教習所側で入校 → 教習中 → 卒業] → マイページ再読込（**特典2種が表示**）→ 両方のコードをコピー |
| E2E-02 | 教習所の申込処理 | school_staff ログイン → MFA → 入校待ちタブ → 詳細 → メーラー起動 → 備考入力 → 入校日登録 → 「入校」（ダイアログ）→ 教習中タブへ移動を確認 → 「卒業」（ダイアログ）→ 卒業者タブへ移動とサマリー更新を確認 |
| E2E-03 | 教習所のセルフ管理 | 設定 → 教習費用の行を追加 → 保存 → 公開ページに反映されることを確認 → 重複組合せの追加が拒否される |
| E2E-04 | 権限の分離 | user で `/school`・`/admin` にアクセス → いずれも404 |
| E2E-05 | 仮申込のバリデーション | 未入力送信 → エラー → 同意3件で送信不可 → 年齢不足の免許で警告 → 全入力 → 成功 |
| E2E-06 | エリア階層の状態保持 | 市区町村 → 絞り込み → URL変化 → リロード → 条件が復元される |

### 6.1 実行環境

- Playwright / Chromium・WebKit・Mobile Safari（iPhone 14）の3構成
- テストDBは各実行前に `supabase db reset` + seed で初期化
- 認証は `storageState` で再利用

---

## 7. 非機能テスト

### 7.1 性能

| # | 対象 | 目標 | 手段 |
|---|---|---|---|
| PF-01 | 教習所一覧 LCP（モバイル4G） | 2.5秒以内 | Lighthouse CI |
| PF-02 | 教習所詳細 LCP | 2.5秒以内 | Lighthouse CI |
| PF-03 | `GET /api/schools` p95 | 500ms | k6 |
| PF-04 | 卒業API p95 | 1秒 | k6 |
| PF-05 | 同時接続500 | エラー率1%未満 | k6 |
| PF-06 | 教習所1,000件・料金行10,000件での検索 | 1秒以内 | シードを増やして計測 |

### 7.2 アクセシビリティ

| # | 対象 | 目標 |
|---|---|---|
| A11Y-01 | 全公開ページ | axe-core で critical / serious が0件 |
| A11Y-02 | 仮申込フォーム | キーボードのみで送信完了できる |
| A11Y-03 | 「入校」「卒業」ダイアログ | フォーカストラップ・Escで閉じる |
| A11Y-04 | 料金表 | `<table>` + `<th scope>` で意味づけられている |
| A11Y-05 | Lighthouse Accessibility | 90以上 |

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
| ユーザー役 | 運営メンバー 2名 |
| 教習所役 | 提携予定の教習所 1〜2校の実担当者 |
| 運営役 | 運営責任者 |

### 8.2 シナリオ

| # | シナリオ | 確認したいこと |
|---|---|---|
| UAT-01 | スマホで教習所を探して仮申込する | 説明なしで完了まで到達できるか。**都道府県→市区町村の導線が自然か** |
| UAT-02 | 料金表を見て、自分の保有免許での費用が分かるか | **「希望免許 × 保有免許」の表が直感的に読めるか** |
| UAT-03 | **教習所担当者が「入校」「卒業」を押す** | **PC操作に不慣れな担当者が、迷わず押せるか。2つのボタンの違いが分かるか** |
| UAT-04 | 教習所が自分で料金を更新する | 行の追加・削除が説明なしでできるか |
| UAT-05 | 卒業後、クーポン2種を受け取って使う | 特典が「もらえた」と実感できるか。2種の違いが分かるか |
| UAT-06 | 誤って卒業を押しそうになる | 確認ダイアログで踏みとどまれるか |
| UAT-07 | 運営が当月の売上を確認する | 教習所側の表示と一致しているか |

> **UAT-03 が最重要**。教習所の担当者が「卒業」を押さなければ、
> ユーザーは特典を受け取れず、事業も1円も生まない。
> 操作性は機能の正しさと同じ重みを持つ。

---

## 9. リリース判定基準

以下を**すべて**満たしたときのみリリースする。

| # | 基準 | 判定 |
|---|---|---|
| R-1 | SEC-01 〜 SEC-50 が**全件合格** | 必須 |
| R-2 | IT-01 〜 IT-32 が**全件合格**（特に IT-03 並行実行、IT-16 / IT-19 ハードコード検出） | 必須 |
| R-3 | DB-01 〜 DB-20 が全件合格 | 必須 |
| R-4 | UT-43 〜 UT-48（クーポン採番）が全件合格 | 必須 |
| R-5 | E2E-01 〜 E2E-06 が全件合格 | 必須 |
| R-6 | 特典・金銭処理のカバレッジ 80%以上、`lib/coupon/` は 95%以上 | 必須 |
| R-7 | Lighthouse: Performance 80以上 / Accessibility 90以上 | 必須 |
| R-8 | 未クローズの Blocker / Critical バグが0件 | 必須 |
| R-9 | UAT の全シナリオで「実運用できる」判定 | 必須 |
| R-10 | 本番環境で Outbox ワーカーの稼働を確認 | 必須 |
| R-11 | バックアップ・リストア手順を1度実行して確認 | 必須 |
| R-12 | プライバシーポリシーに「提携教習所への提供」「ベストBike会員登録」が明記され公開されている | 必須 |
| R-13 | 提携契約書に「卒業時に卒業操作を行う」義務が記載されている | 必須 |
| R-14 | **「永久10%OFF」の終了条件が規約に明記されている**（確認事項I） | 必須 |
| R-15 | **「初回5,000円OFF」の有効期限・適用条件が表示されている**（確認事項H） | 必須 |
| R-16 | **「報酬額5%アップ」の数値訴求が、条件確定まで無効化されている**（確認事項K） | 必須 |
| R-17 | すべての特典訴求に「卒業時に」が明記されている | 必須 |
| R-18 | 確認事項 A・B・C に回答があり、実装に反映されている | 必須 |

### 9.1 バグの重要度

| 重要度 | 定義 | 対応 |
|---|---|---|
| **Blocker** | クーポンの二重発行／未卒業での特典取得／個人情報漏洩／教習所間のデータ漏洩 | 即時修正。リリース中止 |
| **Critical** | 主要導線が完了できない／卒業操作が失敗する／料金が誤表示される | リリース前に必ず修正 |
| Major | 一部機能が動作しない | リリース前に修正を検討 |
| Minor | 表示崩れ・軽微な文言 | 次リリースで対応可 |

---

## 10. リリース後の監視

| # | 項目 | 頻度 | 閾値 |
|---|---|---|---|
| M-1 | `outbox_events.status='dead'` の件数 | リアルタイム | 1件でアラート（**特典が届いていない可能性**） |
| M-2 | 卒業APIの 5xx 率 | リアルタイム | 0.1%でアラート |
| M-3 | **`coupons` 件数 = `applications(graduated)` 件数 × 2** | 日次 | 不一致でアラート |
| M-4 | `referral_fees` 件数 と トリガー該当申込数の一致 | 日次 | 不一致でアラート |
| M-5 | `in_training` の長期滞留（標準期間＋30日） | 日次 | 一覧を運営へ |
| M-6 | `provisional` のまま5営業日超 | 日次 | 一覧を運営へ |
| M-7 | ユーザーの卒業申告フラグ（T-15 L-2） | 日次 | 1件でも運営へ |
| M-8 | 仮申込完了率（フォーム表示→送信） | 週次 | 前週比▲20%で調査 |
| M-9 | 教習所別の卒業率（`graduated / entry_confirmed`） | 月次 | 全体平均の半分以下で調査 |
| M-10 | クーポン利用率 | 月次 | 事業KPIとして観測 |

> **M-3 は「卒業したのに特典が出ていない」を検知する最後の砦。**
> クーポンは1卒業につき必ず2件。件数が1件でもズレたら、その日のうちに原因を特定する。
