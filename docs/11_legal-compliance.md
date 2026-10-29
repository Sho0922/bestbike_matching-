# 法令要件と実装差分

対象実装 **`sho0922/bestbike-aht`**
作成日 2026-08-07 ／ 作成者 Claude Code

この文書は「どの法令が、この事業のどの動作を縛るか」を1つずつ挙げ、
実装がそれを満たしているかを判定したもの。**法務の助言ではない。**
最終判断は必ず弁護士・税理士に確認すること（§7）。

---

## 0. 結論

| # | 法令 | 対象 | 判定 | 対応 |
|---|---|---|---|---|
| 1 | **個人情報保護法 第27条** | 第三者提供の同意 | **不備** | 実装済（PR） |
| 2 | **個人情報保護法 第29条** | 第三者提供の記録 | **未実装** | 実装済（PR） |
| 3 | **個人情報保護法 第18条** | 目的外利用の禁止 | **違反** | 実装済（PR） |
| 4 | **民法 第5条** | 未成年者の契約 | **未実装** | 実装済（PR） |
| 5 | **道路交通法 第88条** | 受験資格年齢 | **未検証** | 実装済（PR） |
| 6 | **景品表示法 第5条第2号** | 有利誤認・打消し表示 | **不備** | 実装済（PR） |
| 7 | **特定電子メール法 第4条・第3条** | 送信者表示・オプトアウト | **未実装** | 実装済（PR） |
| 8 | **消費税法 第57条の4** | 適格請求書 | **不備** | 実装済（PR） |
| 9 | 資金決済法 | 前払式支払手段 | **非該当** | 根拠を記録（§6.1） |
| 10 | 古物営業法 | — | **非該当** | 根拠を記録（§6.2） |

**最も重い1点** は §1。
ベストBike本体への会員登録は**別事業への個人データ提供**でありながら、
同意文言にその提供先が一切現れていなかった。

---

## 1. 個人情報保護法 第27条 — 第三者提供の同意

### 1.1 何が問題だったか

同意欄の文言（`apps/web/messages/ja.json`）：

```
"consentThirdParty": "申込情報を教習所へ提供することに同意します"
```

一方で実装は、この同意のもとに**ベストBike本体へも個人データを送っていた**。

```ts
// applications.service.ts
if (dto.linkBestbike && !account.bestbikeMemberId) {
  const member = await this.membership.createMember({
    email: account.email,          // ← ベストBike社へ送信
    displayName: account.displayName,
    phone: account.phone ?? undefined,
  });
```

`linkBestbike` のラベルは「BestBike会員と連携する（推奨）」で、
**既定値は `true`**、しかも「氏名・メールアドレス・電話番号を提供する」とはどこにも書いていない。

さらに DTO 側：

```ts
consentThirdParty: z.literal(true),   // ← 必須。外すと申込が成立しない
```

**同意しないという選択肢が存在しなかった。**

### 1.2 なぜ問題か

第27条第1項は、第三者提供にあたって**あらかじめ本人の同意**を得ることを求めている。
その同意が有効であるためには、少なくとも以下が本人に示されている必要がある。

| 要素 | 旧実装 |
|---|---|
| 提供先 | ❌ 教習所としか書いていない。ベストBike社が現れない |
| 提供する項目 | ❌ 記載なし |
| 利用目的 | ❌ 記載なし |
| 同意しない自由 | ❌ `z.literal(true)` で必須 |

とくに最後が重い。
**役務提供に不可欠でない提供を、役務の条件にしてはならない**（いわゆる抱き合わせ同意）。
教習所への提供は「教習所に申し込む」という役務そのものなので必須にできるが、
ベストBike会員登録は別事業への提供であり、これを申込の条件にすると
「同意しない自由」が実質的に失われる。

### 1.3 どう直したか

同意を**提供先ごとに分離**し、任意の提供は既定オフにした。

```ts
// packages/shared/src/dto.ts
consentThirdPartySchool: z.literal(true),        // 教習所 — 必須
consentThirdPartyBestbike: z.boolean().default(false),  // ベストBike — 任意
linkBestbike: z.boolean().default(false),        // 既定を true → false
```

さらに、提供先の定義そのものをデータにした。

