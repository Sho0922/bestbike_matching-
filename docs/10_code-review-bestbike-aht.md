# コードレビュー結果 — bestbike-aht

対象リポジトリ **`sho0922/bestbike-aht`** ／ HEAD `3b6a874`
レビュー日 2026-08-07 ／ レビュー者 Claude Code
観点 **金銭処理・RBAC・個人情報**（[06 開発指示書 §5](06_dev-instructions-codex.md) のチェックリスト58項目）

---

## 0. 結論

実装の**設計思想は正しい**。特に入校確定の冪等性は、私が設計書で要求した水準を満たしている。
一方で、**本番投入前に必ず塞ぐべき欠陥が4件**ある。うち2件は金銭の二重計上、1件は越境書込、1件は個人情報の漏洩。

| 重大度 | 件数 | 内容 |
|---|---|---|
| **High** | 4 | 免許証番号の漏洩／他教習所データの書換／請求の二重計上／クーポンの二重利用 |
| Medium | 12 | 外部API呼出のトランザクション内実行、監査の非対称、乱数、CORS 等 |
| Low | 3 | 冪等キーのスコープ、掲載権限 等 |

**High 4件は Phase 1 リリースのブロッカー**として扱うべき。いずれも修正は小さい。

---

## 1. 良い点 — 設計として正しく、変えてはいけない箇所

レビューは欠陥の列挙になりがちなので、先に「守るべき実装」を明示する。

### 1.1 入校確定の冪等性の順序が正しい

`enrollment.service.ts` `confirm()` で、`referralFee.create`（`applicationId` に UNIQUE）が
**外部API呼出 `attachPermanentDiscount` より前**に置かれている。

```ts
// ReferralFee unique(applicationId) is the hard idempotency gate — created first.
const referralFee = await tx.referralFee.create({ ... });
const attach = await this.pricing.attachPermanentDiscount(memberId!, discountPct, ...);
```

並行した2本目のリクエストは `create` で P2002 に落ち、`catch` で 409 に変換される。
**外部（ベストBike本体）には到達しない。** 永久10%OFF が二重付与されることはない。

さらにテストがこの性質そのものを検証している：

```ts
expect(pricing.attachPermanentDiscount).not.toHaveBeenCalled();
```

これは「たまたま動く」ではなく「意図された順序」である。
**この順序を入れ替えるリファクタリングは禁止**とし、上記コメントとテストを削除しないこと。

### 1.2 その他、確認できた良い実装

| 箇所 | 内容 |
|---|---|
| `referral-fees.service.ts` `csvCell` | CSV の formula injection（`=`/`+`/`-`/`@` 始まり）を無害化済み |
| `auth.service.ts` | refresh token の jti ローテーション。使い回しトークンを失効扱いにする |
| `password.ts` | argon2id |
| `configuration.ts` | 本番で秘密鍵が未設定／開発用プレースホルダなら**起動を中止**する（fail-fast） |
| `cookies.ts` | HttpOnly + SameSite=Lax + 本番 Secure |
| `coupons.service.ts` `revoke` | REDEEMED を上書きしない（利用履歴を壊さない） |
| `licenses.service.ts` `review` | APPROVE 競合時の P2002 を冪等扱い。`Coupon.licenseSubId` に UNIQUE が実在するので成立している |
| `AuditLog` | DBトリガで追記専用。E2E のクリーンアップだけが `bb.audit_bypass` で明示的に迂回している |
| `applications.service.ts` `setStatus` | ENROLLED / CANCELLED / REJECTED からの遷移を禁止 |

---

## 2. High — リリースブロッカー

### H-1. 教習所スタッフが利用者の免許証番号とクーポンコードを閲覧できる

**分類** 個人情報 ／ 特典情報の漏洩
**該当** `apps/api/src/modules/applications/applications.service.ts`

```ts
const MINE_INCLUDE = {
  school: true, course: true,
  referralFee: true, benefitGrant: true,
  coupon: true,        // ← code を含む
  licenseSub: true,    // ← licenseNumber（免許証番号12桁）を含む
} satisfies Prisma.ApplicationInclude;

async getById(user: JwtPayload, id: string) {
  const application = await this.prisma.application.findUnique({ where: { id }, include: MINE_INCLUDE });
  ...
  return application;   // ← ロールに関係なく同じ形を返す
}
```

