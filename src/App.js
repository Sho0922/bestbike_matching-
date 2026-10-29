import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin, Search, ChevronRight, Check, Copy, Clock, Bell, Settings, Menu,
  Home, Bike, School, FileText, CheckCircle2, AlertCircle, ArrowRight, ArrowDown,
  Zap, Gift, Phone, Mail, User, Users, TrendingUp, Award, Percent, Globe,
  Plus, Trash2, GraduationCap, MessageSquare, Building2, ExternalLink,
  ClipboardList, Navigation2, Sparkles, Info, X, Pencil, Image as ImageIcon,
} from 'lucide-react';

/* ===========================================================================
 * ベストBike × 教習所マッチング — 動作プロトタイプ v1.1
 *
 * 企画資料（しょーくん宿題.pdf / チャッピー追加.pages.pdf）準拠。
 * 仕様は docs/ を参照。v1.0 からの変更点は docs/09_pdf-reconciliation.md。
 *
 * このプロトタイプの中核：
 *   お金と特典が動くのは「卒業」ボタン1つだけ。
 *   教習所ダッシュボードで 入校 → 卒業 を押すと、
 *   マイページにクーポン2種が実際に発行される。
 * ======================================================================== */

// ===== マスタ =====
const DESIRED_LICENSES = {
  moto_mt: { label: '普通二輪MT', minAge: 16 },
  moto_at: { label: '普通二輪AT', minAge: 16 },
  large_moto_mt: { label: '大型二輪MT', minAge: 18 },
  large_moto_at: { label: '大型二輪AT', minAge: 18 },
  small_moto_mt: { label: '小型二輪MT', minAge: 16 },
  small_moto_at: { label: '小型二輪AT', minAge: 16 },
};

const HELD_LICENSES = {
  none: 'なし',
  moped: '原付',
  small_moto: '小型二輪',
  moto: '普通二輪',
  large_moto: '大型二輪',
  car: '普通自動車',
  other: 'その他',
};

const STATUS = {
  provisional: { label: '仮申込', color: 'slate' },
  entry_review: { label: '入校確認中', color: 'amber' },
  entry_confirmed: { label: '入校確定', color: 'sky' },
  in_training: { label: '教習中', color: 'sky' },
  graduated: { label: '卒業', color: 'emerald' },
  cancelled: { label: 'キャンセル', color: 'slate' },
};

const STATUS_ORDER = ['provisional', 'entry_review', 'entry_confirmed', 'in_training', 'graduated'];

const yen = (n) => `${n.toLocaleString()}円`;

// ===== ダミーデータ =====
const REGIONS = [
  {
    name: '関東',
    prefectures: [
      { slug: 'tokyo', name: '東京都', count: 12 },
      { slug: 'kanagawa', name: '神奈川県', count: 8 },
      { slug: 'saitama', name: '埼玉県', count: 4 },
      { slug: 'chiba', name: '千葉県', count: 3 },
      { slug: 'ibaraki', name: '茨城県', count: 0 },
      { slug: 'tochigi', name: '栃木県', count: 0 },
      { slug: 'gunma', name: '群馬県', count: 0 },
    ],
  },
  {
    name: '中部',
    prefectures: [
      { slug: 'aichi', name: '愛知県', count: 2 },
      { slug: 'shizuoka', name: '静岡県', count: 1 },
      { slug: 'nagano', name: '長野県', count: 0 },
    ],
  },
  {
    name: '近畿',
    prefectures: [
      { slug: 'osaka', name: '大阪府', count: 3 },
      { slug: 'kyoto', name: '京都府', count: 0 },
      { slug: 'hyogo', name: '兵庫県', count: 1 },
    ],
  },
];

const CITIES = {
  tokyo: [
    { slug: 'setagaya', name: '世田谷区', count: 2 },
    { slug: 'fuchu', name: '府中市', count: 0 },
    { slug: 'machida', name: '町田市', count: 0 },
    { slug: 'nerima', name: '練馬区', count: 0 },
  ],
  kanagawa: [
    { slug: 'fujisawa', name: '藤沢市', count: 0 },
    { slug: 'yokohama', name: '横浜市西区', count: 0 },
  ],
};

const SCHOOLS = [
  {
    slug: 'setakyo',
    name: 'せたがや自動車学校',
    prefecture: '東京都',
    prefSlug: 'tokyo',
    city: '世田谷区',
    citySlug: 'setagaya',
    address: '東京都世田谷区粕谷1-14-14',
    phone: '03-3302-3141',
    email: 'info@setakyo1960.example.jp',
    website: 'https://setakyo1960.example.jp/motorbike/',
    features: '女性教官が多数在籍で女性も安心です',
    notes: '駐輪場あり。学生割引の設定があります。',
    freeText:
      '当校は1960年創業の二輪教習専門校です。\n少人数制で、一人ひとりのペースに合わせた教習を心がけています。\n初めてバイクに触れる方も、経験者の方も歓迎します。',
    thumb: 'from-sky-400 to-blue-600',
    photoCount: 4,
    tuition: [
      { desired: 'moto_mt', held: 'none', price: 178200, taxIncluded: true, note: '' },
      { desired: 'moto_mt', held: 'car', price: 152750, taxIncluded: true, note: '学科免除' },
      { desired: 'moto_at', held: 'car', price: 142000, taxIncluded: true, note: '学科免除' },
      { desired: 'large_moto_mt', held: 'moto', price: 98000, taxIncluded: true, note: '' },
      { desired: 'small_moto_at', held: 'car', price: 118000, taxIncluded: true, note: '' },
    ],
    extras: [
      { name: '入学金', price: 22000, taxIncluded: true, note: '' },
      { name: '卒業検定料', price: 5500, taxIncluded: true, note: '再検定は別途5,500円' },
      { name: '教材費', price: 3300, taxIncluded: true, note: '' },
    ],
  },
  {
    slug: 'komazawa',
    name: '駒沢モータースクール',
    prefecture: '東京都',
    prefSlug: 'tokyo',
    city: '世田谷区',
    citySlug: 'setagaya',
    address: '東京都世田谷区駒沢2-8-1',
    phone: '03-3421-XXXX',
    email: 'info@komazawa-ms.example.jp',
    website: 'https://komazawa-ms.example.jp/',
    features: '夜間教習21時まで。社会人の方に人気です',
    notes: '送迎バスあり（渋谷・三軒茶屋方面）',
    freeText: '平日夜間・土日の教習枠を多く確保しています。\nお仕事帰りにも通いやすい教習所です。',
    thumb: 'from-orange-400 to-red-500',
    photoCount: 3,
    tuition: [
      { desired: 'moto_mt', held: 'none', price: 185000, taxIncluded: true, note: '' },
      { desired: 'moto_mt', held: 'car', price: 159500, taxIncluded: true, note: '' },
      { desired: 'large_moto_mt', held: 'moto', price: 105000, taxIncluded: true, note: '' },
    ],
    extras: [
      { name: '入学金', price: 25000, taxIncluded: true, note: '' },
      { name: '卒業検定料', price: 6600, taxIncluded: true, note: '' },
    ],
  },
];

// ===== 共通コンポーネント =====
const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base sm:text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500';

const BrandLogo = ({ size = 'md', dark = false }) => {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
        <Bike className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      <span className={`font-black tracking-tight ${sizes[size]}`}>
        <span className={dark ? 'text-white' : 'text-slate-900'}>ベスト</span>
        <span className="text-sky-600">Bike</span>
        <span className="text-slate-400 text-xs ml-1 font-semibold">×教習所</span>
      </span>
    </div>
  );
};