```ts
// packages/shared/src/legal.ts
export const PROVISION_DEFINITIONS = {
  SCHOOL: {
    recipientLabel: "お申込み先の提携教習所",
    items: ["氏名", "生年月日", "メールアドレス", "電話番号", "希望コース", "希望入校日"],
    purpose: "入校手続き・教習の実施およびそれに付随する連絡のため",
    optional: false,
  },
  BESTBIKE: {
    recipientLabel: "ベストBike（バイクレンタル／シェアリング事業）",
    items: ["氏名", "メールアドレス", "電話番号"],
    purpose: "ベストBike会員の登録、および入校特典の付与のため",
    optional: true,
  },
} as const;
```

**この定義が同意画面の表示文言とサーバ側の検証の両方の出所になっている。**
画面に書いてある提供項目と、実際に送る項目が食い違わない構造にした。

同意画面はこの定義から「提供先／提供項目／目的」を自動で描画する。

```
☑ お申込み先の教習所へ、下記の情報を提供することに同意します（必須）
   提供先: お申込み先の提携教習所 ／ 提供項目: 氏名・生年月日・メールアドレス・… ／ 目的: …

── 入校特典を受け取る（任意）──
☐ ベストBikeの会員登録を同時に行い、入校特典を受け取る（任意）
   この項目に同意しなくても、入校のお申込みはそのまま完了します。
```

### 1.4 事業側への影響 — ここは経営判断が要る

**同意しない利用者が現れる。** その場合の挙動をこう決めた。

```ts
// enrollment.service.ts — 入校確定時
const mayProvide = await this.compliance.mayProvideTo(accountId, "BESTBIKE");
if (!memberId && mayProvide) { /* 会員作成 → 特典付与 */ }
```

| | 同意あり | 同意なし |
|---|---|---|
| 入校確定 | 成立 | **成立** |
| 送客手数料 ¥10,000 | 計上 | **計上** |
| 永久10%OFF | 付与 | 付与しない |
| 5,000円クーポン | 発行 | 発行しない |

**送客手数料は同意状態と無関係に計上する。**
教習所への送客という役務は完了しているので、支払義務は利用者の同意で左右されない。
特典だけを見送り、その事実を監査ログ（`BENEFIT_SKIPPED_NO_CONSENT`）に残す。

> **確認事項M（新規）**
> ベストBike連携に同意しない利用者にも申込を許すか。
> 許さない設計（連携必須）にしたい場合、それは「同意しないと使えない」という
> 抱き合わせになるため、法務の確認が必須。
> 現在の実装は「許す」で組んである。

### 1.5 同意の撤回

第27条の同意は**いつでも撤回できる**必要がある。撤回する手段がないものは同意として弱い。

- `POST /api/me/consents/bestbike/withdraw`
- 画面：`/mypage/mail-settings`

---

## 2. 個人情報保護法 第29条 — 第三者提供の記録

### 2.1 何が問題だったか

**提供の記録が一切なかった。**
`Application.consentThirdParty` に `true` が入っているだけで、

- いつ提供したか
- 何を提供したか
- どの文言に同意したうえでの提供か

が復元できない。漏洩時の影響範囲の特定も、開示請求（第33条）への対応もできない。

### 2.2 どう直したか

追記専用の2テーブルを追加した。

```prisma
model ConsentRecord {          // 同意の取得記録
  kind           String        // TOS / PRIVACY / THIRD_PARTY_SCHOOL / THIRD_PARTY_BESTBIKE / GUARDIAN / MARKETING
  consentVersion String        // 提示していた文言の版
  granted        Boolean       // 拒否も記録する（拒否したという事実も証拠）
  grantedAt      DateTime
  withdrawnAt    DateTime?
  ip / userAgent String?
}

model ThirdPartyProvisionLog { // 実際の提供記録（第29条）
  recipient      String        // SCHOOL / BESTBIKE
  recipientRef   String?       // 教習所ID・外部会員ID
  items          String[]      // 実際に送った項目
  purpose        String
  consentVersion String
  providedAt     DateTime
}
```

`ThirdPartyProvisionLog` は `AuditLog` と同じく **DBトリガで UPDATE/DELETE を拒否**する。

```sql
CREATE TRIGGER bb_provisionlog_no_mutation
  BEFORE UPDATE OR DELETE ON "ThirdPartyProvisionLog"
  FOR EACH ROW EXECUTE FUNCTION bb_provisionlog_append_only();
```