`applications.controller.ts`：

```ts
@Roles(Role.USER, Role.SCHOOL_ADMIN, Role.SCHOOL_STAFF, Role.OPERATOR_ADMIN)
@Get(":id")
```

**何が起きるか**
`GET /api/applications/{自校の申込ID}` を教習所スタッフが叩くと、レスポンスに以下が含まれる。

- `licenseSub.licenseNumber` — **運転免許証番号**（要配慮に準じる強い識別子）
- `licenseSub.holderName` / `expiryDate` / `issuer`
- `coupon.code` — **5,000円クーポンのコード文字列**
- `referralFee.amount` — 当該申込で発生した送客手数料

`assertSchoolScope` は「自校の申込か」しか見ておらず、**何を返すか**は制御していない。

**なぜ重大か**

1. 免許証番号は教習所業務に一切不要である。取得目的の範囲を超えた提供にあたる（個人情報保護法 第18条）。
2. クーポンコードは金銭的価値を持つ。コードを知る第三者が先に使える設計になっている（H-4 と組み合わせると実害が出る）。
3. [05 非機能要件 §2.1](05_nonfunctional.md)「特典情報をクライアントに漏らさない」に真正面から違反している。

**修正方針**

`MINE_INCLUDE` を本人／運営専用とし、教習所向けには別の include を用意する。

```ts
const OWNER_INCLUDE = { school: true, course: true, referralFee: true, benefitGrant: true, coupon: true, licenseSub: true } as const;

const SCHOOL_INCLUDE = {
  school: true,
  course: true,
  referralFee: { select: { amount: true, status: true, periodYear: true, periodMonth: true } },
  // 教習所には免許証情報とクーポンを一切返さない。
  // 進捗把握に必要なのは「提出済みか」だけなので、boolean に落とす。
} as const;

async getById(user: JwtPayload, id: string) {
  const isSchool = user.role === Role.SCHOOL_ADMIN || user.role === Role.SCHOOL_STAFF;
  const application = await this.prisma.application.findUnique({
    where: { id },
    include: isSchool ? SCHOOL_INCLUDE : OWNER_INCLUDE,
  });
  ...
}
```

教習所が「免許提出の有無」を知る必要がある場合は、`licenseSubmitted: boolean` を後付けで組み立てる。
**生の `licenseNumber` を教習所ロールのレスポンスに載せない**ことが要件。

**受入テスト**（[07 §4](07_test-plan.md) に SEC として追加）

- SCHOOL_ADMIN が自校申込を GET → レスポンス JSON に `licenseNumber` が**存在しない**
- SCHOOL_STAFF が自校申込を GET → レスポンス JSON に `coupon` が**存在しない**
- USER が自分の申込を GET → `coupon.code` が**存在する**

---

### H-2. 他教習所のコース料金を書き換えられる（越境書込 + マスアサインメント）

**分類** RBAC ／ テナント分離
**該当** `apps/api/src/modules/schools/schools.service.ts` / `schools.controller.ts`

```ts
// controller — Zod パイプがない
@Roles(Role.OPERATOR_ADMIN, Role.SCHOOL_ADMIN)
@Patch("schools/:id/courses/:courseId")
updateCourse(@CurrentUser() user, @Param("id") id, @Param("courseId") courseId,
             @Body() body: Partial<UpsertCourseInput>) {   // ← 生の @Body()
  return this.schools.updateCourse(user, id, courseId, body);
}

// service
async updateCourse(user, schoolId, courseId, input) {
  const school = await this.requireSchool(schoolId);
  assertSchoolScope(user, school.id);                        // URL の schoolId しか検証していない
  return this.prisma.course.update({ where: { id: courseId }, data: input });
}
```

**欠陥が2つ重なっている。**

**(a) `courseId` が `schoolId` に紐づいているか検証していない**

`assertSchoolScope` が見るのは URL の `:id`（自校）だけ。`:courseId` は素通りする。

```
PATCH /api/schools/{自校ID}/courses/{他校のコースID}
{ "priceAmount": 1 }
```

→ **競合教習所のコース料金を書き換えられる。** 典型的な IDOR。

**(b) `@Body()` が生のため、Prisma の `data` にそのまま流れる**