const Pill = ({ children, color = 'sky' }) => {
  const colors = {
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
};

const StatusPill = ({ status }) => <Pill color={STATUS[status].color}>{STATUS[status].label}</Pill>;

const Breadcrumb = ({ items, onNavigate }) => (
  <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
    {items.map((item, i) => (
      <React.Fragment key={item.label}>
        {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
        {item.to ? (
          <button onClick={() => onNavigate(item.to)} className="hover:text-sky-600 hover:underline">
            {item.label}
          </button>
        ) : (
          <span className="text-slate-900 font-semibold">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

const SiteHeader = ({ onNavigate, right }) => (
  <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      <button onClick={() => onNavigate('landing')}>
        <BrandLogo />
      </button>
      <div className="flex items-center gap-4 text-sm">
        {right || (
          <>
            <button onClick={() => onNavigate('areaPref')} className="hidden md:inline font-semibold text-slate-700">
              教習所を探す
            </button>
            <button onClick={() => onNavigate('mypage')} className="font-semibold text-slate-700">
              マイページ
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);

const SectionCard = ({ title, icon: Icon, children, action }) => (
  <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 className="font-bold text-lg flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-slate-400" />}
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-sm font-bold mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {hint && <span className="text-xs text-slate-500 ml-2 font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

// 料金の解決：希望免許 × 保有免許
const findTuition = (school, desired, held) =>
  school.tuition.find((t) => t.desired === desired && t.held === held) || null;

const cheapestTuition = (school, held) => {
  const rows = held ? school.tuition.filter((t) => t.held === held) : school.tuition;
  if (rows.length === 0) return null;
  return rows.reduce((min, t) => (t.price < min.price ? t : min), rows[0]);
};

const extrasTotal = (school) => school.extras.reduce((sum, e) => sum + e.price, 0);

// ===== 画面1: トップ =====
const ScreenLanding = ({ onNavigate }) => (
  <div className="bg-white min-h-full">
    <SiteHeader onNavigate={onNavigate} />

    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(56,189,248,0.3), transparent 50%), radial-gradient(circle at 80% 70%, rgba(251,146,60,0.2), transparent 50%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1 mb-6">
              <Zap className="w-4 h-4 text-orange-300" />
              <span className="text-xs font-bold text-orange-200">ベストBike 特別提携</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              免許を取ったら、
              <br />
              バイクライフは
              <br />
              <span className="text-sky-400">もっとおトクに。</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
              ベストBike提携教習所を<strong className="text-white">卒業</strong>すると、
              <br className="hidden sm:block" />
              ベストBikeで使えるクーポンを2種類お渡しします。
            </p>
            <button
              onClick={() => onNavigate('areaPref')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3.5 rounded-lg inline-flex w-full sm:w-auto justify-center items-center gap-2"
            >
              教習所を探す <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-orange-300" />
              <span className="font-bold text-lg">卒業でもらえる特典</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-black text-sm text-orange-200">1</span>
                </div>
                <div>
                  <div className="text-xs text-slate-300">初回レンタル</div>
                  <div className="font-bold text-xl">5,000円OFF</div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-sky-500/30 flex items-center justify-center flex-shrink-0">
                  <Percent className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <div className="text-xs text-slate-300">2回目以降ずっと</div>
                  <div className="font-bold text-xl">永久10%OFF</div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="text-xs text-slate-300">シェアリングオーナーなら</div>
                  <div className="font-bold text-xl">報酬額5%アップ</div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              ※ 特典は教習所を<strong className="text-slate-200">卒業した時点</strong>で発行されます。
              申込・入校の時点では発行されません。適用条件は利用規約をご確認ください。
            </p>
          </div>
        </div>
      </div>
    </section>

    <section className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6">
      <h2 className="text-2xl sm:text-3xl font-black text-center mb-3">たった3ステップ</h2>
      <p className="text-center text-slate-500 mb-8 sm:mb-12">教習所さがしから、特典の受け取りまで</p>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { n: '01', title: '教習所を選ぶ', desc: 'お住まいの都道府県・市区町村から、通いやすい提携教習所を選択', icon: MapPin },
          { n: '02', title: '仮申込をする', desc: '一度の入力でベストBikeの無料会員にも自動で連携されます', icon: FileText },
          { n: '03', title: '卒業で特典を受け取る', desc: '教習所を卒業すると、クーポン2種がメールとマイページに届きます', icon: GraduationCap },
        ].map((step) => (
          <div key={step.n} className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition">
            <div className="text-6xl font-black text-sky-100 absolute top-4 right-4">{step.n}</div>
            <step.icon className="w-10 h-10 text-sky-600 mb-4 relative" strokeWidth={1.5} />
            <h3 className="font-bold text-xl mb-2 relative">{step.title}</h3>
            <p className="text-sm text-slate-600 relative">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-black mb-2">エリアから探す</h2>
        <p className="text-slate-600 mb-8 text-sm">都道府県 → 市区町村の順に絞り込めます</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {REGIONS[0].prefectures.filter((p) => p.count > 0).map((p) => (
            <button
              key={p.slug}
              onClick={() => onNavigate('areaPref')}
              className="bg-white border border-slate-300 hover:border-sky-400 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {p.name} <span className="text-slate-400 font-normal">({p.count})</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => onNavigate('areaPref')}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg px-8 py-4 rounded-xl inline-flex w-full sm:w-auto justify-center items-center gap-2"
        >
          すべてのエリアを見る <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  </div>
);

// ===== 画面2: 都道府県一覧 =====
const ScreenAreaPref = ({ onNavigate, setPref }) => (
  <div className="bg-slate-50 min-h-full">
    <SiteHeader onNavigate={onNavigate} />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumb items={[{ label: 'ホーム', to: 'landing' }, { label: '教習所を探す' }]} onNavigate={onNavigate} />
      <h1 className="text-2xl sm:text-3xl font-black mt-3 mb-2">都道府県から探す</h1>
      <p className="text-sm text-slate-500 mb-8">
        通える範囲の教習所をお選びください。数字は提携教習所の掲載件数です。
      </p>

      <div className="space-y-6">
        {REGIONS.map((region) => (
          <div key={region.name} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <h2 className="font-bold text-lg mb-4">{region.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {region.prefectures.map((p) => {
                const disabled = p.count === 0;
                return (
                  <button
                    key={p.slug}
                    disabled={disabled}
                    onClick={() => {
                      setPref(p);
                      onNavigate('areaCity');
                    }}
                    className={`flex items-center justify-between border rounded-lg px-3 sm:px-4 py-3 text-sm text-left transition ${
                      disabled
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 hover:border-sky-400 hover:bg-sky-50 font-semibold'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={disabled ? '' : 'text-slate-400 font-normal'}>{p.count}件</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm text-sky-900 flex gap-2">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>現在地の取得は行いません。電車での通学を想定し、エリアを選んで探す方式にしています。</div>
      </div>
    </div>
  </div>
);

// ===== 画面3: 市区町村一覧 =====
const ScreenAreaCity = ({ onNavigate, pref, setCity }) => {
  const cities = CITIES[pref.slug] || [];
  return (
    <div className="bg-slate-50 min-h-full">
      <SiteHeader onNavigate={onNavigate} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumb
          items={[
            { label: 'ホーム', to: 'landing' },
            { label: '教習所を探す', to: 'areaPref' },
            { label: pref.name },
          ]}
          onNavigate={onNavigate}
        />
        <h1 className="text-2xl sm:text-3xl font-black mt-3 mb-2">{pref.name}の教習所</h1>
        <p className="text-sm text-slate-500 mb-8">市区町村を選んでください</p>

        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {cities.map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                setCity(c);
                onNavigate('list');
              }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 text-left"
            >
              <span className="font-semibold">{c.name}</span>
              <span className="flex items-center gap-2 text-sm text-slate-400">
                {c.count}件 <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          ))}
          {cities.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-400">このエリアの掲載準備中です</div>
          )}
        </div>

        <button
          onClick={() => {
            setCity({ slug: 'all', name: 'すべて', count: 0 });
            onNavigate('list');
          }}
          className="mt-4 text-sm text-sky-600 font-semibold hover:underline"
        >
          {pref.name}のすべての教習所を見る →
        </button>
      </div>
    </div>
  );
};

// ===== 画面4: 教習所一覧 =====
const ScreenList = ({ onNavigate, pref, city, setSchool, heldFilter, setHeldFilter }) => {
  const schools = SCHOOLS.filter(
    (s) => s.prefSlug === pref.slug && (city.slug === 'all' || s.citySlug === city.slug)
  );

  return (
    <div className="bg-slate-50 min-h-full">
      <SiteHeader onNavigate={onNavigate} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Breadcrumb
          items={[
            { label: 'ホーム', to: 'landing' },
            { label: '教習所を探す', to: 'areaPref' },
            { label: pref.name, to: 'areaCity' },
            { label: city.name },
          ]}
          onNavigate={onNavigate}
        />
        <h1 className="text-2xl font-black mt-3 mb-4">
          {city.name === 'すべて' ? pref.name : city.name}の教習所 {schools.length}件
        </h1>

        {/* スマホは2列のグリッド（保有免許だけ全幅）、sm以上は横並び */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="held-filter">
              現在お持ちの免許
            </label>
            <select
              id="held-filter"
              value={heldFilter}
              onChange={(e) => setHeldFilter(e.target.value)}
              className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-base sm:text-sm bg-white"
            >
              <option value="">指定しない</option>
              {Object.entries(HELD_LICENSES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="desired-filter">
              希望免許
            </label>
            <select id="desired-filter" className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-base sm:text-sm bg-white">
              <option>すべて</option>
              {Object.entries(DESIRED_LICENSES).map(([k, v]) => (
                <option key={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="sort">並び替え</label>
            <select id="sort" className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-base sm:text-sm bg-white">
              <option>価格が安い順</option>
              <option>新着順</option>
            </select>
          </div>
          <div className="col-span-2 text-xs text-slate-500 flex items-start sm:items-center gap-1.5 sm:ml-auto">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px sm:mt-0" />
            保有免許を選ぶと、その条件での料金が表示されます
          </div>
        </div>

        <div className="space-y-4">
          {schools.map((school) => {
            const price = cheapestTuition(school, heldFilter || null);
            return (
              <button
                key={school.slug}
                onClick={() => {
                  setSchool(school);
                  onNavigate('detail');
                }}
                className="w-full text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-sky-300 transition"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className={`sm:w-44 h-32 sm:h-auto bg-gradient-to-br ${school.thumb} flex items-center justify-center flex-shrink-0`}>
                    <School className="w-12 h-12 text-white/80" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 p-4 sm:p-5">
                    <h3 className="font-bold text-lg mb-2">{school.name}</h3>
                    <div className="space-y-1 text-xs text-slate-600 mb-3">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                        {school.address}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {school.phone}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sky-600 truncate">{school.website.replace('https://', '')}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-700 mb-3">
                      特色：{school.features}
                    </div>
                    {price && (
                      <div className="flex items-end justify-between gap-3">
                        <div className="text-xs text-slate-500">
                          {DESIRED_LICENSES[price.desired].label}
                          <span className="text-slate-400">（{HELD_LICENSES[price.held]}をお持ちの方）</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-black text-xl text-sky-700">{yen(price.price)}</div>
                          <div className="text-[11px] text-slate-400">{price.taxIncluded ? '税込' : '税別'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {schools.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
              <p className="font-bold mb-1">該当する教習所が見つかりませんでした</p>
              <p className="text-sm text-slate-500 mb-4">近隣の市区町村もご確認ください</p>
              <button onClick={() => onNavigate('areaCity')} className="text-sky-600 font-semibold text-sm">
                エリアを選び直す
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== 画面5: 教習所詳細 =====
const ScreenDetail = ({ onNavigate, school, heldFilter, setHeldFilter }) => {
  const extras = extrasTotal(school);
  const highlighted = heldFilter || null;

  return (
    <div className="bg-slate-50 min-h-full pb-24 lg:pb-0">
      <SiteHeader onNavigate={onNavigate} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Breadcrumb
          items={[
            { label: 'ホーム', to: 'landing' },
            { label: school.prefecture, to: 'areaPref' },
            { label: school.city, to: 'list' },
            { label: school.name },
          ]}
          onNavigate={onNavigate}
        />

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${i === 0 ? 'col-span-3 sm:col-span-2 sm:row-span-2 h-48 sm:h-64' : 'h-24 sm:h-32'} rounded-xl overflow-hidden flex items-center justify-center ${
                i < school.photoCount
                  ? `bg-gradient-to-br ${school.thumb}`
                  : 'bg-slate-100 border border-dashed border-slate-300'
              }`}
            >
              {i < school.photoCount ? (
                <School className="w-10 h-10 text-white/70" strokeWidth={1.5} />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-300" />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 min-w-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">{school.name}</h1>
              <Pill color="sky">{school.city}</Pill>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-8 h-8 text-orange-500 flex-shrink-0" />
                <div>
                  <div className="font-black text-lg text-orange-900">この教習所を卒業すると</div>
                  <div className="text-sm text-orange-800 mt-1">
                    ベストBikeで使える<strong>クーポン2種</strong>（初回5,000円OFF ／ 2回目以降 永久10%OFF）を発行します。
                    <br />
                    <span className="text-xs">※ 特典は卒業時に発行されます。仮申込・入校の時点では発行されません。</span>
                  </div>
                </div>
              </div>
            </div>

            <SectionCard title="基本情報" icon={Building2}>
              <dl className="text-sm space-y-2.5">
                {[
                  { label: '所在地', value: school.address, Icon: MapPin },
                  { label: '電話番号', value: school.phone, Icon: Phone },
                  { label: 'メールアドレス', value: school.email, Icon: Mail },
                  { label: 'ホームページ', value: school.website, Icon: Globe },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex flex-wrap sm:flex-nowrap gap-x-3 gap-y-0.5">
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <dt className="text-xs sm:text-sm sm:w-28 text-slate-500 flex-shrink-0 self-center sm:self-auto">{label}</dt>
                    <dd className="w-full sm:w-auto sm:flex-1 pl-7 sm:pl-0 break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>

            <SectionCard title="この教習所について" icon={Sparkles}>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1">特色</div>
                  <p>{school.features}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1">備考</div>
                  <p>{school.notes}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-1">教習所からのご案内</div>
                  <p className="whitespace-pre-wrap text-slate-700">{school.freeText}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="料金表"
              icon={ClipboardList}
              action={
                <select
                  value={heldFilter}
                  onChange={(e) => setHeldFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-base sm:text-xs bg-white"
                  aria-label="保有免許で絞り込む"
                >
                  <option value="">保有免許で絞り込む</option>
                  {Object.entries(HELD_LICENSES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              }
            >
              <div className="mb-6">
                <h3 className="text-sm font-bold mb-2">教習費用</h3>
                {/* スマホ：1行を1枚のカードにして横スクロールをなくす */}
                <ul className="sm:hidden border-y border-slate-100 divide-y divide-slate-100">
                  {school.tuition.map((t) => {
                    const match = highlighted && t.held === highlighted;
                    const dim = highlighted && !match;
                    return (
                      <li
                        key={`${t.desired}-${t.held}`}
                        className={`py-3 ${dim ? 'opacity-30' : ''} ${match ? 'bg-sky-50 -mx-4 px-4' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm">{DESIRED_LICENSES[t.desired].label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              現在お持ちの免許：{HELD_LICENSES[t.held]}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 whitespace-nowrap">
                            <span className="font-black">{yen(t.price)}</span>
                            <span className="text-[11px] text-slate-400 ml-1">{t.taxIncluded ? '税込' : '税別'}</span>
                          </div>
                        </div>
                        {t.note && <div className="text-xs text-slate-500 mt-1">備考：{t.note}</div>}
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th scope="col" className="text-left p-2.5 font-semibold">希望免許</th>
                        <th scope="col" className="text-left p-2.5 font-semibold">現在お持ちの免許</th>
                        <th scope="col" className="text-right p-2.5 font-semibold">料金</th>
                        <th scope="col" className="text-left p-2.5 font-semibold">備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {school.tuition.map((t) => {
                        const match = highlighted && t.held === highlighted;
                        const dim = highlighted && !match;
                        return (
                          <tr
                            key={`${t.desired}-${t.held}`}
                            className={`border-t border-slate-100 ${dim ? 'opacity-30' : ''} ${match ? 'bg-sky-50' : ''}`}
                          >
                            <td className="p-2.5 font-semibold">{DESIRED_LICENSES[t.desired].label}</td>
                            <td className="p-2.5 text-slate-600">{HELD_LICENSES[t.held]}</td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <span className="font-black">{yen(t.price)}</span>
                              <span className="text-[11px] text-slate-400 ml-1">{t.taxIncluded ? '税込' : '税別'}</span>
                            </td>
                            <td className="p-2.5 text-xs text-slate-500">{t.note || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">別途費用</h3>
                <ul className="sm:hidden border-y border-slate-100 divide-y divide-slate-100 text-sm">
                  {school.extras.map((e) => (
                    <li key={e.name} className="py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold">{e.name}</span>
                        <span className="whitespace-nowrap">
                          <span className="font-bold">{yen(e.price)}</span>
                          <span className="text-[11px] text-slate-400 ml-1">{e.taxIncluded ? '税込' : '税別'}</span>
                        </span>
                      </div>
                      {e.note && <div className="text-xs text-slate-500 mt-0.5">{e.note}</div>}
                    </li>
                  ))}
                  <li className="py-2.5 -mx-4 px-4 bg-slate-50 flex items-center justify-between gap-3">
                    <span className="font-bold">別途費用 合計</span>
                    <span className="font-black whitespace-nowrap">{yen(extras)}</span>
                  </li>
                </ul>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th scope="col" className="text-left p-2.5 font-semibold">詳細</th>
                        <th scope="col" className="text-right p-2.5 font-semibold">費用</th>
                        <th scope="col" className="text-left p-2.5 font-semibold">備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {school.extras.map((e) => (
                        <tr key={e.name} className="border-t border-slate-100">
                          <td className="p-2.5 font-semibold">{e.name}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <span className="font-bold">{yen(e.price)}</span>
                            <span className="text-[11px] text-slate-400 ml-1">{e.taxIncluded ? '税込' : '税別'}</span>
                          </td>
                          <td className="p-2.5 text-xs text-slate-500">{e.note || '—'}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td className="p-2.5 font-bold">別途費用 合計</td>
                        <td className="p-2.5 text-right font-black whitespace-nowrap">{yen(extras)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  ※ 表示は目安です。実際の費用は教習所にご確認ください。
                </p>
              </div>
            </SectionCard>

            <SectionCard title="アクセス" icon={MapPin}>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-56 relative">
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(148,163,184,0.15) 28px, rgba(148,163,184,0.15) 29px),
                      repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(148,163,184,0.15) 28px, rgba(148,163,184,0.15) 29px),
                      linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #dcfce7 100%)`,
                  }}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                  <div className="bg-red-500 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-semibold">
                  Google 地図表示エリア
                </div>
              </div>
              <p className="text-sm mt-3">{school.address}</p>
            </SectionCard>
          </div>

          <div>
            <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-5 sticky top-20 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">この教習所に</div>
              <div className="text-xl font-black mb-4">申し込む</div>
              <div className="bg-sky-50 rounded-lg p-3 mb-4 text-xs">
                <div className="font-bold text-sky-900 mb-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  ベストBike経由のメリット
                </div>
                <ul className="text-sky-800 space-y-0.5">
                  <li>・卒業でクーポン2種を発行</li>
                  <li>・一度の入力で無料会員に自動連携</li>
                  <li>・マイページで進捗を確認できる</li>
                </ul>
              </div>
              <button
                onClick={() => onNavigate('apply')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl mb-2"
              >
                仮申込をする
              </button>
              <button
                onClick={() => onNavigate('inquiry')}
                className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl text-sm"
              >
                問合せる
              </button>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
                仮申込の時点では費用は発生しません
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 md:left-60 bg-white border-t border-slate-200 p-3 flex gap-2 z-30">
        <button
          onClick={() => onNavigate('inquiry')}
          className="flex-1 border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl text-sm"
        >
          問合せる
        </button>
        <button onClick={() => onNavigate('apply')} className="flex-[2] bg-orange-500 text-white font-bold py-3 rounded-xl">
          仮申込をする
        </button>
      </div>
    </div>
  );
};

// ===== 画面6: 仮申込フォーム =====
const CONSENTS = [
  '利用規約・キャンセルポリシーに同意する',
  'プライバシーポリシーに同意する',
  '氏名・住所・生年月日・連絡先を当該教習所に提供することに同意する',
  'ベストBikeの無料会員として登録されることに同意する',
];

const ScreenApply = ({ onNavigate, school }) => {
  const [held, setHeld] = useState('car');
  const [desired, setDesired] = useState('moto_mt');
  const [agreed, setAgreed] = useState([false, false, false, false]);

  const tuition = findTuition(school, desired, held);
  const allAgreed = agreed.every(Boolean);
  const canSubmit = allAgreed && Boolean(tuition);

  const toggle = (i) => setAgreed((a) => a.map((v, j) => (j === i ? !v : v)));

  return (
    <div className="bg-slate-50 min-h-full">
      <SiteHeader
        onNavigate={onNavigate}
        right={<button onClick={() => onNavigate('detail')} className="text-sm text-slate-500">← 戻る</button>}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {['情報入力', '確認', '完了'].map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i + 1}
                </div>
                <div className={`text-xs mt-1 font-semibold ${i === 0 ? 'text-sky-700' : 'text-slate-400'}`}>{label}</div>
              </div>
              {i < 2 && <div className="w-10 sm:w-16 h-0.5 bg-slate-200 -mt-5" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-2xl p-4 sm:p-5 mb-4 flex items-center gap-3">
          <Sparkles className="w-8 h-8 flex-shrink-0" />
          <div className="font-bold text-base sm:text-lg">一度で登録完了！ベストBikeでの無料会員に自動連携致します！</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-4">
          <h1 className="text-2xl font-black mb-1">仮申込フォーム</h1>
          <div className="text-sm text-slate-500 mb-6">{school.name}</div>

          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 mb-6 border border-slate-200">
            <div className={`w-12 h-12 bg-gradient-to-br ${school.thumb} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <School className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{school.name}</div>
              <div className="text-xs text-slate-500">{school.address}</div>
            </div>
          </div>

          <div className="space-y-5">
            <Field label="氏名" required>
              <input defaultValue="佐藤 翔" className={inputCls} />
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="郵便番号" required>
                <input defaultValue="157-0063" className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="住所" required hint="郵便番号から自動補完">
                  <input defaultValue="東京都世田谷区粕谷1-2-3" className={inputCls} />
                </Field>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="生年月日" required>
                <input type="date" defaultValue="1992-09-22" className={inputCls} />
              </Field>
              <Field label="電話番号" required>
                <input defaultValue="090-1234-5678" className={inputCls} />
              </Field>
            </div>

            <Field label="メールアドレス" required hint="ベストBike会員として連携されます">
              <input defaultValue="sho@baller.inc" className={inputCls} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="所持免許" required>
                <select value={held} onChange={(e) => setHeld(e.target.value)} className={inputCls}>
                  {Object.entries(HELD_LICENSES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="希望免許" required>
                <select value={desired} onChange={(e) => setDesired(e.target.value)} className={inputCls}>
                  {Object.entries(DESIRED_LICENSES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {tuition ? (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                <div className="text-xs font-bold text-sky-900 mb-2">選択中のコース</div>
                <div className="flex items-end justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-bold">{DESIRED_LICENSES[desired].label}</div>
                    <div className="text-xs text-sky-800">{HELD_LICENSES[held]}をお持ちの方</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-2xl text-sky-800">{yen(tuition.price)}</div>
                    <div className="text-[11px] text-sky-700">
                      {tuition.taxIncluded ? '税込' : '税別'} ＋ 別途費用 {yen(extrasTotal(school))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  この教習所には「{DESIRED_LICENSES[desired].label} × {HELD_LICENSES[held]}」の料金設定がありません。
                  組み合わせを変更してください。
                </div>
              </div>
            )}

            <Field label="教習所からのご案内方法" required>
              <select defaultValue="email" className={inputCls}>
                <option value="phone">電話</option>
                <option value="email">メール</option>
                <option value="other">その他</option>
              </select>
            </Field>

            <Field label="教習所への連絡事項等">
              <textarea rows={3} defaultValue="平日の夜に通いたいです。" className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5 space-y-2.5">
            {CONSENTS.map((text, i) => (
              <label key={text} className="flex gap-2.5 text-sm sm:text-xs text-slate-700 cursor-pointer items-start">
                <input
                  type="checkbox"
                  checked={agreed[i]}
                  onChange={() => toggle(i)}
                  className="mt-0.5 w-5 h-5 sm:w-4 sm:h-4 accent-sky-600 flex-shrink-0"
                />
                <span>
                  {text}
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
            ))}
          </div>

          <button
            disabled={!canSubmit}
            onClick={() => onNavigate('complete')}
            className={`w-full font-bold py-3.5 rounded-xl mt-6 ${
              canSubmit ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            規約に同意して仮申込をする
          </button>
          {!allAgreed && (
            <p className="text-xs text-slate-500 text-center mt-2">すべての項目に同意すると送信できます</p>
          )}
        </div>

        <div className="text-xs text-slate-500 text-center">
          仮申込の時点では費用は発生しません。特典（クーポン）は<strong>卒業時</strong>に発行されます。
        </div>
      </div>
    </div>
  );
};

// ===== 画面7: 仮申込完了 =====
const ScreenComplete = ({ onNavigate, school }) => (
  <div className="bg-slate-50 min-h-full">
    <SiteHeader onNavigate={onNavigate} right={<span />} />
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center mb-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" strokeWidth={2} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-2">仮申込を受け付けました</h1>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          {school.name}に仮申込を送信しました。
          <br />
          教習所側で内容を確認後、ご登録の方法でご連絡が届きます。
          <br />
          あわせて、ベストBikeの無料会員登録も完了しています。
        </p>

        <div className="bg-slate-50 rounded-xl p-4 text-left text-sm mb-6">
          <div className="font-bold mb-1 text-xs text-slate-500">申込番号</div>
          <div className="font-mono text-lg">BB-EDU-2026-08041438</div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-orange-900">ここからの流れ</span>
          </div>
          <div className="space-y-2 text-sm text-orange-900">
            {[
              '教習所が申込を確認（通常1〜2営業日）',
              '入校日の調整・ご連絡',
              '入校 → 教習',
              '教習所が卒業を登録 → クーポン2種が自動発行',
            ].map((t, i) => (
              <div key={t} className="flex gap-2">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {i + 1}
                </div>
                <div className={i === 3 ? 'font-bold' : ''}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => onNavigate('mypage')} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl">
          マイページで状況を確認
        </button>
        <button onClick={() => onNavigate('landing')} className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl">
          トップに戻る
        </button>
      </div>
    </div>
  </div>
);

// ===== 画面8: 問合せ =====
const ScreenInquiry = ({ onNavigate, school }) => {
  const [sent, setSent] = useState(false);
  return (
    <div className="bg-slate-50 min-h-full">
      <SiteHeader
        onNavigate={onNavigate}
        right={<button onClick={() => onNavigate('detail')} className="text-sm text-slate-500">← 戻る</button>}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {sent ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
            <MessageSquare className="w-14 h-14 text-emerald-500 mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="text-2xl font-black mb-2">問合せを送信しました</h1>
            <p className="text-sm text-slate-600 mb-6">
              {school.name}にお問合せを送信しました。
              <br />
              ご登録のご連絡先に、教習所から直接ご返信があります。
            </p>
            <button onClick={() => onNavigate('detail')} className="text-sky-600 font-semibold text-sm">
              教習所詳細に戻る
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <h1 className="text-2xl font-black mb-1">問合せ</h1>
            <div className="text-sm text-slate-500 mb-6">{school.name}</div>

            <div className="space-y-5">
              <Field label="問合せの種類" required>
                <select className={inputCls}>
                  <option>教習全般</option>
                  <option>料金や支払方法</option>
                  <option>教習車</option>
                  <option>施設や駐車場</option>
                  <option>その他</option>
                </select>
              </Field>
              <Field label="氏名" required>
                <input defaultValue="佐藤 翔" className={inputCls} />
              </Field>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  電話番号・メールアドレスのいずれか一方は必須です
                </p>
                <Field label="電話番号">
                  <input defaultValue="090-1234-5678" className={inputCls} />
                </Field>
                <Field label="メールアドレス">
                  <input defaultValue="sho@baller.inc" className={inputCls} />
                </Field>
              </div>
              <Field label="問合せ内容" required>
                <textarea rows={5} defaultValue="分割払いは可能でしょうか。" className={`${inputCls} resize-none`} />
              </Field>
            </div>

            <button
              onClick={() => setSent(true)}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl mt-6"
            >
              問合せを送信する
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">お問合せは教習所に直接送信されます</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== 画面9: マイページ =====
const TIMELINE = [
  { key: 'provisional', label: '仮申込', date: '2026/08/04 14:38' },
  { key: 'entry_review', label: '入校確認中', date: '2026/08/05 10:15' },
  { key: 'entry_confirmed', label: '入校確定', date: '2026/08/06 14:00' },
  { key: 'in_training', label: '教習中', date: '2026/08/20 09:00' },
  { key: 'graduated', label: '卒業・特典発行', date: '2026/09/28 16:30' },
];

const ScreenMypage = ({ onNavigate, school, status, coupons }) => (
  <div className="bg-slate-50 min-h-full">
    <SiteHeader
      onNavigate={onNavigate}
      right={
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-slate-500" />
          <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold text-sm">佐</div>
        </div>
      }
    />

    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black mb-6">マイページ</h1>

      {status === 'graduated' && coupons && (
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-2xl p-5 sm:p-6 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 opacity-10">
            <GraduationCap className="w-44 h-44" strokeWidth={1} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-orange-300" />
              <span className="text-sm font-bold text-orange-300">ご卒業おめでとうございます！</span>
            </div>
            <h2 className="text-xl font-black mb-5">ベストBikeからの卒業祝いです</h2>

            <div className="space-y-3">
              {coupons.map((c) => (
                <div key={c.code} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <div className="text-xs text-slate-300">{c.subtitle}</div>
                      <div className="font-bold text-lg">{c.title}</div>
                    </div>
                    <button className="bg-white text-slate-900 font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs flex-shrink-0">
                      <Copy className="w-3.5 h-3.5" />
                      コピー
                    </button>
                  </div>
                  <div className="font-mono text-lg sm:text-xl font-black tracking-wider break-all">{c.code}</div>
                  <div className="text-[11px] text-slate-300 mt-1.5">
                    {c.expires ? `有効期限 ${c.expires}` : '有効期限なし'} ／ {c.usage}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-emerald-500/15 border border-emerald-400/30 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    さらに、バイクを所有してシェアリングオーナーになると報酬額5%アップ！
                  </div>
                  <button className="mt-2 text-xs font-bold text-emerald-200 inline-flex items-center gap-1 hover:underline">
                    ベストBikeシェアリングHPを見る <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 mt-3">
              ※ クーポンはご登録のメールアドレス（sho@baller.inc）にも送信済みです。
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h2 className="font-bold text-lg mb-4">申込状況</h2>
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-14 h-14 bg-gradient-to-br ${school.thumb} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <School className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="font-bold">{school.name}</div>
              <StatusPill status={status} />
            </div>
            <div className="text-sm text-slate-500">普通二輪MT（普通自動車免許をお持ちの方）／ 152,750円（税込）</div>
            <div className="text-xs text-slate-400 mt-0.5">申込番号: BB-EDU-2026-08041438</div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          {TIMELINE.map((step, i) => {
            const done = STATUS_ORDER.indexOf(status) >= i;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <div className={`text-sm ${done ? 'font-bold text-slate-900' : 'text-slate-400'}`}>{step.label}</div>
                  {done && <div className="text-xs text-slate-400">{step.date}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {status !== 'graduated' && (
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 flex gap-2">
            <Clock className="w-5 h-5 flex-shrink-0 text-slate-400" />
            <div>
              {status === 'provisional' || status === 'entry_review'
                ? '教習所からのご連絡をお待ちください。'
                : 'ご卒業までもうすこしです。卒業されると特典が発行されます。'}
            </div>
          </div>
        )}

        {status === 'in_training' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-sm font-bold text-amber-900 mb-1">もう卒業されましたか？</div>
            <p className="text-xs text-amber-800 mb-3">
              教習所での卒業登録が済むと特典が発行されます。すでに卒業されている場合はお知らせください。
            </p>
            <button className="bg-white border border-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg">
              はい、卒業しました
            </button>
          </div>
        )}
      </div>

      {status !== 'graduated' && (
        <div className="mt-4 bg-white border border-dashed border-slate-300 rounded-2xl p-5 text-center">
          <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">
            特典（クーポン2種）は<strong className="text-slate-700">卒業時</strong>に発行されます
          </p>
          <p className="text-xs text-slate-400 mt-1">
            デモ：「教習所ダッシュボード」で入校 → 卒業を操作すると、ここに特典が表示されます
          </p>
        </div>
      )}
    </div>
  </div>
);

// ===== 画面10: 教習所ダッシュボード =====
// 現在の申込ステータスが属するタブ。画面を開き直したときに
// 対象の申込が見えるタブで開くために使う。
const tabForStatus = (status) => {
  if (['entry_confirmed', 'in_training'].includes(status)) return 'training';
  if (status === 'graduated') return 'graduated';
  if (status === 'cancelled') return 'cancelled';
  return 'waiting';
};

const ScreenSchoolAdmin = ({ status, onAdvance, onGraduate }) => {
  const [tab, setTab] = useState(() => tabForStatus(status));
  const [dialog, setDialog] = useState(null);

  const inWaiting = ['provisional', 'entry_review'].includes(status);
  const inTraining = ['entry_confirmed', 'in_training'].includes(status);
  const isGraduated = status === 'graduated';

  const rows = [
    { no: 'BB-EDU-2026-08041438', name: '佐藤 翔', desired: 'moto_mt', held: 'car', price: 152750, contact: 'メール', status, primary: true },
    { no: 'BB-EDU-2026-08021024', name: '田中 裕一', desired: 'large_moto_mt', held: 'moto', price: 98000, contact: '電話', status: 'in_training' },
    { no: 'BB-EDU-2026-07281455', name: '鈴木 花子', desired: 'moto_at', held: 'car', price: 142000, contact: 'メール', status: 'graduated' },
    { no: 'BB-EDU-2026-07181730', name: '山田 太郎', desired: 'moto_mt', held: 'none', price: 178200, contact: 'その他', status: 'cancelled' },
  ];

  const tabs = [
    { key: 'waiting', label: '入校待ち', match: ['provisional', 'entry_review'] },
    { key: 'training', label: '教習中', match: ['entry_confirmed', 'in_training'] },
    { key: 'graduated', label: '卒業者', match: ['graduated'] },
    { key: 'cancelled', label: 'キャンセル', match: ['cancelled'] },
    { key: 'all', label: 'すべて', match: null },
  ];
  const activeTab = tabs.find((t) => t.key === tab);
  const filtered = activeTab.match ? rows.filter((r) => activeTab.match.includes(r.status)) : rows;

  // 行の操作ボタン。表（PC）とカード（スマホ）で共通。スマホは指で押しやすい大きさにする
  const renderActions = (row, mobile = false) => {
    const btn = mobile ? 'px-4 py-2 text-sm rounded-lg' : 'px-3 py-1 text-xs rounded';
    if (!row.primary) {
      return mobile ? null : <button className="text-xs text-sky-600 font-semibold">詳細</button>;
    }
    return (
      <div className={`flex flex-wrap ${mobile ? 'gap-2' : 'gap-1.5'}`}>
        <button className={`border border-slate-300 text-slate-600 inline-flex items-center gap-1 ${mobile ? btn : 'text-xs px-2.5 py-1 rounded'}`}>
          <Mail className={mobile ? 'w-4 h-4' : 'w-3 h-3'} />メール
        </button>
        {inWaiting && (
          <button onClick={() => setDialog('entry')} className={`bg-sky-600 hover:bg-sky-700 text-white font-bold ${btn}`}>
            入校
          </button>
        )}
        {inTraining && (
          <button onClick={() => setDialog('graduate')} className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold ${btn}`}>
            卒業
          </button>
        )}
        {isGraduated && <span className={`text-emerald-700 font-bold self-center ${mobile ? 'text-sm' : 'text-xs'}`}>特典発行済</span>}
      </div>
    );
  };

  const summary = [
    { label: '入校待ち', value: rows.filter((r) => ['provisional', 'entry_review'].includes(r.status)).length, unit: '件' },
    { label: '教習中', value: rows.filter((r) => ['entry_confirmed', 'in_training'].includes(r.status)).length, unit: '件' },
    { label: '今月の卒業者', value: rows.filter((r) => r.status === 'graduated').length, unit: '名' },
    { label: '今月の紹介料', value: '—', unit: '（設定待ち）' },
  ];

  return (
    <div className="bg-slate-100 min-h-full">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">せたがや自動車学校 管理画面</span>
            <Pill color="sky">ベストBike提携</Pill>
          </div>
          <div className="text-sm text-slate-300 hidden md:block">admin@setakyo1960.example.jp</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-black mb-6">ベストBike経由の申込</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {summary.map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">{s.label}</div>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl sm:text-3xl font-black">{s.value}</div>
                <div className="text-xs text-slate-500">{s.unit}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 flex overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  tab === t.key ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* スマホ：申込1件を1枚のカードに。操作ボタンを横スクロールせずに押せるようにする */}
          <ul className="md:hidden divide-y divide-slate-100">
            {filtered.map((row) => (
              <li key={row.no} className={`p-4 ${row.primary ? 'bg-sky-50/40' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{row.name}</span>
                  <StatusPill status={row.status} />
                </div>
                <div className="font-mono text-[11px] text-slate-400 mt-0.5">{row.no}</div>
                <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    {DESIRED_LICENSES[row.desired].label}
                    <span className="text-slate-400"> / {HELD_LICENSES[row.held]}</span>
                  </span>
                  <span className="font-bold text-slate-900">{yen(row.price)}</span>
                  <span>ご案内：{row.contact}</span>
                </div>
                {row.primary && <div className="mt-3">{renderActions(row, true)}</div>}
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-400">該当する申込はありません</div>
          )}

          <div className={filtered.length === 0 ? 'hidden' : 'hidden md:block overflow-x-auto'}>
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="text-left p-3 font-semibold">申込番号</th>
                  <th scope="col" className="text-left p-3 font-semibold">氏名</th>
                  <th scope="col" className="text-left p-3 font-semibold">希望免許 / 所持免許</th>
                  <th scope="col" className="text-right p-3 font-semibold">料金</th>
                  <th scope="col" className="text-left p-3 font-semibold">ご案内方法</th>
                  <th scope="col" className="text-left p-3 font-semibold">ステータス</th>
                  <th scope="col" className="text-left p-3 font-semibold">アクション</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.no} className={`border-t border-slate-100 ${row.primary ? 'bg-sky-50/40' : ''}`}>
                    <td className="p-3 font-mono text-xs">{row.no}</td>
                    <td className="p-3 font-semibold whitespace-nowrap">{row.name}</td>
                    <td className="p-3 text-xs">
                      {DESIRED_LICENSES[row.desired].label}
                      <span className="text-slate-400"> / {HELD_LICENSES[row.held]}</span>
                    </td>
                    <td className="p-3 text-right font-bold whitespace-nowrap">{yen(row.price)}</td>
                    <td className="p-3 text-xs text-slate-600">{row.contact}</td>
                    <td className="p-3"><StatusPill status={row.status} /></td>
                    <td className="p-3">{renderActions(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>「卒業」ボタンを押すと、</strong>申込者にベストBikeのクーポン2種
            （初回5,000円OFF ／ 2回目以降 永久10%OFF）が自動発行されます。
            誤操作を防ぐため、確定後の取消しには運営への連絡が必要です。
          </div>
        </div>
      </div>

      {dialog && (
        // スマホでは画面下から出るシート、sm以上は中央のダイアログ
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-6 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 pb-8 sm:pb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-black text-lg">{dialog === 'entry' ? '入校確定にします' : '卒業にします'}</h3>
              <button onClick={() => setDialog(null)} className="text-slate-400 hover:text-slate-600" aria-label="閉じる">
                <X className="w-5 h-5" />
              </button>
            </div>
            {dialog === 'entry' ? (
              <ul className="text-sm text-slate-700 space-y-1.5 mb-6 list-disc pl-5">
                <li>申込者に入校確定の通知が送られます</li>
                <li>入校日の到来でステータスが「教習中」に進みます</li>
              </ul>
            ) : (
              <ul className="text-sm text-slate-700 space-y-1.5 mb-6 list-disc pl-5">
                <li>
                  申込者に<strong>ベストBikeのクーポン2種</strong>
                  （初回5,000円OFF ／ 2回目以降 永久10%OFF）が<strong>自動発行</strong>されます
                </li>
                <li>卒業おめでとうメールが申込者に送信されます</li>
                <li><strong>取消しには、運営への連絡が必要です</strong></li>
              </ul>
            )}
            <div className="flex gap-2">
              <button onClick={() => setDialog(null)} className="flex-1 border border-slate-300 font-semibold py-2.5 rounded-xl text-sm">
                キャンセル
              </button>
              <button
                onClick={() => {
                  // 操作後、その申込が移動した先のタブに切り替える。
                  // 切り替えないと行が現在のタブから消え、どこへ行ったか分からなくなる。
                  if (dialog === 'entry') {
                    onAdvance();
                    setTab('training');
                  } else {
                    onGraduate();
                    setTab('graduated');
                  }
                  setDialog(null);
                }}
                className={`flex-1 text-white font-bold py-2.5 rounded-xl text-sm ${
                  dialog === 'entry' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {dialog === 'entry' ? '入校を確定する' : '卒業を確定する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== 画面11: 自社情報・料金管理 =====
// スマホ用の入力欄。16px未満だとiPhoneでタップ時に画面が拡大されるため text-base にする
const mobileCtl = 'w-full border border-slate-300 rounded-lg px-2.5 py-2 text-base bg-white';

const ScreenSchoolSettings = () => {
  const school = SCHOOLS[0];
  return (
    <div className="bg-slate-100 min-h-full">
      <header className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold">自社情報・料金管理</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <SectionCard
          title="基本情報"
          icon={Building2}
          action={
            <button className="text-xs text-sky-600 font-bold inline-flex items-center gap-1">
              <Pencil className="w-3 h-3" />編集
            </button>
          }
        >
          <dl className="text-sm grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {[
              ['名称', school.name], ['所在地', school.address], ['電話番号', school.phone],
              ['メールアドレス', school.email], ['ホームページ', school.website], ['特色', school.features],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-24 text-slate-500 flex-shrink-0 text-xs pt-0.5">{k}</dt>
                <dd className="flex-1 break-all text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="写真（最大4枚）" icon={ImageIcon}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`aspect-video rounded-lg flex items-center justify-center ${
                  i < school.photoCount ? `bg-gradient-to-br ${school.thumb}` : 'bg-slate-50 border-2 border-dashed border-slate-300'
                }`}
              >
                {i < school.photoCount ? <School className="w-6 h-6 text-white/70" /> : <Plus className="w-5 h-5 text-slate-300" />}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">5枚目以降は登録できません</p>
        </SectionCard>

        <SectionCard
          title="教習費用"
          icon={ClipboardList}
          action={
            <button className="text-xs bg-sky-600 text-white font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
              <Plus className="w-3 h-3" />行を追加
            </button>
          }
        >
          {/* スマホ：1行を1枚の入力カードに。入力欄は16pxにしてiPhoneの自動拡大を防ぐ */}
          <ul className="sm:hidden space-y-3">
            {school.tuition.map((t) => (
              <li key={`${t.desired}-${t.held}`} className="border border-slate-200 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">希望免許</span>
                    <select className={mobileCtl} defaultValue={t.desired}>
                      {Object.entries(DESIRED_LICENSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">現在お持ちの免許</span>
                    <select className={mobileCtl} defaultValue={t.held}>
                      {Object.entries(HELD_LICENSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">料金（円）</span>
                    <input defaultValue={t.price} inputMode="numeric" className={`${mobileCtl} text-right`} />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">税</span>
                    <select className={mobileCtl} defaultValue={t.taxIncluded ? 'in' : 'ex'}>
                      <option value="in">税込</option>
                      <option value="ex">税別</option>
                    </select>
                  </label>
                  <label className="block col-span-2">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">備考</span>
                    <input defaultValue={t.note} placeholder="—" className={mobileCtl} />
                  </label>
                </div>
                <div className="flex justify-end mt-2">
                  <button className="text-xs text-red-500 font-semibold inline-flex items-center gap-1 py-1">
                    <Trash2 className="w-3.5 h-3.5" />この行を削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block overflow-x-auto relative">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="text-left p-2.5 font-semibold">希望免許</th>
                  <th scope="col" className="text-left p-2.5 font-semibold">現在お持ちの免許</th>
                  <th scope="col" className="text-right p-2.5 font-semibold">料金</th>
                  <th scope="col" className="text-center p-2.5 font-semibold">税</th>
                  <th scope="col" className="text-left p-2.5 font-semibold">備考</th>
                  <th scope="col" className="p-2.5"><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody>
                {school.tuition.map((t) => (
                  <tr key={`${t.desired}-${t.held}`} className="border-t border-slate-100">
                    <td className="p-2 text-xs">
                      <select className="border border-slate-200 rounded px-2 py-1 text-xs w-full bg-white" defaultValue={t.desired} aria-label="希望免許">
                        {Object.entries(DESIRED_LICENSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="p-2 text-xs">
                      <select className="border border-slate-200 rounded px-2 py-1 text-xs w-full bg-white" defaultValue={t.held} aria-label="現在お持ちの免許">
                        {Object.entries(HELD_LICENSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      <input defaultValue={t.price} className="border border-slate-200 rounded px-2 py-1 text-xs w-24 text-right" aria-label="料金" />
                    </td>
                    <td className="p-2 text-center">
                      <select className="border border-slate-200 rounded px-1.5 py-1 text-xs bg-white" defaultValue={t.taxIncluded ? 'in' : 'ex'} aria-label="税区分">
                        <option value="in">税込</option>
                        <option value="ex">税別</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input defaultValue={t.note} placeholder="—" className="border border-slate-200 rounded px-2 py-1 text-xs w-full" aria-label="備考" />
                    </td>
                    <td className="p-2 text-center">
                      <button className="text-slate-300 hover:text-red-500" aria-label="行を削除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 flex gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              「希望免許 × 現在お持ちの免許」の組み合わせは重複できません。
              Excel形式の自由入力ではなく、この固定項目の表で管理します。
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="別途費用"
          icon={ClipboardList}
          action={
            <button className="text-xs bg-sky-600 text-white font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
              <Plus className="w-3 h-3" />行を追加
            </button>
          }
        >
          <ul className="sm:hidden space-y-3">
            {school.extras.map((e) => (
              <li key={e.name} className="border border-slate-200 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="block col-span-2">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">詳細</span>
                    <input defaultValue={e.name} className={mobileCtl} />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">費用（円）</span>
                    <input defaultValue={e.price} inputMode="numeric" className={`${mobileCtl} text-right`} />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-500 mb-1">備考</span>
                    <input defaultValue={e.note} placeholder="—" className={mobileCtl} />
                  </label>
                </div>
                <div className="flex justify-end mt-2">
                  <button className="text-xs text-red-500 font-semibold inline-flex items-center gap-1 py-1">
                    <Trash2 className="w-3.5 h-3.5" />この行を削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <table className="hidden sm:table w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="text-left p-2.5 font-semibold">詳細</th>
                <th scope="col" className="text-right p-2.5 font-semibold">費用</th>
                <th scope="col" className="text-left p-2.5 font-semibold">備考</th>
                <th scope="col" className="p-2.5"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {school.extras.map((e) => (
                <tr key={e.name} className="border-t border-slate-100">
                  <td className="p-2"><input defaultValue={e.name} className="border border-slate-200 rounded px-2 py-1 text-xs w-full" aria-label="詳細" /></td>
                  <td className="p-2 text-right"><input defaultValue={e.price} className="border border-slate-200 rounded px-2 py-1 text-xs w-24 text-right" aria-label="費用" /></td>
                  <td className="p-2"><input defaultValue={e.note} placeholder="—" className="border border-slate-200 rounded px-2 py-1 text-xs w-full" aria-label="備考" /></td>
                  <td className="p-2 text-center">
                    <button className="text-slate-300 hover:text-red-500" aria-label="行を削除"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="通知方法設定" icon={Mail}>
          <p className="text-xs text-slate-500 mb-3">
            仮申込・問合せの通知先です。見落としや未着を防ぐため、予備アドレスを1件登録できます（最大2件）。
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 w-16 flex-shrink-0">メイン</span>
              <input defaultValue="admin@setakyo1960.example.jp" className={inputCls} aria-label="通知先メール（メイン）" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 w-16 flex-shrink-0">予備</span>
              <input defaultValue="info@setakyo1960.example.jp" className={inputCls} aria-label="通知先メール（予備）" />
            </div>
          </div>
        </SectionCard>

        <button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl">
          変更を保存する
        </button>
      </div>
    </div>
  );
};

// ===== 画面12: 運営ダッシュボード =====
const ScreenAdminDash = () => {
  const [granularity, setGranularity] = useState('monthly');

  const bySchool = [
    { name: 'せたがや自動車学校', waiting: 3, training: 5, graduated: 12 },
    { name: '駒沢モータースクール', waiting: 2, training: 4, graduated: 9 },
    { name: '府中ドライビングスクール', waiting: 4, training: 7, graduated: 15 },
    { name: 'グリーン自動車学校 町田', waiting: 1, training: 3, graduated: 6 },
  ];
  const totals = bySchool.reduce(
    (a, s) => ({ waiting: a.waiting + s.waiting, training: a.training + s.training, graduated: a.graduated + s.graduated }),
    { waiting: 0, training: 0, graduated: 0 }
  );
  const alerts = [
    { no: 'BB-EDU-2026-05120933', school: '府中ドライビングスクール', note: '標準期間+34日を超過' },
    { no: 'BB-EDU-2026-05281102', school: '駒沢モータースクール', note: 'ユーザーが「卒業しました」と申告' },
  ];

  // スマホの売上カード：4つの数字を横に並べる
  const salesCells = (s) => [
    ['入校待ち', s.waiting],
    ['入校', s.training],
    ['卒業', s.graduated],
    ['請求額', '—'],
  ];

  return (
    <div className="bg-slate-100 min-h-full">
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" dark />
            <Pill color="orange">運営管理</Pill>
          </div>
          <Settings className="w-5 h-5" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-black mb-6">運営ダッシュボード</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: '入校待ち', value: totals.waiting, unit: '名', icon: Clock },
            { label: '教習中', value: totals.training, unit: '名', icon: Users },
            { label: '卒業者（当月）', value: totals.graduated, unit: '名', icon: GraduationCap },
            { label: '提携教習所', value: 24, unit: '校', icon: School },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl p-5 border border-slate-200">
              <kpi.icon className="w-7 h-7 text-sky-600 mb-3" strokeWidth={1.5} />
              <div className="text-xs text-slate-500">{kpi.label}</div>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-black">{kpi.value}</div>
                <div className="text-sm text-slate-500">{kpi.unit}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-bold">売上（教習所別）</h2>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {[['daily', '日次'], ['monthly', '月次'], ['yearly', '年次']].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setGranularity(k)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md ${granularity === k ? 'bg-white shadow-sm' : 'text-slate-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ul className="sm:hidden divide-y divide-slate-100">
            {[...bySchool.map((s) => ({ ...s, total: false })), { name: '全体', ...totals, total: true }].map((s) => (
              <li key={s.name} className={`p-4 ${s.total ? 'bg-slate-50' : ''}`}>
                <div className={`mb-2 ${s.total ? 'font-black' : 'font-semibold'}`}>{s.name}</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {salesCells(s).map(([label, value]) => (
                    <div key={label} className={`rounded-lg py-2 ${s.total ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="text-[10px] text-slate-500">{label}</div>
                      <div className={`${value === '—' ? 'text-slate-400' : ''} ${s.total || label === '卒業' ? 'font-black' : 'font-bold'}`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="text-left p-3 font-semibold">教習所名</th>
                  <th scope="col" className="text-right p-3 font-semibold">入校待ち人数</th>
                  <th scope="col" className="text-right p-3 font-semibold">入校人数</th>
                  <th scope="col" className="text-right p-3 font-semibold">卒業人数</th>
                  <th scope="col" className="text-right p-3 font-semibold">請求額</th>
                </tr>
              </thead>
              <tbody>
                {bySchool.map((s) => (
                  <tr key={s.name} className="border-t border-slate-100">
                    <td className="p-3 font-semibold">{s.name}</td>
                    <td className="p-3 text-right">{s.waiting}</td>
                    <td className="p-3 text-right">{s.training}</td>
                    <td className="p-3 text-right font-bold">{s.graduated}</td>
                    <td className="p-3 text-right text-slate-400">—</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-black">
                  <td className="p-3">全体</td>
                  <td className="p-3 text-right">{totals.waiting}</td>
                  <td className="p-3 text-right">{totals.training}</td>
                  <td className="p-3 text-right">{totals.graduated}</td>
                  <td className="p-3 text-right text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex items-start gap-2 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>請求額が「—」なのは、紹介料の計算ルールが未確定のためです。</strong>
            発生時点（入校確定時／卒業時）・固定額か料金比例か・キャンセル時の扱い・締め日・
            税込／税別が決まると、ここに金額が入ります（確認事項A）。
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold">卒業登録の遅れアラート</h2>
          </div>
          <ul className="sm:hidden divide-y divide-slate-100">
            {alerts.map((r) => (
              <li key={r.no} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm">{r.school}</span>
                  <Pill color="amber">教習中</Pill>
                </div>
                <div className="font-mono text-[11px] text-slate-400 mt-0.5">{r.no}</div>
                <div className="text-xs text-slate-600 mt-1.5">{r.note}</div>
              </li>
            ))}
          </ul>
          <table className="hidden sm:table w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="text-left p-3 font-semibold">申込番号</th>
                <th scope="col" className="text-left p-3 font-semibold">教習所</th>
                <th scope="col" className="text-left p-3 font-semibold">状態</th>
                <th scope="col" className="text-left p-3 font-semibold">検知内容</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((r) => (
                <tr key={r.no} className="border-t border-slate-100">
                  <td className="p-3 font-mono text-xs">{r.no}</td>
                  <td className="p-3">{r.school}</td>
                  <td className="p-3"><Pill color="amber">教習中</Pill></td>
                  <td className="p-3 text-xs text-slate-600">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ===== 画面13: 画面遷移図 =====
const FlowBox = ({ color = 'sky', num, title, sub, big = false }) => {
  const colors = {
    sky: 'bg-sky-50 border-sky-400 text-sky-900',
    orange: 'bg-orange-50 border-orange-400 text-orange-900',
    emerald: 'bg-emerald-50 border-emerald-400 text-emerald-900',
    slate: 'bg-slate-50 border-slate-400 text-slate-900',
  };
  const badge = { sky: 'bg-sky-500', orange: 'bg-orange-500', emerald: 'bg-emerald-500', slate: 'bg-slate-500' };
  return (
    <div className={`relative border-2 rounded-xl p-4 ${colors[color]} w-full max-w-xs ${big ? 'sm:w-72' : 'sm:w-52'}`}>
      <div className={`absolute -top-3 -left-3 w-7 h-7 ${badge[color]} text-white rounded-full flex items-center justify-center text-xs font-black`}>
        {num}
      </div>
      <div className="font-bold text-sm mb-0.5">{title}</div>
      <div className="text-xs opacity-80">{sub}</div>
    </div>
  );
};

const ScreenFlow = () => (
  <div className="bg-slate-50 min-h-full p-4 sm:p-8">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black mb-2">画面遷移図</h1>
      <p className="text-slate-600 mb-8">エリア選択から、卒業による特典発行まで</p>

      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-200">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:flex-wrap">
            <FlowBox color="sky" num="1" title="トップ" sub="特典の説明" />
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0 flex-shrink-0" />
            <FlowBox color="sky" num="2" title="都道府県一覧" sub="SUUMO型のエリア階層" />
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0 flex-shrink-0" />
            <FlowBox color="sky" num="3" title="市区町村一覧" sub="件数つき" />
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-slate-400" /></div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:flex-wrap">
            <FlowBox color="sky" num="4" title="教習所一覧" sub="写真/名称/所在地/TEL/HP/特色/価格例" />
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0 flex-shrink-0" />
            <FlowBox color="sky" num="5" title="教習所詳細" sub="料金2表 / 写真4枚 / Google地図" />
          </div>

          <div className="flex justify-center gap-16 flex-wrap">
            <div className="flex flex-col items-center"><ArrowDown className="w-5 h-5 text-slate-400" /><span className="text-xs font-bold text-slate-500">申し込む</span></div>
            <div className="flex flex-col items-center"><ArrowDown className="w-5 h-5 text-slate-400" /><span className="text-xs font-bold text-slate-500">質問する</span></div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 justify-center sm:flex-wrap">
            <FlowBox color="orange" num="6" title="仮申込フォーム" sub="10項目 + 同意4件" />
            <FlowBox color="slate" num="6b" title="問合せフォーム" sub="教習所にのみ送信" />
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-slate-400" /></div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:flex-wrap">
            <FlowBox color="orange" num="7" title="仮申込完了" sub="申込番号 / 会員自動連携" />
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0 flex-shrink-0" />
            <FlowBox color="slate" num="8" title="マイページ" sub="特典なし。進捗のみ" />
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-slate-400" /></div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:flex-wrap">
            <FlowBox color="emerald" num="9" title="教習所: 入校待ち" sub="「入校」ボタン" />
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0 flex-shrink-0" />
            <FlowBox color="emerald" num="10" title="教習所: 教習中" sub="「卒業」ボタン" />
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-slate-400" /></div>

          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-dashed border-orange-400 rounded-xl px-6 py-4 text-center max-w-lg">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Zap className="w-4 h-4 text-orange-600" />
                <div className="font-bold text-orange-900">システム自動処理（卒業トリガー）</div>
              </div>
              <div className="text-xs text-orange-800">
                クーポン2種を自動生成 ／ 卒業おめでとうメール送信 ／ ベストBike本体へ連携
                <br />
                紹介料の計上（発生時点は設定により入校確定時 or 卒業時）
              </div>
            </div>
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-slate-400" /></div>

          <div className="flex justify-center">
            <FlowBox color="emerald" num="11" title="マイページ（特典表示）" sub="初回5,000円OFF / 永久10%OFF をコピー" big />
          </div>

          <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-slate-400" /></div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:flex-wrap">
            <FlowBox color="sky" num="12" title="ベストBike レンタル" sub="初回5,000円OFF → 以降10%OFF" />
            <FlowBox color="sky" num="13" title="シェアリングオーナー" sub="報酬額5%アップ" />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex gap-6 text-xs flex-wrap">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-500 rounded" />情報閲覧フェーズ</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded" />申込フェーズ</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded" />教習・卒業フェーズ</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-500 rounded" />待機・補助</div>
        </div>
      </div>
    </div>
  </div>
);

// ===== 画面14: データフロー図 =====
// スマホは「送り手 → 受け手」を1行目に小さく出し、その下に内容を全幅で出す
const DataFlowRow = ({ from, to, event, desc, arrow, highlight }) => (
  <div className={`sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center py-2 px-3 rounded-lg ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
    <div className="sm:hidden flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-0.5">
      <span>{from}</span>
      <span className="text-slate-400 text-sm leading-none">{arrow}</span>
      <span>{to}</span>
    </div>
    <div className="hidden sm:block col-span-2 text-xs font-bold text-right">{from}</div>
    <div className="hidden sm:block col-span-1 text-center text-xl text-slate-400">{arrow}</div>
    <div className="hidden sm:block col-span-2 text-xs font-bold">{to}</div>
    <div className="sm:col-span-7">
      <div className="text-sm font-bold">{event}</div>
      <div className="text-xs text-slate-500">{desc}</div>
    </div>
  </div>
);

const TableSchema = ({ name, desc, fields }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <div className="bg-slate-800 text-white px-4 py-2">
      <div className="font-mono font-bold text-sm">{name}</div>
      <div className="text-xs text-slate-400">{desc}</div>
    </div>
    <div className="p-3 bg-slate-50 text-xs font-mono space-y-0.5">
      {fields.map((f) => <div key={f} className="text-slate-700">• {f}</div>)}
    </div>
  </div>
);

const ScreenDataFlow = () => (
  <div className="bg-slate-50 min-h-full p-4 sm:p-8">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black mb-2">データフロー図</h1>
      <p className="text-slate-600 mb-8">「卒業」というキートリガーから、特典と紹介料が発生する仕組み</p>

      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-slate-200">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          {[
            { icon: User, label: 'ユーザー', sub: 'バイク免許取得希望者', bg: 'bg-sky-100', fg: 'text-sky-600' },
            { icon: Bike, label: 'ベストBike マッチング', sub: '当プラットフォーム', bg: 'bg-gradient-to-br from-sky-500 to-blue-700', fg: 'text-white' },
            { icon: School, label: '提携教習所', sub: '全国24校（仮）', bg: 'bg-emerald-100', fg: 'text-emerald-600' },
          ].map((a) => (
            <div key={a.label} className="text-center">
              <div className={`w-14 h-14 sm:w-20 sm:h-20 ${a.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <a.icon className={`w-7 h-7 sm:w-10 sm:h-10 ${a.fg}`} />
              </div>
              <div className="font-bold text-sm">{a.label}</div>
              <div className="text-xs text-slate-500">{a.sub}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <DataFlowRow from="ユーザー" to="当PF" arrow="→" event="仮申込" desc="教習所選択 + 個人情報 + 希望免許/所持免許 + 同意4件" />
          <DataFlowRow from="当PF" to="ベストBike" arrow="→" event="無料会員の自動登録" desc="権限「ユーザー」で登録。失敗しても仮申込は成立（Outbox で再送）" />
          <DataFlowRow from="当PF" to="教習所" arrow="→" event="仮申込の通知" desc="通知先メール最大2件 + 管理画面" />
          <DataFlowRow from="教習所" to="ユーザー" arrow="←" event="入校案内" desc="管理画面からメーラー起動、または電話" />
          <DataFlowRow from="教習所" to="当PF" arrow="←" event="「入校」操作" desc="入校確認中 → 入校確定 → 教習中" />

          <div className="relative py-2">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-slate-300" />
            <div className="relative flex justify-center">
              <div className="bg-amber-100 border border-amber-300 rounded-full px-4 py-1 text-xs font-bold text-amber-900 text-center">
                ⚡ キー操作：教習所が「卒業」ボタンを押す
              </div>
            </div>
          </div>

          <DataFlowRow highlight from="教習所" to="当PF" arrow="←" event="卒業の登録" desc="ステータス更新（in_training → graduated）" />
          <DataFlowRow highlight from="当PF" to="当PF" arrow="↺" event="クーポン2種を自動生成" desc="初回5,000円OFF（1回限り）／ 永久10%OFF（回数無制限）" />
          <DataFlowRow highlight from="当PF" to="ユーザー" arrow="→" event="卒業通知＋クーポンメール" desc="マイページでもワンタップコピー可能" />
          <DataFlowRow highlight from="当PF" to="ベストBike" arrow="→" event="割引属性の連携" desc="会員にクーポンを付与。失敗時は Outbox で再送" />
          <DataFlowRow highlight from="当PF" to="当PF" arrow="↺" event="紹介料の計上" desc="発生時点は設定次第（入校確定時 or 卒業時）— 確認事項A" />
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <div className="font-bold text-sky-900 mb-1 text-sm">① 仮申込</div>
            <div className="text-xs text-sky-800">
              お金は動かない。申込レコードを作り、教習所に通知し、ベストBike会員を自動登録するだけ。
            </div>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-slate-900 mb-1 text-sm">② 入校確定</div>
            <div className="text-xs text-slate-700">
              ユーザーへの特典はまだ発行されない。紹介料をここで計上するかは設定次第。
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="font-bold text-amber-900 mb-1 text-sm">③ 卒業</div>
            <div className="text-xs text-amber-800">
              <strong>唯一の特典発行トリガー。</strong>クーポン2種の生成・メール送信・本体連携が同時に走る。
              確定後の取消しは運営のみ。
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-4 sm:p-8 border border-slate-200">
        <h2 className="text-xl font-black mb-4">主要テーブル（抜粋）</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <TableSchema name="schools" desc="提携教習所" fields={['id', 'name', 'prefecture / city', 'address / phone / email', 'website_url', 'features / notes / free_description', 'status']} />
          <TableSchema name="school_tuition_fees" desc="教習費用（希望免許 × 保有免許）" fields={['school_id', 'desired_license (6種)', 'held_license', 'price', 'tax_included', 'note', 'UNIQUE(school_id, desired, held)']} />
          <TableSchema name="school_extra_fees" desc="別途費用" fields={['school_id', 'name（詳細）', 'price', 'tax_included', 'note']} />
          <TableSchema name="applications" desc="仮申込" fields={['application_no', 'user_id / school_id', 'tuition_fee_id', 'status（6段階）', 'contact_method / message', 'price_snapshot', 'entry_confirmed_at / graduated_at']} />
          <TableSchema name="coupons" desc="特典（卒業で2件生成）" fields={['application_id / user_id', 'kind: first_time | lifetime', 'code（暗号論的乱数）', 'discount_amount / discount_rate', 'max_uses / used_count', 'expires_at / status', 'UNIQUE(application_id, kind)']} />
          <TableSchema name="referral_fees" desc="紹介料（設定により発生時点が変わる）" fields={['application_id（UNIQUE）', 'school_id', 'amount / tax_included', 'trigger_status', 'billing_month', 'status']} />
        </div>
      </div>
    </div>
  </div>
);

// ===== メインアプリ =====
const SCREEN_LIST = [
  { id: 'landing', label: 'トップ', icon: Home, category: 'user' },
  { id: 'areaPref', label: '都道府県一覧', icon: Navigation2, category: 'user' },
  { id: 'areaCity', label: '市区町村一覧', icon: MapPin, category: 'user' },
  { id: 'list', label: '教習所一覧', icon: Search, category: 'user' },
  { id: 'detail', label: '教習所詳細・料金', icon: School, category: 'user' },
  { id: 'apply', label: '仮申込フォーム', icon: FileText, category: 'user' },
  { id: 'complete', label: '仮申込完了', icon: CheckCircle2, category: 'user' },
  { id: 'inquiry', label: '問合せ', icon: MessageSquare, category: 'user' },
  { id: 'mypage', label: 'マイページ', icon: User, category: 'user' },
  { id: 'schoolAdmin', label: '教習所ダッシュボード', icon: School, category: 'admin' },
  { id: 'schoolSettings', label: '自社情報・料金管理', icon: Settings, category: 'admin' },
  { id: 'adminDash', label: '運営ダッシュボード', icon: TrendingUp, category: 'admin' },
  { id: 'flow', label: '画面遷移図', icon: Navigation2, category: 'doc' },
  { id: 'dataflow', label: 'データフロー図', icon: Zap, category: 'doc' },
];

const CATEGORIES = {
  user: { label: 'ユーザー向け画面', color: 'text-sky-600' },
  admin: { label: '管理画面', color: 'text-orange-600' },
  doc: { label: 'ドキュメント', color: 'text-emerald-600' },
};

// 画面一覧（PCでは左のサイドバー、スマホでは引き出しメニューに同じものを出す）
const PrototypeNav = ({ screen, onSelect, status, onReset }) => (
  <>
    <div className="m-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div className="text-[11px] font-bold text-slate-500 mb-1.5">デモ：申込ステータス</div>
      <StatusPill status={status} />
      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
        「教習所ダッシュボード」で入校 → 卒業を押すと、マイページに特典が発行されます。
      </p>
      {status !== 'provisional' && (
        <button onClick={onReset} className="mt-2 text-[10px] text-sky-600 font-bold hover:underline">
          最初から試す
        </button>
      )}
    </div>

    <div className="p-3 pt-0">
      {Object.entries(CATEGORIES).map(([catId, cat]) => (
        <div key={catId} className="mb-4">
          <div className={`text-xs font-bold px-3 py-1 ${cat.color}`}>{cat.label}</div>
          {SCREEN_LIST.filter((s) => s.category === catId).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              aria-current={screen === s.id ? 'page' : undefined}
              className={`w-full flex items-center gap-2 px-3 py-2.5 md:py-2 rounded-lg text-sm text-left mb-0.5 transition ${
                screen === s.id ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  </>
);

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [pref, setPref] = useState(REGIONS[0].prefectures[0]);
  const [city, setCity] = useState(CITIES.tokyo[0]);
  const [school, setSchool] = useState(SCHOOLS[0]);
  const [heldFilter, setHeldFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef(null);

  // デモ用の申込ステータス。教習所ダッシュボードから進められる
  const [status, setStatus] = useState('provisional');
  const [coupons, setCoupons] = useState(null);

  // 画面を切り替えたら先頭から表示する。
  // スマホではページ全体が、PCではメイン領域がスクロールするので両方を戻す。
  useEffect(() => {
    window.scrollTo(0, 0);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [screen]);

  // 引き出しメニューを開いている間は背面をスクロールさせず、Escで閉じられるようにする
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const selectScreen = (id) => {
    setScreen(id);
    setMenuOpen(false);
  };
  const resetDemo = () => {
    setStatus('provisional');
    setCoupons(null);
  };
  const currentLabel = (SCREEN_LIST.find((s) => s.id === screen) || SCREEN_LIST[0]).label;

  const handleAdvance = () => setStatus('in_training');
  const handleGraduate = () => {
    setStatus('graduated');
    setCoupons([
      { code: 'BB5000-7K2M9QVB', title: '初回 5,000円OFF', subtitle: '初めてのレンタルに', expires: '2027/09/28', usage: '未使用（1回限り）' },
      { code: 'BB10PC-4XN8DTRW', title: '2回目以降 永久10%OFF', subtitle: 'ずっと使えます', expires: null, usage: '利用回数 0回（無制限）' },
    ]);
  };

  const render = () => {
    switch (screen) {
      case 'landing': return <ScreenLanding onNavigate={setScreen} />;
      case 'areaPref': return <ScreenAreaPref onNavigate={setScreen} setPref={setPref} />;
      case 'areaCity': return <ScreenAreaCity onNavigate={setScreen} pref={pref} setCity={setCity} />;
      case 'list': return <ScreenList onNavigate={setScreen} pref={pref} city={city} setSchool={setSchool} heldFilter={heldFilter} setHeldFilter={setHeldFilter} />;
      case 'detail': return <ScreenDetail onNavigate={setScreen} school={school} heldFilter={heldFilter} setHeldFilter={setHeldFilter} />;
      case 'apply': return <ScreenApply onNavigate={setScreen} school={school} />;
      case 'complete': return <ScreenComplete onNavigate={setScreen} school={school} />;
      case 'inquiry': return <ScreenInquiry onNavigate={setScreen} school={school} />;
      case 'mypage': return <ScreenMypage onNavigate={setScreen} school={school} status={status} coupons={coupons} />;
      case 'schoolAdmin': return <ScreenSchoolAdmin status={status} onAdvance={handleAdvance} onGraduate={handleGraduate} />;
      case 'schoolSettings': return <ScreenSchoolSettings />;
      case 'adminDash': return <ScreenAdminDash />;
      case 'flow': return <ScreenFlow />;
      case 'dataflow': return <ScreenDataFlow />;
      default: return <ScreenLanding onNavigate={setScreen} />;
    }
  };

  const navTitle = (
    <>
      <div className="text-xs font-bold text-slate-400 mb-1">プロトタイプ v1.1</div>
      <div className="font-black text-sm leading-tight">
        ベストBike × 教習所
        <br />
        マッチング
      </div>
    </>
  );

  return (
    // スマホ（md未満）はページ全体を縦にスクロールさせ、PCは左サイドバー＋メイン領域のスクロールにする
    <div
      className="min-h-screen flex flex-col md:flex-row md:h-screen bg-slate-100 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif' }}
    >
      {/* スマホ：プロトタイプ操作用の細いバー。画面一覧は ☰ から開く */}
      <div className="md:hidden bg-slate-900 text-white">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <button
            data-testid="menu-open"
            onClick={() => setMenuOpen(true)}
            aria-label="画面一覧を開く"
            aria-expanded={menuOpen}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-slate-400 leading-tight">プロトタイプ v1.1</div>
            <div className="text-sm font-bold truncate leading-tight">{currentLabel}</div>
          </div>
          <div className="flex-shrink-0 pr-1">
            <StatusPill status={status} />
          </div>
        </div>
      </div>

      <aside className="hidden md:block w-60 bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">{navTitle}</div>
        <PrototypeNav screen={screen} onSelect={selectScreen} status={status} onReset={resetDemo} />
      </aside>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="画面一覧">
          <button
            className="absolute inset-0 w-full h-full bg-black/50 cursor-default"
            onClick={() => setMenuOpen(false)}
            aria-label="画面一覧を閉じる"
            tabIndex={-1}
          />
          <div
            data-testid="drawer"
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-2xl overflow-y-auto overscroll-contain"
          >
            <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>{navTitle}</div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="閉じる"
                className="w-9 h-9 -mr-2 -mt-1 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PrototypeNav screen={screen} onSelect={selectScreen} status={status} onReset={resetDemo} />
          </div>
        </div>
      )}

      <main ref={mainRef} className="flex-1 flex flex-col [&>*]:flex-1 md:block md:overflow-y-auto">
        {render()}
      </main>
    </div>
  );
}