### 2.3 「定義にない項目は送れない」をコードで担保した

```ts
// compliance.service.ts
const outOfScope = items.filter((i) => !definition.items.includes(i));
if (outOfScope.length > 0) {
  throw new Error(
    `provision to ${entry.recipient} includes undeclared items: ${outOfScope.join(", ")}. ` +
      `Update PROVISION_DEFINITIONS and the consent wording before sending these.`,
  );
}
```

将来「免許証番号も本体に渡したい」となったとき、**コードが先に落ちる。**
同意文言の改訂を忘れたまま提供項目だけ増える、という事故を構造的に防ぐ。

テストでも固定してある。

```ts
it("提供項目に免許証番号は含まれない", () => {
  for (const def of Object.values(PROVISION_DEFINITIONS)) {
    expect(def.items).not.toContain("免許証番号");
  }
});
```

### 2.4 本人による確認（第33条）

`GET /api/me/provision-history` で、自分の情報が誰にいつ渡ったかを本人が確認できる。

---

## 3. 個人情報保護法 第18条 — 目的外利用の禁止

これは [10 コードレビュー H-1](10_code-review-bestbike-aht.md) と同じ指摘。
**法令の観点でも同じ結論になるため、本PRで併せて修正した。**

`GET /api/applications/:id` が、教習所スタッフに対して

- `licenseSub.licenseNumber` — **運転免許証番号**
- `coupon.code` — 5,000円クーポンのコード

を返していた。免許証番号は教習所の入校手続きに不要であり、
取得目的（教習所への送客と特典付与）の範囲を超える。

修正：ロール別に返す形を変え、**さらに返す直前でも明示的に落とす**（二重の防御）。

```ts
const SCHOOL_INCLUDE = {
  school: true,
  course: true,
  referralFee: { select: { amount: true, status: true, periodYear: true, periodMonth: true } },
  licenseSub: { select: { id: true, reviewStatus: true, createdAt: true } },
};
// …返却直前
const { licenseSub, coupon, ...rest } = application;
return { ...rest, licenseSubmitted: Boolean(licenseSub), licenseReviewStatus: licenseSub?.reviewStatus ?? null };
```

> `include` から外すだけでは足りない。
> `include` に1行足した将来の変更で静かに漏れ始めるため、返却直前でも落としている。
> テストは「どのカラムを引いたか」まで検証している。

---

## 4. 民法 第5条 / 道路交通法 第88条 — 年齢

### 4.1 何が問題だったか

`applicantBirth` を保存するだけで、**一切検証していなかった。**

1. **道路交通法第88条** — 普通二輪は16歳以上、大型二輪は18歳以上。
   年齢を満たさない申込を受け付ければ、教習所に無駄な事務を発生させ、
   その申込にも送客手数料が計上されてしまう。
2. **民法第5条** — 未成年者（18歳未満）の法律行為には法定代理人の同意が必要。
   同意なく行われた契約は**取り消しうる**。
   取り消されれば、計上済みの送客手数料と付与済みの特典を巻き戻すことになる。

普通二輪が16歳からである以上、**16〜17歳の未成年申込は必ず発生する。**
例外的なケースではなく、通常の業務フローに含まれる。

### 4.2 どう直したか

```ts
// packages/shared/src/legal.ts
export const AGE_OF_MAJORITY = 18;                      // 民法第4条（2022年4月〜）
export const MINIMUM_AGE_BY_COURSE = {
  [CourseType.NORMAL_MT]: 16,                           // 道路交通法第88条
  [CourseType.NORMAL_AT]: 16,
  [CourseType.LARGE]: 18,
};
```

- **年齢要件**：`ApplicationsService.submit` でコース種別を引いてから検証（DTO にはコース種別がないため）
- **法定代理人の同意**：DTO の `superRefine` で生年月日から判定し、
  `guardianName` / `guardianPhone` / `consentGuardian` を必須にする
- **画面**：生年月日を入力した時点で、18歳未満なら親権者欄が自動で出る

`ageAt` は満年齢（誕生日前日はまだ前の年齢）で計算している。テストで固定済み。