`addCourse` は `ZodValidationPipe(UpsertCourseDto)` を通しており、Zod が未知キーを削るため安全。
`updateCourse` だけがパイプなしで `data: input` にスプレッドしている。

```
PATCH /api/schools/{自校ID}/courses/{自校のコースID}
{ "schoolId": "{他校ID}" }
```

→ 自校のコースを**他校の一覧に移設**できる。`priceAmount: -50000` のような負値も通る。

**修正方針**

```ts
// controller
@Body(new ZodValidationPipe(UpsertCourseDto.partial())) body: Partial<UpsertCourseInput>,

// service — where で schoolId を必ず絞る
async updateCourse(user: JwtPayload, schoolId: string, courseId: string, input: Partial<UpsertCourseInput>) {
  const school = await this.requireSchool(schoolId);
  assertSchoolScope(user, school.id);
  const { count } = await this.prisma.course.updateMany({
    where: { id: courseId, schoolId },        // ← 所属を where 条件に含める
    data: input,
  });
  if (count === 0) throw new NotFoundException("コースが見つかりません");
  return this.prisma.course.findUnique({ where: { id: courseId } });
}
```

`update` ではなく `updateMany` を使い、**所属チェックを WHERE 句に埋め込む**のが定石。
「読んでから確認して書く」は競合で破れるが、これは破れない。

**同種の点検が必要な箇所**：`schools.controller.ts` の `POST /schools`・`PATCH /schools/:id`・`POST /schools/:id/publish` も生の `@Body()`。
`update()` はフィールドを1つずつ明示代入しているのでマスアサインメントは成立しないが、
`referralFeeAmount` に負値・小数が入りうる。DTO を定義してパイプを通すこと。

**受入テスト**

- 教習所Aの管理者が `PATCH /schools/A/courses/{Bのコース}` → **404**
- 教習所Aの管理者が `{ schoolId: "B" }` を送る → 400、または反映されないこと
- `priceAmount: -1` → 400

---

### H-3. 月次インボイスが二重計上される

**分類** 金銭処理
**該当** `apps/api/src/modules/referral-fees/referral-fees.service.ts` `invoiceRun`

```ts
const pending = await this.prisma.referralFee.findMany({           // ← トランザクション外で読む
  where: { status: ReferralFeeStatus.PENDING, periodYear: year, periodMonth: month },
});
...
const invoice = await this.prisma.$transaction(async (tx) => {
  const inv = await tx.invoice.upsert({
    where: { schoolId_periodYear_periodMonth: { ... } },
    create: { ..., totalAmount: total, ... },
    update: { totalAmount: { increment: total } },               // ← 無条件に加算
  });
  await tx.referralFee.updateMany({
    where: { id: { in: fees.map((f) => f.id) } },                // ← status 条件がない
    data: { status: ReferralFeeStatus.INVOICED, invoiceId: inv.id, invoicedAt: new Date() },
  });
  ...
});
```

**何が起きるか**

`invoiceRun` は2つの経路から呼ばれる。

1. `worker.ts` の BullMQ 月次ジョブ（`runScheduledForPreviousMonth`）
2. 運営画面からの手動実行

この2本が近接して走ると（ジョブ遅延中に運営が「請求実行」を押す、ジョブのリトライ、など）、
**どちらも同じ PENDING 集合をトランザクション外で読む。**

| | 1本目 | 2本目 |
|---|---|---|
| 読取 | 10件 / ¥100,000 | 10件 / ¥100,000（まだ PENDING） |
| upsert | create → `totalAmount = 100,000` | update → `increment 100,000` → **200,000** |
| updateMany | 10件を INVOICED | 同じ10件を再度 INVOICED（無害だが無条件） |

**結果：¥100,000 の実績に対して ¥200,000 の請求書が立つ。**
教習所への過大請求であり、発覚すれば提携関係そのものを毀損する。

`updateMany` に `status: PENDING` 条件がないため、2本目が「もう処理済み」と気づく手がかりがどこにもない。

**修正方針**

読取・加算・遷移を1つのトランザクションに入れ、**実際に遷移した件数から金額を導出**する。

```ts
const invoice = await this.prisma.$transaction(async (tx) => {
  // 1. トランザクション内で読み直す
  const fees = await tx.referralFee.findMany({
    where: { status: ReferralFeeStatus.PENDING, periodYear: year, periodMonth: month, schoolId },
    select: { id: true, amount: true },
  });
  if (fees.length === 0) return null;

  // 2. PENDING のものだけを遷移させ、実際に動いた件数を得る
  const { count } = await tx.referralFee.updateMany({
    where: { id: { in: fees.map((f) => f.id) }, status: ReferralFeeStatus.PENDING },
    data: { status: ReferralFeeStatus.INVOICED, invoicedAt: now },
  });
  if (count !== fees.length) {
    // 競合が起きた。ロールバックして呼び出し側にリトライさせる。
    throw new ConflictException("請求処理が競合しました。再実行してください");
  }

  const total = fees.reduce((s, f) => s + f.amount, 0);
  const inv = await tx.invoice.upsert({ ... , update: { totalAmount: { increment: total } } });
  await tx.referralFee.updateMany({ where: { id: { in: fees.map((f) => f.id) } }, data: { invoiceId: inv.id } });
  ...
});
```

加えて **`invoiceRun` を跨いで直列化する**こと。BullMQ ジョブ側に
`jobId: \`invoice-${year}-${month}\`` を付ければ、同一期間のジョブは1本しか走らない。
手動実行にも `Idempotency-Key` を必須にする（現在この経路に `@Idempotent()` がない）。

**なお、より根本的な問題**：一度発行したインボイスの `totalAmount` を `increment` で書き換える設計自体が、
インボイス制度（適格請求書）の考え方と合わない。発行済み請求書の訂正は**修正インボイスの発行**であり、
元の請求書を黙って書き換えることではない。`status` が `SENT` / `PAID` の請求書への `increment` は禁止すべき。
→ 詳細は [11 法令要件](11_legal-compliance.md) §5。

**受入テスト**

- 同一期間に `invoiceRun` を並行2本 → 請求額が実績と一致する（2倍にならない）
- 2本目が 409 で落ちる、または0件で正常終了する
- `SENT` 済みインボイスがある期間に再実行 → 拒否される

---

### H-4. クーポンが二重に利用できる

**分類** 金銭処理
**該当** `apps/api/src/modules/coupons/coupons.service.ts` `redeem`

```ts
const coupon = await this.prisma.coupon.findUnique({ where: { code: payload.couponCode ?? "" } });
if (!coupon) throw new NotFoundException(...);
if (coupon.status !== CouponStatus.ISSUED) {          // ← トランザクション外で判定
  throw new BadRequestException("このクーポンは利用できません");
}
...
const updated = await this.prisma.$transaction(async (tx) => {
  const u = await tx.coupon.update({
    where: { id: coupon.id },                          // ← status 条件なしで上書き
    data: { status: CouponStatus.REDEEMED, redeemedAt: new Date(), bookingRef: payload.bookingId },
  });
```

**何が起きるか**

判定と更新のあいだに窓がある（TOCTOU）。
Booking Webhook が同時に2本届くと、両方が `ISSUED` を見て通過し、両方が REDEEMED に書き込む。

- 予約Aと予約Bの**両方で ¥5,000 の割引が成立**する
- `bookingRef` は後勝ちで上書きされるため、**どちらの予約に使われたか記録上も追えなくなる**

Webhook は再送されるのが前提の通信路である。ネットワークリトライだけでこの状態に入る。
`redeem` には `@Idempotent()` も付いていない（`@Public()` の webhook なので付けにくい）。

**修正方針**

状態遷移を WHERE 句に埋め込み、更新件数で判定する。

```ts
const updated = await this.prisma.$transaction(async (tx) => {
  const { count } = await tx.coupon.updateMany({
    where: { id: coupon.id, status: CouponStatus.ISSUED },   // ← 遷移条件を WHERE に
    data: { status: CouponStatus.REDEEMED, redeemedAt: now, bookingRef: payload.bookingId },
  });
  if (count === 0) {
    // 併走した別リクエストが既に利用済みにした。
    const current = await tx.coupon.findUnique({ where: { id: coupon.id } });
    if (current?.bookingRef === payload.bookingId) return current;   // 同一予約の再送 → 冪等
    throw new ConflictException("このクーポンは既に利用されています");
  }
  ...
});
```

**同一 `bookingId` の再送は成功扱い、別 `bookingId` は 409** という切り分けが要点。
Webhook の再送で 409 を返すと送信側が延々リトライするため、冪等側は必ず 200 を返すこと。