> **確認事項N（新規）**
> 親権者の同意は、本人がチェックを入れるだけで足りるか。
> 親権者本人への確認（電話・書面）を運用に入れるかは事業判断。
> 現実装は「氏名・連絡先の記録＋チェック」まで。教習所側の実務と揃えること。

---

## 5. 景品表示法 第5条第2号 — 有利誤認

### 5.1 何が問題だったか

画面・メールの全域に「**永久10%OFF**」という強調表示があり、
**条件が一切併記されていなかった。**

```json
"benefit1Title": "永久10%OFF",
"benefit1Body": "入校確定で、対象のBestBikeレンタル料金がずっと10%OFFに。",
"benefitBanner": "この教習所はBestBike提携校：入校確定で永久10%OFF＋5,000円クーポン"
```

実際には：

- 入校がキャンセルされると**取り消される**（`cancel()` が `detachPermanentDiscount` を呼ぶ）
- 対象はレンタル料金のみ（保険料・オプションは対象外）
- サービス終了時には当然終了する

「永久」「ずっと」という語が示す内容と実態に差がある。これが有利誤認にあたる。

5,000円クーポンも同様で、有効期限12ヶ月・初回限定・差額返金なしという条件が
どこにも書かれていなかった。

### 5.2 どう直したか

打消し表示を**データとして一元管理**し、特典に触れる全画面で強制的に併記する。

```ts
// packages/shared/src/legal.ts
export const BENEFIT_DISCLOSURES = {
  PERMANENT_10PCT: {
    label: "永久10%OFF",
    conditions: [
      "入校が確定した時点で付与されます",
      "ベストBikeのレンタル料金が対象です（保険料・オプション・違約金等は対象外）",
      "入校がキャンセルされた場合は取り消されます",
      "他の割引との併用可否は各プランの条件によります",
      "本サービスの終了・変更に伴い割引を終了する場合があります",
    ],
  },
  FIRST_RENTAL_5000: { /* 初回限定・12か月・差額返金なし … */ },
};
```

- 画面：`<BenefitTerms benefits={["PERMANENT_10PCT"]} />`（教習所詳細・マイページ・申込画面）
- メール：`renderEmail()` が本文に自動で挿入する。テンプレート側で書き忘れる余地をなくした

**運用基準上、打消し表示は強調表示と同一視野・同程度の視認性が必要**なので、
文字サイズを本文より落とさず、強調表示のすぐ下に置く前提のコンポーネントにしてある。

> **確認事項O（新規）**
> 「永久」という語を使い続けるか。
> 条件を併記しても、`永久` の語自体が誤認を招くと判断される可能性は残る。
> 「入校特典10%割引」等への言い換えは、法務確認のうえ**表記だけ**変えれば済む
> （`BENEFIT_DISCLOSURES[].label` の1箇所）。

---

## 6. 特定電子メール法

### 6.1 何が問題だったか

`templates.ts` の全メールに **送信者情報がまったくなかった**。
本文の末尾は `\n\nBestBike` の1語のみ。

第4条は、送信者の氏名または名称・住所・苦情受付先の表示を義務づけている。
また第3条は、広告宣伝性のあるメールについてオプトアウトを義務づけている。

`COUPON_EXPIRY_REMINDER`（「期限が近いので使ってください」）は
取引の通知ではなく**利用促進＝広告宣伝**にあたるが、配信停止の手段が存在しなかった。

### 6.2 どう直したか

メールを2区分に分け、フッタを機械的に付与する。

```ts
export const MAIL_CLASS = {
  APPLICATION_RECEIVED:   MailClass.TRANSACTIONAL,
  STATUS_UPDATED:         MailClass.TRANSACTIONAL,
  ENROLLMENT_CONFIRMED:   MailClass.TRANSACTIONAL,
  COUPON_ISSUED:          MailClass.TRANSACTIONAL,
  COUPON_EXPIRY_REMINDER: MailClass.ADVERTISING,   // ← オプトアウト対象
  INVOICE_GENERATED:      MailClass.TRANSACTIONAL,
};
```

- 全メールに送信者名・住所・問合せ先（`MAIL_SENDER_*` 環境変数）
- `ADVERTISING` にはさらに配信停止URL
- 配信停止済みの宛先には**そもそも送らない**