`expiresAt` の判定も同様にトランザクション内へ移すか、`expiresAt: { gt: now }` を WHERE に含める。

**受入テスト**

- 同一クーポンに対し異なる `bookingId` の webhook を並行2本 → 1本だけ成功、もう1本は 409
- 同一 `bookingId` の webhook を2回 → 2回とも 200、`bookingRef` は1つ
- 期限切れクーポン → 400、`status` は EXPIRED に更新される

---

## 3. Medium

### M-1. 外部API呼出がDBトランザクションの内側にある

`enrollment.service.ts` `confirm` の `attachPermanentDiscount`、
`cancel` の `detachPermanentDiscount` および `queue.cancelJob`（Redis）。

`USE_MOCK_BESTBIKE=false` にした瞬間、これらは**実HTTP**になる。

| リスク | 内容 |
|---|---|
| タイムアウト | Prisma の interactive transaction は既定 5秒。外部APIが遅いと P2028 で全ロールバック |
| コネクション枯渇 | 外部APIを待つあいだ DB コネクションを掴み続ける。同時実行数がそのまま枯渇に直結 |
| **復旧不能な乖離** | 外部で割引が付いた直後にDB側がロールバックすると、**ベストBike本体には10%OFFが残り、こちらには記録がない** |

[05 非機能要件](05_nonfunctional.md) の Outbox 方針に反する。

**ただし単純に外へ出してはいけない。** この位置は §1.1 の冪等性ゲートを成立させるために選ばれている。
`referralFee.create` の前に外へ出すと二重付与が起きる。正しい直しは：

1. トランザクション内では `BenefitGrant` を `PENDING`（`externalRef: null`）で作るだけにする
2. Outbox 行を同一トランザクションで書く
3. ワーカーが Outbox を読んで `attachPermanentDiscount` を呼び、成功したら `externalRef` を埋めて `ACTIVE` にする
4. 失敗は再試行。再試行が冪等になるよう、外部API側のキー（`enrollment:${applicationId}`）を必ず渡す — 現状のコードは既にこれを渡しているので、本体側が冪等なら安全に再試行できる

**§1.1 の「create を先に」という順序は Outbox 化しても維持される**ことに注意（Outbox 行の書込も同一トランザクション内）。

暫定策として最低限、`$transaction(fn, { timeout: 15_000 })` と外部呼出側のタイムアウト設定を入れること。

### M-2. `membership.createMember` がトランザクション外で補償されない

`confirm` の冒頭で BestBike 会員を作り、`account.update` で ID を保存してから本処理に入る。
その後トランザクションが失敗すると、**ベストBike本体には会員だけが残る。**

「idempotent by email」というコメントがあるが、これは**モックの性質**であって、
実APIの保証ではない（U-01 未確定）。確認事項B の回答に「メール重複時の挙動」を必ず含めること。

同じ処理が `applications.service.ts` `submit` にもある（仮申込時の会員連携）。

### M-3. `cancel` に `assertSchoolScope` がない

`confirm` にはあるが `cancel` にはない。防御はコントローラの `@Roles(Role.OPERATOR_ADMIN)` 1枚のみ。
現状は運営専用なので実害はないが、将来 `@Roles` に教習所ロールが追加された瞬間に越境キャンセルが通る。
`confirm` と対称にしておくこと。多層防御。

### M-4. キャンセルの逆仕訳が個別に監査されていない

`confirm` は3件（`ENROLLMENT_CONFIRMED` / `REFERRAL_FEE_CREATED` / `BENEFIT_GRANTED`）記録する。
`cancel` は `ENROLLMENT_CANCELLED` の**1件だけ**で、以下に監査行がない。

- `ReferralFee` → CANCELLED（**売上の取消**）
- `BenefitGrant` → REVOKED
- `Coupon` → EXPIRED

売上を取り消した記録が `AuditLog` に個別に残らないのは、経理証跡として不足している。
テストが `expect(audit.record).toHaveBeenCalledTimes(1)` を固定しているので、
修正時はテストも合わせて更新すること。

### M-5. クーポンコードが `Math.random` で生成されている

`packages/shared/src/coupon-code.ts`：

```ts
export function generateCouponCode(rng: () => number = Math.random): string {
```

`Math.random` は暗号論的擬似乱数ではない。V8 の実装は内部状態が有限で、
**出力を数個観測すれば以降を予測できる**ことが知られている。

このコードは ¥5,000 の金銭的価値を持つ。テスト用に `rng` を注入できる設計は良いので、
**既定値だけ差し替える**のが最小修正。

```ts
import { randomInt } from "node:crypto";
export function generateCouponCode(rng: () => number = () => randomInt(2 ** 30) / 2 ** 30): string {
```

なお `Math.floor(rng() * ALPHABET.length) % ALPHABET.length` の `% ALPHABET.length` は冗長（常に恒等）。
`randomInt(ALPHABET.length)` を直接使う形に整理してもよい。

### M-6. Booking Webhook のペイロードが未検証／トークン比較が非定数時間

`coupons.controller.ts`：

```ts
@Public()
@Post("integrations/booking/webhook")
bookingWebhook(@Body() payload: BookingWebhookPayload,          // ← Zod パイプなし
               @Headers("x-bestbike-webhook-token") token?: string) {
  if (token !== this.config.get<string>("bestbike.webhookToken")) {   // ← 非定数時間比較
```

- 認証を通る唯一の `@Public()` な書込系エンドポイントでありながら、ボディが型アサーションのみ
- `!==` は先頭一致長で処理時間が変わる。ネットワーク越しでは実用的な攻撃は難しいが、`crypto.timingSafeEqual` にすべき
- Webhook 経路にレート制限の個別設定がない

`BookingWebhookDto`（zod）を定義してパイプを通すこと。

### M-7. CORS が任意オリジンを反射している

`main.ts`：

```ts
app.enableCors({ origin: true, credentials: true });
```

`origin: true` は**リクエストの Origin をそのまま返す**、つまり全オリジン許可と等価。
`credentials: true` との併用は本来 CORS 仕様が禁じている組み合わせを迂回する形になる。

現状は Cookie が `SameSite=Lax` のためクロスサイト fetch にCookieが乗らず、実害は抑えられている。
つまり**防御が1枚の設定に依存している**。将来 `SameSite=None`（別サイトにAPIを置く構成）へ変えた瞬間に破れる。

`APP_BASE_URL` に基づく許可リストへ変更すること。

### M-8. ログイン試行のレート制限がグローバル設定のみ

`ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` — 全エンドポイント一律 100req/分。
`/auth/login` に対して 100回/分は、クレデンシャルスタッフィングを止められない。

```ts
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post("login")
```

加えてアカウント単位のロックアウトか、失敗回数の監査記録を検討すること。

### M-9. 教習所の書込系に DTO 検証がない

`POST /schools`、`PATCH /schools/:id`、`POST /schools/:id/publish` が生の `@Body()`。
`referralFeeAmount` に負値・小数・巨大値が入りうる（**送客手数料の金額**である）。
H-2 と合わせて zod DTO を定義すること。

### M-10. 免許情報の同時提出が 500 になる

`licenses.service.ts` `submit` の重複チェックはトランザクション外。
`LicenseSubmission.applicationId` の UNIQUE に当たった P2002 が捕捉されていないため、
連打すると 409 ではなく **500** が返る。`confirm` と同じ `catch` を追加すること。

### M-11. 免許検証が外部API障害で提出そのものを落とす

`validate()` が `membership.getMember` を直接呼んでおり、例外がそのまま外に出る。
ベストBike本体が落ちていると、**利用者は免許情報を提出できない**（500）。

氏名照合は「一致しなければ FLAGGED」という**運用で吸収できる判定**である。
外部呼出が失敗したら `FLAGGED`（要目視確認）に倒すのが正しい。

```ts
let member = null;
try { member = memberId ? await this.membership.getMember(memberId) : null; }
catch { flags.push("会員情報を照会できませんでした（要確認）"); }
```

### M-12. 運営の個人情報検索が監査されていない

`operator.service.ts` `searchUsers` はメールアドレス・BestBike会員ID・クーポンコードを返すが、
`AuditService.record` を呼んでいない。**誰がいつ誰の情報を見たかが残らない。**

個人情報保護法上の安全管理措置として、閲覧系にもアクセスログが必要（[11 §2](11_legal-compliance.md)）。

---

## 4. Low

### L-1. 冪等キーがアカウントにスコープされていない