```ts
if (mailClass === MailClass.ADVERTISING && (await this.hasOptedOut(to))) {
  this.logger.log(`suppressed advertising mail (${kind} → ${to}): recipient opted out`);
  return;
}
```

オプトアウト判定に失敗したときは**送らない側に倒している**。
誤送信のほうが法的リスクが大きいため。

配信停止URL（`/mypage/mail-settings`）は実際に動く画面として実装した。
リンク切れだと「受信拒否の通知先の表示」の要件を満たさなくなる。

---

## 7. 消費税法 第57条の4 — 適格請求書（インボイス制度）

### 7.1 何が問題だったか

`Invoice` テーブルが `totalAmount` しか持っていなかった。

```prisma
model Invoice {
  totalAmount Int      // ← 税抜？税込？ 区別がない
  ...
}
```

適格請求書の必須記載事項のうち、**5つが欠けていた**。

| 記載事項 | 旧実装 |
|---|---|
| 発行者の氏名または名称 | ❌ |
| 適格請求書発行事業者の登録番号 | ❌ |
| 取引年月日 | ⭕ `generatedAt` |
| 取引内容 | ⭕ 紹介料 |
| 税率ごとに区分して合計した対価の額および適用税率 | ❌ |
| 税率ごとに区分した消費税額等 | ❌ |
| 交付を受ける事業者の氏名または名称 | ⭕ `school` |

**要件を満たさない請求書を受け取った教習所は、仕入税額控除ができない。**
自社の問題ではなく、取引先に金銭的な不利益が出る。

もう1つ、[10 §H-3](10_code-review-bestbike-aht.md) の二重計上と重なる問題がある。

```ts
update: { totalAmount: { increment: total } },   // 交付済みの請求書を黙って増額
```

交付済みの適格請求書の訂正は、**修正した適格請求書の交付**であって、
元の書類を書き換えることではない。

### 7.2 どう直したか

```prisma
model Invoice {
  invoiceNo          String?  @unique
  registrationNumber String?          // T + 13桁。交付時点の値を凍結
  subtotalAmount     Int              // 税抜
  taxRate            Float            // 0.1
  taxAmount          Int              // 消費税額等
  totalAmount        Int              // 税込
  ...
}
```

- 登録番号が未設定／形式不正なら**請求書を発行しない**（400）
- 交付済み（`SENT` / `PAID`）への増額を**拒否**（409、修正インボイスへ誘導）
- 端数処理は**請求書単位で1回だけ**（明細ごとに丸めて合算しない）

```ts
export function taxBreakdown(subtotal: number, taxRate = CONSUMPTION_TAX_RATE): TaxBreakdown {
  const tax = Math.floor(subtotal * taxRate);
  return { subtotal, taxRate, tax, total: subtotal + tax };
}
```

端数処理はテストで固定した。**明細ごとに丸めると答えが変わる**ことを明示している。

```ts
it("端数処理は請求書単位で1回。明細ごとに丸めて合算した額とは一致しないことがある", () => {
  const perLine    = 3 * taxBreakdown(105).tax;  // 10 × 3 = 30
  const perInvoice = taxBreakdown(315).tax;      // 31
  expect(perInvoice).not.toBe(perLine);          // 制度上は後者が正
});
```

**既存データの移行**：旧 `totalAmount` は税抜合計だったので、
マイグレーションで `subtotalAmount` に移し、`totalAmount` を税込に読み替えている。

> **確認事項P（新規）**
> 適格請求書発行事業者の登録番号（T+13桁）。
> **未取得の場合、Phase 1 のリリース前に取得が必要。**
> 送客手数料は課税取引であり、登録がないと教習所側が仕入税額控除できない。
> 経過措置の適用可否も含めて税理士に確認すること。

---

## 8. 該当しないと判断した法令

判定を残しておかないと、次の担当者が同じ検討を最初からやり直すことになる。

### 8.1 資金決済法 — 前払式支払手段

**非該当。**

5,000円クーポンは前払式支払手段の3要件のうち **「対価を得て発行」を満たさない**。
入校という行為に対して**無償で**発行しており、利用者はクーポンの対価を支払っていない。
無償で発行される割引券は前払式支払手段にあたらない。