`idempotency.interceptor.ts` は `findUnique({ where: { key } })`。`IdempotencyKey.key` が主キーで全体一意。
`accountId` を保存しているが**照合していない**。
`requestHash` が違えば 400 になるので実害は小さいが、複合一意 `(accountId, key)` にすべき。

### L-2. 冪等キーの保存が fire-and-forget

```ts
return next.handle().pipe(tap(async (response) => { await this.prisma.idempotencyKey.create({...}).catch(() => undefined); }));
```

`tap` に渡した async 関数は待たれない。**キー保存前に再送が届くと再実行される。**
`confirm` は `ReferralFee` の UNIQUE が最終防波堤になるので実害はない。
**`cancel` にはその制約がない**（M-3 と併せて対処。`updateMany` + `where: { status: ENROLLED }` にすれば同じ性質が得られる）。

### L-3. 教習所自身が掲載可否を切り替えられる

`@Roles(Role.OPERATOR_ADMIN, Role.SCHOOL_ADMIN) @Post("schools/:id/publish")`。
`setPublished` は `status === ACTIVE` を確認していないため、PENDING の教習所も `isPublished=true` にできる。
公開検索側が `status: ACTIVE` も見ているので実際には露出しないが、
**掲載可否は契約締結の与信判断**であり、運営の専権にすべき。

---

## 5. 未検証項目

本レビューは静的読解による。以下は実環境でしか確認できないため、未検証として明示する。

| 項目 | 必要な確認 |
|---|---|
| 並行実行の実挙動 | H-3 / H-4 は PostgreSQL 上の E2E で再現テストを書くこと。`critical-path.e2e-spec.ts` は `DATABASE_URL` 未設定時 skip される |
| `AuditLog` の追記専用トリガ | マイグレーションを読んでおらず、トリガの定義内容そのものは未確認 |
| `apps/web` 側 | 本レビューは API 中心。画面側の表示制御（特典情報のクライアント漏洩）は未確認 |
| `packages/integrations` の HTTP アダプタ | 全メソッドが `notImplemented()`。確認事項B（U-01）が未確定のため実装不能な状態にある |

---

## 6. 対応順序の提案

| 順 | 項目 | 規模 | 理由 |
|---|---|---|---|
| 1 | **H-1** | 小 | 個人情報。今すでに漏れている（既存データがあるなら即時） |
| 2 | **H-4** | 小 | `updateMany` への置換のみ。金銭の二重利用 |
| 3 | **H-2** | 小 | `updateMany` + Zod パイプ。越境書込 |
| 4 | **H-3** | 中 | トランザクション境界の見直し＋ジョブの直列化 |
| 5 | M-5 / M-6 / M-9 / M-10 / M-11 | 小 | まとめて1PRで処理できる |
| 6 | M-3 / M-4 / M-12 / L-1 / L-2 | 小 | 監査・多層防御のまとめ |
| 7 | M-7 / M-8 | 小 | 本番構成が固まる時点で |
| 8 | **M-1 / M-2** | 大 | Outbox 導入。**確認事項B の回答が前提**。それまでは `USE_MOCK_BESTBIKE=true` のままなので実害が出ない |

**M-1 は最も設計的に重いが、最も急がない。**
モック運用のあいだは実HTTPが発生しないため、確認事項B の回答を待って本体連携と同時に着手するのが合理的。
逆に H-1〜H-4 は**今日のコードで今日起こる**問題なので、確認事項の回答を待つ理由がない。

---

## 7. チェックリスト充足状況

[06 §5](06_dev-instructions-codex.md) の58項目に対する結果。

| 区分 | 項目数 | 合格 | 不合格 | 未検証 |
|---|---|---|---|---|
| 冪等性・金銭処理 | 12 | 8 | 3（H-3, H-4, L-2） | 1 |
| 認可・テナント分離 | 14 | 11 | 2（H-2, L-3） | 1 |
| 個人情報 | 9 | 6 | 2（H-1, M-12） | 1 |
| 入力検証 | 8 | 5 | 3（H-2, M-6, M-9） | 0 |
| 監査 | 6 | 4 | 1（M-4） | 1 |
| 外部連携 | 9 | 4 | 2（M-1, M-2） | 3 |
| **合計** | **58** | **38** | **13** | **7** |

関連：[11 法令要件と実装差分](11_legal-compliance.md)