> ⚠️ **この判定が変わる条件**
> クーポンを販売する、購入者に付与する、他のポイントと交換可能にする、
> といった変更を入れた瞬間に該当しうる。
> 該当すると供託義務・報告義務が発生するため、
> **クーポンの取得経路を変える設計変更のときは必ずここを読み直すこと。**

### 8.2 古物営業法

**非該当。** 本システムは中古品の売買を扱わない。

### 8.3 職業安定法・労働者派遣法

**非該当。** 送客対象は教習であって雇用ではない。

### 8.4 割賦販売法

**現時点では非該当。** 本システムは決済を持たない（`PaymentPort.enabled = false`）。

> ⚠️ 教習料金の分割払いを本システムで扱うようになったら再検討が必要。

---

## 9. 実装した差分の一覧

`sho0922/bestbike-aht` に対する変更。

| 領域 | ファイル | 内容 |
|---|---|---|
| 法令定数 | `packages/shared/src/legal.ts` | **新規**。提供先定義・年齢・打消し表示・税計算・送信者情報 |
| DTO | `packages/shared/src/dto.ts` | 同意の分離、未成年判定、抱き合わせ防止 |
| スキーマ | `apps/api/prisma/schema.prisma` | `ConsentRecord` / `ThirdPartyProvisionLog` 追加、`Invoice` の税区分、親権者欄 |
| 移行 | `migrations/0003_legal_compliance/` | 列の RENAME（同意の値を保持）、税額のバックフィル、追記専用トリガ |
| 同意記録 | `modules/compliance/` | **新規**。同意・提供記録・撤回・オプトアウト |
| 申込 | `applications.service.ts` | 年齢検証、同意記録、提供記録、**教習所へのレスポンス最小化** |
| 入校確定 | `enrollment.service.ts` | 同意がなければ本体へ問い合わせない。見送りを監査に記録 |
| メール | `notifications/templates.ts`, `notifications.service.ts` | 送信者情報、打消し表示、配信停止の尊重 |
| 請求 | `referral-fees.service.ts` | 適格請求書の記載事項、交付済みの改変禁止、**二重計上の修正** |
| 画面 | `apply/page.tsx`, `mypage/mail-settings/page.tsx`, `components/benefit-terms.tsx` | 同意UI、配信設定、打消し表示 |
| テスト | `legal.test.ts`, `applications.service.spec.ts` ほか | 64件すべて通過 |

**検証状況**：`pnpm -r typecheck` 4パッケージすべて通過。
`pnpm -r test` 64件通過（shared 38 / integrations 8 / api 18）。
**DB を伴うマイグレーションと E2E は未実行**（本環境に PostgreSQL がないため）。

---

## 10. 残る確認事項

[01 要件定義書 §8](01_requirements.md) の A〜L に追加。

| # | 確認事項 | 誰に | 緊急度 |
|---|---|---|---|
| **M** | ベストBike連携に同意しない利用者にも申込を許すか（現実装は許す） | クライアント＋法務 | **高** |
| **N** | 親権者の同意は本人のチェックで足りるか。実地確認を運用に入れるか | クライアント | 中 |
| **O** | 「永久10%OFF」の表記を維持するか | 法務 | 中 |
| **P** | **適格請求書発行事業者の登録番号。未取得ならリリース前に取得が必要** | クライアント＋税理士 | **高** |
| Q | プライバシーポリシー・利用規約の本文（本PRは同意の取得と記録のみ。文面は未整備） | 法務 | **高** |
| R | 個人データの保存期間と削除方針（第22条：不要になったら遅滞なく消去） | 法務 | 中 |
| S | 漏洩時の報告体制（第26条：個人情報保護委員会への報告義務） | クライアント | 中 |

---

## 11. この文書の限界

私は弁護士でも税理士でもない。

ここに書いたのは、**日本の法令が一般にどう定めているかと、
実装がそれに対してどう見えるか**であって、法的な判断ではない。
とくに以下は必ず専門家に確認すること。

- §1.4 の「同意しない利用者にも申込を許す」という設計判断
- §5 の「永久」の語の適否
- §7 の適格請求書の記載事項が実務上十分か
- §8 の非該当判定（とくに資金決済法。クーポンの設計変更時は再判定が必要）

関連：[10 コードレビュー結果](10_code-review-bestbike-aht.md)、[05 非機能要件 §5](05_nonfunctional.md)
