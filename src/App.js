import React, { useState } from 'react';
import { 
  MapPin, Star, Search, Filter, ChevronRight, Check, Copy, Calendar,
  Users, TrendingUp, DollarSign, Clock, Bell, Settings, Home, Bike,
  School, FileText, CheckCircle2, XCircle, AlertCircle, ArrowRight,
  ArrowDown, Zap, Gift, Shield, Phone, Mail, User, CreditCard,
  ChevronDown, Heart, Share2, Navigation2, Award, Percent
} from 'lucide-react';

// ===== ダミーデータ =====
const schools = [
  {
    id: 'sch-001',
    name: '湘南台自動車学校',
    area: '神奈川県藤沢市',
    distance: '1.2km',
    rating: 4.7,
    reviewCount: 342,
    priceRange: '¥98,000〜',
    priceMin: 98000,
    thumb: 'from-sky-400 to-blue-600',
    tags: ['普通二輪', '大型二輪', 'AT限定'],
    badge: 'BestBike推薦',
    nearStation: '湘南台駅 徒歩5分',
    capacity: '残り枠 8名',
    openTime: '9:00 - 21:00',
  },
  {
    id: 'sch-002',
    name: 'センチュリーモータースクール横浜',
    area: '神奈川県横浜市西区',
    distance: '3.4km',
    rating: 4.5,
    reviewCount: 218,
    priceRange: '¥105,000〜',
    priceMin: 105000,
    thumb: 'from-orange-400 to-red-500',
    tags: ['普通二輪', '大型二輪'],
    badge: '送迎バスあり',
    nearStation: '横浜駅 徒歩12分',
    capacity: '残り枠 3名',
    openTime: '8:30 - 20:00',
  },
  {
    id: 'sch-003',
    name: 'グリーン自動車学校',
    area: '東京都町田市',
    distance: '8.1km',
    rating: 4.3,
    reviewCount: 156,
    priceRange: '¥112,000〜',
    priceMin: 112000,
    thumb: 'from-emerald-400 to-teal-600',
    tags: ['普通二輪', 'AT限定', '原付講習'],
    badge: '女性講師在籍',
    nearStation: '町田駅 バス15分',
    capacity: '残り枠 12名',
    openTime: '9:00 - 19:30',
  },
  {
    id: 'sch-004',
    name: '府中ドライビングスクール',
    area: '東京都府中市',
    distance: '12.5km',
    rating: 4.6,
    reviewCount: 489,
    priceRange: '¥108,000〜',
    priceMin: 108000,
    thumb: 'from-indigo-400 to-purple-600',
    tags: ['大型二輪', '普通二輪'],
    badge: '最短2週間',
    nearStation: '府中駅 徒歩8分',
    capacity: '残り枠 5名',
    openTime: '9:00 - 21:30',
  },
];

// ===== 共通コンポーネント =====
const BrandLogo = ({ size = 'md' }) => {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-700 rounded-lg flex items-center justify-center">
        <Bike className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      <span className={`font-black tracking-tight ${sizes[size]}`}>
        <span className="text-slate-900">Best</span>
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

// ===== 画面1: LP（トップ） =====
const ScreenLanding = ({ onNavigate }) => (
  <div className="bg-white min-h-full">
    {/* ヘッダー */}
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <BrandLogo />
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <span>教習所を探す</span>
            <span>特典内容</span>
            <span>ご利用の流れ</span>
          </nav>
          <button className="text-sm font-semibold text-slate-700">ログイン</button>
          <button className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            新規登録
          </button>
        </div>
      </div>
    </header>

    {/* ヒーロー */}
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(56,189,248,0.3), transparent 50%), radial-gradient(circle at 80% 70%, rgba(251,146,60,0.2), transparent 50%)'
      }} />
      <div className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1 mb-6">
              <Zap className="w-4 h-4 text-orange-300" />
              <span className="text-xs font-bold text-orange-200">BestBike会員限定 / 特別提携</span>
            </div>
            <h1 className="text-5xl font-black leading-tight mb-6">
              免許取得も、<br />
              バイクライフも、<br />
              <span className="text-sky-400">ここから。</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              BestBike提携教習所で免許取得 →<br />
              以降ずっと、<strong className="text-white">BestBikeが永年10%OFF</strong>。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => onNavigate('list')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-lg flex items-center gap-2"
              >
                教習所を探す <ArrowRight className="w-4 h-4" />
              </button>
              <button className="border border-white/30 hover:bg-white/10 text-white font-semibold px-6 py-3.5 rounded-lg">
                特典を確認する
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-6 h-6 text-orange-300" />
                <span className="font-bold text-lg">限定特典</span>
              </div>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <Percent className="w-8 h-8 text-sky-300" />
                  <div>
                    <div className="text-xs text-slate-300">永年割引</div>
                    <div className="font-bold text-xl">BestBike 10%OFF</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <Shield className="w-8 h-8 text-emerald-300" />
                  <div>
                    <div className="text-xs text-slate-300">標準付帯</div>
                    <div className="font-bold text-xl">立ちゴケ安心制度</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <Award className="w-8 h-8 text-amber-300" />
                  <div>
                    <div className="text-xs text-slate-300">BestBike提携</div>
                    <div className="font-bold text-xl">厳選教習所のみ掲載</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* 3ステップ */}
    <section className="py-16 max-w-6xl mx-auto px-6">
      <h2 className="text-3xl font-black text-center mb-3">たった3ステップ</h2>
      <p className="text-center text-slate-500 mb-12">プラットフォーム利用〜永年割引の獲得まで</p>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { n: '01', title: '教習所を選ぶ', desc: '地図やエリアから、通いやすい提携教習所を選択', icon: MapPin },
          { n: '02', title: 'BestBike経由で申込', desc: '当プラットフォームから申込→教習所側で入会確定', icon: FileText },
          { n: '03', title: '割引コード発行', desc: '入会確定後、BestBikeで永年10%OFFの会員特典が自動付与', icon: Gift },
        ].map((step, i) => (
          <div key={i} className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition">
            <div className="text-6xl font-black text-sky-100 absolute top-4 right-4">{step.n}</div>
            <step.icon className="w-10 h-10 text-sky-600 mb-4 relative" strokeWidth={1.5} />
            <h3 className="font-bold text-xl mb-2 relative">{step.title}</h3>
            <p className="text-sm text-slate-600 relative">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-black mb-4">いま、免許を取るなら。</h2>
        <p className="text-slate-600 mb-8">提携教習所は全国で順次拡大中</p>
        <button 
          onClick={() => onNavigate('list')}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg px-8 py-4 rounded-xl inline-flex items-center gap-2"
        >
          教習所一覧を見る <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  </div>
);

// ===== 画面2: 教習所一覧 =====
const ScreenList = ({ onNavigate, setSelectedSchool }) => {
  const [view, setView] = useState('map');
  return (
    <div className="bg-white min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Shoさん</span>としてログイン中
          </div>
        </div>
      </header>

      {/* 検索バー */}
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-3">
          <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-lg px-4 py-2.5">
            <Search className="w-5 h-5 text-slate-400 mr-2" />
            <input 
              defaultValue="神奈川県 横浜市"
              className="flex-1 outline-none text-sm"
              placeholder="エリア・駅名で検索"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold">
            <Filter className="w-4 h-4" /> 絞り込み
          </button>
          <div className="flex bg-white border border-slate-300 rounded-lg overflow-hidden">
            <button 
              onClick={() => setView('map')}
              className={`px-4 py-2.5 text-sm font-semibold ${view === 'map' ? 'bg-sky-600 text-white' : 'text-slate-600'}`}
            >
              地図
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-4 py-2.5 text-sm font-semibold ${view === 'list' ? 'bg-sky-600 text-white' : 'text-slate-600'}`}
            >
              リスト
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black">提携教習所 {schools.length}件</h1>
            <p className="text-sm text-slate-500">現在地から近い順に表示</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">並び替え:</span>
            <button className="font-semibold flex items-center gap-1">距離順 <ChevronDown className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* 左: 地図（プレースホルダ） */}
          {view === 'map' && (
            <div className="md:col-span-2 relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl overflow-hidden border border-slate-300" style={{ minHeight: '600px' }}>
              {/* 簡易マップ背景 */}
              <div className="absolute inset-0 opacity-60" style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(148,163,184,0.15) 30px, rgba(148,163,184,0.15) 31px),
                  repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(148,163,184,0.15) 30px, rgba(148,163,184,0.15) 31px),
                  linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #dcfce7 100%)
                `
              }} />
              {/* 道路風ライン */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
                <path d="M 50 100 Q 200 150 350 200 T 380 550" stroke="#94a3b8" strokeWidth="4" fill="none" opacity="0.4" />
                <path d="M 0 350 L 400 300" stroke="#94a3b8" strokeWidth="3" fill="none" opacity="0.4" />
                <path d="M 150 0 L 200 600" stroke="#94a3b8" strokeWidth="3" fill="none" opacity="0.4" />
              </svg>
              {/* ピン */}
              {[
                { top: '20%', left: '30%', id: 0 },
                { top: '45%', left: '55%', id: 1 },
                { top: '65%', left: '25%', id: 2 },
                { top: '80%', left: '70%', id: 3 },
              ].map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => { setSelectedSchool(schools[pin.id]); onNavigate('detail'); }}
                  className="absolute -translate-x-1/2 -translate-y-full group"
                  style={{ top: pin.top, left: pin.left }}
                >
                  <div className="relative">
                    <div className="bg-sky-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-sky-600" />
                  </div>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    {schools[pin.id].name}
                  </div>
                </button>
              ))}
              {/* 現在地 */}
              <div className="absolute" style={{ top: '50%', left: '40%' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75 w-4 h-4" />
                  <div className="bg-blue-600 border-2 border-white rounded-full w-4 h-4 relative" />
                </div>
              </div>
              {/* 凡例 */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white" />現在地</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-sky-600 rounded-full" />提携教習所</div>
              </div>
            </div>
          )}

          {/* リスト */}
          <div className={view === 'map' ? 'md:col-span-3 space-y-4' : 'md:col-span-5 grid md:grid-cols-2 gap-4'}>
            {schools.map((school) => (
              <button
                key={school.id}
                onClick={() => { setSelectedSchool(school); onNavigate('detail'); }}
                className="text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-sky-300 transition"
              >
                <div className="flex">
                  <div className={`w-32 bg-gradient-to-br ${school.thumb} flex items-center justify-center`}>
                    <School className="w-12 h-12 text-white/80" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-base">{school.name}</h3>
                      <Heart className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{school.area} / {school.distance}
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{school.rating}</span>
                        <span className="text-slate-400">({school.reviewCount})</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{school.capacity}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {school.tags.slice(0, 3).map(t => <Pill key={t} color="slate">{t}</Pill>)}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <Pill color="orange">{school.badge}</Pill>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">普通二輪</div>
                        <div className="font-black text-sky-700">{school.priceRange}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== 画面3: 教習所詳細 =====
const ScreenDetail = ({ onNavigate, school }) => {
  if (!school) school = schools[0];
  return (
    <div className="bg-slate-50 min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <button onClick={() => onNavigate('list')} className="text-sm text-sky-600 font-semibold">
            ← 一覧に戻る
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* ヒーロー画像 */}
        <div className={`h-64 bg-gradient-to-br ${school.thumb} rounded-2xl relative overflow-hidden mb-6`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="bg-white/90 backdrop-blur rounded-lg p-2"><Heart className="w-4 h-4" /></button>
            <button className="bg-white/90 backdrop-blur rounded-lg p-2"><Share2 className="w-4 h-4" /></button>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <Pill color="orange">{school.badge}</Pill>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* タイトル */}
            <div>
              <h1 className="text-3xl font-black mb-2">{school.name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{school.rating}</span>
                  <span>({school.reviewCount}件)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{school.area}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {school.tags.map(t => <Pill key={t} color="sky">{t}</Pill>)}
              </div>
            </div>

            {/* 特典バナー */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Gift className="w-8 h-8 text-orange-500 flex-shrink-0" />
                <div>
                  <div className="font-black text-lg text-orange-900">BestBike経由入会の特典</div>
                  <div className="text-sm text-orange-800 mt-1">
                    当プラットフォーム経由で入会すると、入会確定時に<strong>BestBikeレンタル永年10%OFFコード</strong>を発行。免許取得後のバイクライフが、ずっとおトクに。
                  </div>
                </div>
              </div>
            </div>

            {/* 料金 */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="font-bold text-lg mb-4">料金プラン</h2>
              <div className="space-y-3">
                {[
                  { name: '普通二輪MT', price: 98000, duration: '約3週間' },
                  { name: '普通二輪AT限定', price: 92000, duration: '約2週間' },
                  { name: '大型二輪', price: 135000, duration: '約4週間' },
                ].map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="font-semibold">{plan.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{plan.duration}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg">¥{plan.price.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">税込</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* アクセス */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="font-bold text-lg mb-3">アクセス・営業時間</h2>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3"><MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />{school.area} / {school.nearStation}</div>
                <div className="flex gap-3"><Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />営業時間 {school.openTime}</div>
                <div className="flex gap-3"><Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />0466-XX-XXXX</div>
              </div>
            </section>
          </div>

          {/* 右: 申込カード（sticky） */}
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sticky top-4 shadow-sm">
              <div className="text-xs text-slate-500 mb-1">普通二輪MT</div>
              <div className="text-3xl font-black mb-1">{school.priceRange}</div>
              <div className="text-xs text-slate-500 mb-4">BestBike経由での料金</div>

              <div className="bg-sky-50 rounded-lg p-3 mb-4 text-xs">
                <div className="font-bold text-sky-900 mb-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />BestBike経由のメリット
                </div>
                <ul className="text-sky-800 space-y-0.5">
                  <li>・BestBike永年10%OFFコード付与</li>
                  <li>・入会手続きをオンライン完結</li>
                  <li>・入会後のステータス管理可能</li>
                </ul>
              </div>

              <button 
                onClick={() => onNavigate('form')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl mb-2"
              >
                この教習所に申し込む
              </button>
              <button className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl text-sm">
                資料請求
              </button>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
                申込み時点では課金されません
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== 画面4: 入会申込フォーム =====
const ScreenForm = ({ onNavigate, school }) => {
  if (!school) school = schools[0];
  return (
    <div className="bg-slate-50 min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <button onClick={() => onNavigate('detail')} className="text-sm text-slate-500">← 戻る</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* ステップ */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['情報入力', '確認', '完了'].map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i + 1}
                </div>
                <div className={`text-xs mt-1 font-semibold ${i === 0 ? 'text-sky-700' : 'text-slate-400'}`}>{label}</div>
              </div>
              {i < 2 && <div className="w-16 h-0.5 bg-slate-200 -mt-5" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
          <h1 className="text-2xl font-black mb-1">入会申込フォーム</h1>
          <div className="text-sm text-slate-500 mb-6">{school.name}</div>

          {/* 選択教習所の確認 */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 mb-6 border border-slate-200">
            <div className={`w-12 h-12 bg-gradient-to-br ${school.thumb} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <School className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{school.name}</div>
              <div className="text-xs text-slate-500">{school.area}</div>
            </div>
            <button className="text-xs text-sky-600 font-semibold">変更</button>
          </div>

          {/* コース選択 */}
          <div className="mb-5">
            <label className="block text-sm font-bold mb-2">希望コース<span className="text-red-500 ml-1">*</span></label>
            <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500">
              <option>普通二輪MT / ¥98,000</option>
              <option>普通二輪AT限定 / ¥92,000</option>
              <option>大型二輪 / ¥135,000</option>
            </select>
          </div>

          {/* 個人情報 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-bold mb-2">姓<span className="text-red-500 ml-1">*</span></label>
              <input defaultValue="佐藤" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">名<span className="text-red-500 ml-1">*</span></label>
              <input defaultValue="翔" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold mb-2">生年月日<span className="text-red-500 ml-1">*</span></label>
            <input defaultValue="1992-09-22" type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold mb-2">
              メールアドレス<span className="text-red-500 ml-1">*</span>
              <span className="text-xs text-slate-500 ml-2 font-normal">BestBike会員と連携</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input defaultValue="sho@baller.inc" className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold mb-2">電話番号<span className="text-red-500 ml-1">*</span></label>
            <input defaultValue="090-XXXX-XXXX" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold mb-2">希望入校日</label>
            <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" />
            <div className="text-xs text-slate-500 mt-1">※教習所側で調整後、正式な入校日が確定</div>
          </div>

          {/* BestBike会員連携 */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 accent-sky-600" />
              <div className="flex-1">
                <div className="font-bold text-sm text-sky-900">BestBike会員として登録・連携する</div>
                <div className="text-xs text-sky-800 mt-1">
                  この申込情報でBestBike会員を作成（または既存会員と連携）。入会確定後、永年10%OFFの会員特典が自動付与される。
                </div>
              </div>
            </label>
          </div>

          {/* 規約 */}
          <div className="mb-6 text-xs text-slate-600 space-y-2">
            <label className="flex gap-2"><input type="checkbox" />教習所の規約・キャンセルポリシーに同意する</label>
            <label className="flex gap-2"><input type="checkbox" />BestBikeのプライバシーポリシーに同意する</label>
          </div>

          <button 
            onClick={() => onNavigate('complete')}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl"
          >
            入会申込み内容を確認する
          </button>
        </div>

        <div className="text-xs text-slate-500 text-center">
          この時点では課金されません。教習所が申込を承認した時点で、正式な入会手続きに進みます
        </div>
      </div>
    </div>
  );
};

// ===== 画面5: 申込完了 =====
const ScreenComplete = ({ onNavigate }) => (
  <div className="bg-slate-50 min-h-full">
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-2xl mx-auto px-6 py-4"><BrandLogo /></div>
    </header>

    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-black mb-2">申込を受け付けました</h1>
        <p className="text-slate-600 mb-6">
          湘南台自動車学校に入会申込を送信しました。<br />
          教習所側で内容を確認後、ご登録のメールアドレスに連絡が届きます。
        </p>

        <div className="bg-slate-50 rounded-xl p-4 text-left text-sm mb-6">
          <div className="font-bold mb-2">申込番号</div>
          <div className="font-mono text-lg">BB-EDU-2026-04221138</div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-orange-900">次のステップ</span>
          </div>
          <div className="space-y-2 text-sm text-orange-900">
            <div className="flex gap-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <div>教習所が申込を確認（通常1〜2営業日）</div>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <div>入校日調整・初回連絡が入る</div>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <div>教習所側で<strong>入会確定</strong> → BestBike 10%OFFコードが自動発行</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => onNavigate('mypage')}
          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl"
        >
          マイページで状況を確認
        </button>
        <button 
          onClick={() => onNavigate('landing')}
          className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl"
        >
          トップに戻る
        </button>
      </div>
    </div>
  </div>
);

// ===== 画面6: マイページ =====
const ScreenMypage = ({ onNavigate }) => {
  const [status] = useState('approved'); // 'pending' | 'approved'
  return (
    <div className="bg-slate-50 min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-500" />
            <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center font-bold text-sm">S</div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-black mb-6">マイページ</h1>

        {/* 特典コード（入会確定後のみ表示） */}
        {status === 'approved' && (
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Gift className="w-48 h-48" strokeWidth={1} />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-orange-300" />
                <span className="text-sm font-bold text-orange-300">教習所入会特典 取得済</span>
              </div>
              <h2 className="text-2xl font-black mb-1">BestBike 永年10%OFF</h2>
              <div className="text-sm text-slate-300 mb-4">次回以降のレンタル料金から自動で10%OFF</div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300 mb-1">クーポンコード</div>
                  <div className="font-mono text-2xl font-black tracking-wider">EDU10-SHO-2026</div>
                </div>
                <button className="bg-white text-slate-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <Copy className="w-4 h-4" />コピー
                </button>
              </div>
              <div className="text-xs text-slate-300 mt-3">
                ※ BestBikeアカウント（sho@baller.inc）に自動適用済。次回予約時から有効。
              </div>
            </div>
          </div>
        )}

        {/* 申込状況 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">教習所 申込状況</h2>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <School className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-bold">湘南台自動車学校</div>
                {status === 'approved' ? (
                  <Pill color="emerald">入会確定</Pill>
                ) : (
                  <Pill color="amber">確認中</Pill>
                )}
              </div>
              <div className="text-sm text-slate-500 mb-2">普通二輪MT / ¥98,000</div>
              <div className="text-xs text-slate-400">申込番号: BB-EDU-2026-04221138</div>
            </div>
          </div>

          {/* ステータスタイムライン */}
          <div className="border-t border-slate-100 pt-4">
            <div className="space-y-3">
              {[
                { label: '申込受付', date: '2026/04/22 11:38', done: true },
                { label: '教習所による確認', date: '2026/04/23 10:15', done: true },
                { label: '入校日確定', date: '2026/04/24 14:00', done: true },
                { label: '入会確定・特典発行', date: '2026/04/25 09:00', done: status === 'approved' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    {step.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${step.done ? 'font-bold text-slate-900' : 'text-slate-400'}`}>{step.label}</div>
                    {step.done && <div className="text-xs text-slate-400">{step.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BestBikeへのリンク */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg mb-1">BestBikeレンタル予約</h2>
              <p className="text-sm text-slate-500">10%OFFコード適用済。いつでも予約可能。</p>
            </div>
            <button className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm">
              予約する <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== 画面7: 教習所管理ダッシュボード =====
const ScreenSchoolAdmin = () => (
  <div className="bg-slate-100 min-h-full">
    <header className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <School className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold">湘南台自動車学校 管理画面</span>
          <Pill color="sky">BestBike提携</Pill>
        </div>
        <div className="text-sm text-slate-300">管理者: admin@shonandai-ds.jp</div>
      </div>
    </header>

    <div className="max-w-6xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-black mb-6">BestBike経由の入会申込</h1>

      {/* サマリー */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '今月の新規申込', value: '12', unit: '件', color: 'sky' },
          { label: '承認待ち', value: '3', unit: '件', color: 'amber' },
          { label: '入会確定', value: '9', unit: '件', color: 'emerald' },
          { label: 'BestBikeへの紹介料', value: '45,000', unit: '円', color: 'slate' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
            <div className="flex items-baseline gap-1">
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.unit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 申込一覧 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold">申込一覧</h2>
          <div className="flex gap-2">
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-1.5">
              <option>すべて</option>
              <option>承認待ち</option>
              <option>入会確定</option>
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left p-3 font-semibold">申込番号</th>
              <th className="text-left p-3 font-semibold">氏名</th>
              <th className="text-left p-3 font-semibold">コース</th>
              <th className="text-left p-3 font-semibold">申込日</th>
              <th className="text-left p-3 font-semibold">ステータス</th>
              <th className="text-left p-3 font-semibold">アクション</th>
            </tr>
          </thead>
          <tbody>
            {[
              { no: 'BB-EDU-2026-04221138', name: '佐藤 翔', course: '普通二輪MT', date: '04/22', status: 'pending' },
              { no: 'BB-EDU-2026-04201024', name: '田中 裕一', course: '大型二輪', date: '04/20', status: 'confirmed' },
              { no: 'BB-EDU-2026-04191455', name: '鈴木 花子', course: '普通二輪AT', date: '04/19', status: 'confirmed' },
              { no: 'BB-EDU-2026-04181730', name: '山田 太郎', course: '普通二輪MT', date: '04/18', status: 'rejected' },
            ].map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{row.no}</td>
                <td className="p-3 font-semibold">{row.name}</td>
                <td className="p-3">{row.course}</td>
                <td className="p-3 text-slate-500">{row.date}</td>
                <td className="p-3">
                  {row.status === 'pending' && <Pill color="amber">確認中</Pill>}
                  {row.status === 'confirmed' && <Pill color="emerald">入会確定</Pill>}
                  {row.status === 'rejected' && <Pill color="slate">キャンセル</Pill>}
                </td>
                <td className="p-3">
                  {row.status === 'pending' && (
                    <div className="flex gap-1">
                      <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded">
                        入会確定
                      </button>
                      <button className="border border-slate-300 text-slate-600 text-xs px-3 py-1 rounded">
                        詳細
                      </button>
                    </div>
                  )}
                  {row.status !== 'pending' && (
                    <button className="text-xs text-sky-600 font-semibold">詳細</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm text-sky-900">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>「入会確定」ボタンを押すと、</strong>BestBikeに対して¥5,000の紹介料が自動で計上され、同時にユーザーへ10%OFFコードが発行される。誤操作を防ぐため、確定後の取消しは運営への連絡が必要。
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===== 画面8: BestBike運営ダッシュボード =====
const ScreenBestBikeAdmin = () => (
  <div className="bg-slate-100 min-h-full">
    <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <Pill color="orange">運営管理</Pill>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>管理者: Sho</span>
          <Settings className="w-5 h-5" />
        </div>
      </div>
    </header>

    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-black mb-6">マッチング運営ダッシュボード</h1>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '今月の入会確定', value: '87', unit: '件', trend: '+23%', icon: Users, color: 'sky' },
          { label: '紹介料 売上', value: '435,000', unit: '円', trend: '+23%', icon: DollarSign, color: 'emerald' },
          { label: '発行済特典コード', value: '87', unit: '件', trend: '+23%', icon: Gift, color: 'orange' },
          { label: '提携教習所', value: '24', unit: '校', trend: '+3', icon: School, color: 'indigo' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="w-8 h-8 text-sky-600" strokeWidth={1.5} />
              <Pill color="emerald">{kpi.trend}</Pill>
            </div>
            <div className="text-xs text-slate-500">{kpi.label}</div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-black">{kpi.value}</div>
              <div className="text-sm text-slate-500">{kpi.unit}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* グラフエリア（簡易） */}
        <div className="md:col-span-2 bg-white rounded-xl p-5 border border-slate-200">
          <h2 className="font-bold mb-4">月次の入会確定数推移</h2>
          <div className="flex items-end justify-between gap-2 h-48">
            {[
              { m: '10月', v: 30 }, { m: '11月', v: 45 }, { m: '12月', v: 38 },
              { m: '1月', v: 52 }, { m: '2月', v: 61 }, { m: '3月', v: 71 },
              { m: '4月', v: 87 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-bold">{bar.v}</div>
                <div 
                  className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-t"
                  style={{ height: `${bar.v * 2}px` }}
                />
                <div className="text-xs text-slate-500">{bar.m}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ランキング */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <h2 className="font-bold mb-4">提携教習所ランキング（今月）</h2>
          <div className="space-y-3">
            {[
              { name: '府中ドライビングスクール', count: 18 },
              { name: '湘南台自動車学校', count: 15 },
              { name: 'センチュリー横浜', count: 12 },
              { name: 'グリーン町田', count: 9 },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 text-sm font-semibold truncate">{row.name}</div>
                <div className="text-sm font-black">{row.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近の入会確定 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold">最近の入会確定（リアルタイム）</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left p-3 font-semibold">確定日時</th>
              <th className="text-left p-3 font-semibold">教習所</th>
              <th className="text-left p-3 font-semibold">ユーザー</th>
              <th className="text-left p-3 font-semibold">発行コード</th>
              <th className="text-right p-3 font-semibold">紹介料</th>
            </tr>
          </thead>
          <tbody>
            {[
              { t: '04/22 09:00', s: '湘南台自動車学校', u: 'sho@baller.inc', c: 'EDU10-SHO-2026' },
              { t: '04/21 17:30', s: '府中ドライビングスクール', u: 'ta***@gmail.com', c: 'EDU10-TK-2026' },
              { t: '04/21 14:15', s: '府中ドライビングスクール', u: 'yu***@icloud.com', c: 'EDU10-YM-2026' },
              { t: '04/20 11:00', s: 'センチュリー横浜', u: 'hi***@yahoo.co.jp', c: 'EDU10-HS-2026' },
            ].map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-3 text-xs text-slate-500 font-mono">{row.t}</td>
                <td className="p-3 font-semibold">{row.s}</td>
                <td className="p-3 text-slate-600">{row.u}</td>
                <td className="p-3 font-mono text-xs">{row.c}</td>
                <td className="p-3 text-right font-bold text-emerald-700">+¥5,000</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ===== 画面9: 画面遷移図 =====
const ScreenFlowDiagram = () => (
  <div className="bg-slate-50 min-h-full p-8">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-2">画面遷移図</h1>
      <p className="text-slate-600 mb-8">ユーザーがプラットフォームに訪問 → 特典コード獲得までの画面フロー</p>

      <div className="bg-white rounded-2xl p-8 border border-slate-200">
        {/* フロー図 */}
        <div className="space-y-6">
          {/* Row 1 */}
          <div className="flex items-center gap-4 justify-center">
            <FlowBox color="sky" num="1" title="LP / トップ" sub="提携教習所の一覧入口" />
            <ArrowRight className="w-6 h-6 text-slate-400" />
            <FlowBox color="sky" num="2" title="教習所一覧" sub="地図 + リスト / フィルター" />
            <ArrowRight className="w-6 h-6 text-slate-400" />
            <FlowBox color="sky" num="3" title="教習所詳細" sub="料金 / 口コミ / 特典説明" />
          </div>

          {/* 接続線 */}
          <div className="flex justify-end pr-16">
            <ArrowDown className="w-6 h-6 text-slate-400" />
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-4 justify-center">
            <FlowBox color="orange" num="4" title="入会申込フォーム" sub="個人情報 / BestBike連携" />
            <ArrowRight className="w-6 h-6 text-slate-400" />
            <FlowBox color="orange" num="5" title="申込完了" sub="申込番号発行" />
          </div>

          {/* 分岐 */}
          <div className="flex justify-center gap-32">
            <div className="flex flex-col items-center">
              <ArrowDown className="w-6 h-6 text-slate-400" />
              <div className="text-xs font-bold text-slate-500 mt-1">ユーザー側</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowDown className="w-6 h-6 text-slate-400" />
              <div className="text-xs font-bold text-slate-500 mt-1">教習所側</div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex items-start gap-8 justify-center">
            <div className="flex flex-col items-center gap-3">
              <FlowBox color="slate" num="6a" title="マイページ" sub="申込ステータス確認" />
              <div className="text-xs text-slate-400">入会確定を待つ</div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <FlowBox color="emerald" num="6b" title="教習所管理画面" sub="申込確認 → 入会確定" />
              <div className="text-xs text-slate-400">教習所の担当者が操作</div>
            </div>
          </div>

          {/* 合流 */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <div className="h-8 border-l-2 border-r-2 border-t-2 border-slate-300 rounded-t-xl mx-24" />
              <div className="flex justify-center -mt-3">
                <ArrowDown className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Row 4: 自動処理 */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-dashed border-orange-400 rounded-xl px-6 py-4 text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Zap className="w-4 h-4 text-orange-600" />
                <div className="font-bold text-orange-900">システム自動処理</div>
              </div>
              <div className="text-xs text-orange-800">
                紹介料¥5,000を教習所へ請求計上 / BestBike会員に10%OFFコード自動発行
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-slate-400" />
          </div>

          {/* Row 5 */}
          <div className="flex items-center gap-4 justify-center">
            <FlowBox color="emerald" num="7" title="マイページ（特典表示）" sub="永年10%OFFコード表示・コピー" big />
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-slate-400" />
          </div>

          {/* Row 6 */}
          <div className="flex items-center gap-4 justify-center">
            <FlowBox color="sky" num="8" title="BestBike本体サイト（既存）" sub="予約時に10%OFF自動適用" />
          </div>
        </div>

        {/* 凡例 */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex gap-6 text-xs flex-wrap">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-500 rounded" />情報閲覧フェーズ</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded" />申込フェーズ</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded" />確定・特典フェーズ</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-500 rounded" />待機・管理</div>
        </div>
      </div>
    </div>
  </div>
);

const FlowBox = ({ color = 'sky', num, title, sub, big = false }) => {
  const colors = {
    sky: 'bg-sky-50 border-sky-400 text-sky-900',
    orange: 'bg-orange-50 border-orange-400 text-orange-900',
    emerald: 'bg-emerald-50 border-emerald-400 text-emerald-900',
    slate: 'bg-slate-50 border-slate-400 text-slate-900',
  };
  const badgeColors = {
    sky: 'bg-sky-500', orange: 'bg-orange-500', emerald: 'bg-emerald-500', slate: 'bg-slate-500',
  };
  return (
    <div className={`relative border-2 rounded-xl p-4 ${colors[color]} ${big ? 'w-80' : 'w-56'}`}>
      <div className={`absolute -top-3 -left-3 w-7 h-7 ${badgeColors[color]} text-white rounded-full flex items-center justify-center text-xs font-black`}>
        {num}
      </div>
      <div className="font-bold text-sm mb-0.5">{title}</div>
      <div className="text-xs opacity-80">{sub}</div>
    </div>
  );
};

// ===== 画面10: データフロー図 =====
const ScreenDataFlow = () => (
  <div className="bg-slate-50 min-h-full p-8">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-2">データフロー図</h1>
      <p className="text-slate-600 mb-8">「入会確定」というキートリガーから、紹介料・割引特典が発生する仕組み</p>

      <div className="bg-white rounded-2xl p-8 border border-slate-200">
        {/* 3つのアクター */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* ユーザー */}
          <div className="text-center">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-10 h-10 text-sky-600" />
            </div>
            <div className="font-bold">ユーザー</div>
            <div className="text-xs text-slate-500">バイク免許取得希望者</div>
          </div>
          {/* BestBikeプラットフォーム */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bike className="w-10 h-10 text-white" />
            </div>
            <div className="font-bold">BestBike マッチング</div>
            <div className="text-xs text-slate-500">当プラットフォーム</div>
          </div>
          {/* 教習所 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <School className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="font-bold">提携教習所</div>
            <div className="text-xs text-slate-500">全国24校（仮）</div>
          </div>
        </div>

        {/* データフロー一覧 */}
        <div className="space-y-3">
          <DataFlowRow
            from="ユーザー"
            to="BestBike"
            event="申込"
            desc="教習所選択 + 個人情報・メール送信"
            direction="right"
          />
          <DataFlowRow
            from="BestBike"
            to="教習所"
            event="申込情報連携"
            desc="申込番号 / ユーザー情報 / 希望コース"
            direction="right2"
          />
          <DataFlowRow
            from="教習所"
            to="ユーザー"
            event="入校日調整"
            desc="教習所担当者が直接連絡（メール or 電話）"
            direction="long-left"
          />
          <div className="relative py-2">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-slate-300" />
            <div className="relative flex justify-center">
              <div className="bg-amber-100 border border-amber-300 rounded-full px-4 py-1 text-xs font-bold text-amber-900">
                ⚡ キー操作：教習所が「入会確定」ボタンを押す
              </div>
            </div>
          </div>
          <DataFlowRow
            from="教習所"
            to="BestBike"
            event="入会確定通知"
            desc="ステータス更新 (pending → confirmed)"
            direction="left"
            highlight
          />
          <DataFlowRow
            from="BestBike"
            to="BestBike"
            event="紹介料計上（内部）"
            desc="教習所あてに¥5,000の請求レコードを生成"
            direction="self"
            highlight
          />
          <DataFlowRow
            from="BestBike"
            to="ユーザー"
            event="10%OFFコード発行"
            desc="会員アカウントに永年割引属性を自動付与 + 通知メール送信"
            direction="long-left-b"
            highlight
          />
        </div>

        {/* ポイント解説 */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <div className="font-bold text-sky-900 mb-1 text-sm">① 申込段階</div>
            <div className="text-xs text-sky-800">
              この時点ではお金は動かない。BestBikeは「申込レコード」を作り、教習所に通知するだけ。
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="font-bold text-amber-900 mb-1 text-sm">② 入会確定ボタン</div>
            <div className="text-xs text-amber-800">
              教習所側が管理画面で押す。ここが唯一の「紹介料発生トリガー」。不正防止のため入校日確定後の操作を推奨。
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="font-bold text-emerald-900 mb-1 text-sm">③ 特典の自動付与</div>
            <div className="text-xs text-emerald-800">
              確定トリガーで、紹介料計上と10%OFFコード発行が同時実行される。手動オペは不要。
            </div>
          </div>
        </div>
      </div>

      {/* テーブル設計の概要 */}
      <div className="mt-6 bg-white rounded-2xl p-8 border border-slate-200">
        <h2 className="text-xl font-black mb-4">最小DBテーブル設計（概略）</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <TableSchema
            name="schools"
            desc="提携教習所マスタ"
            fields={['id', 'name', 'area', 'lat/lng', 'courses[]', 'price_table', 'status']}
          />
          <TableSchema
            name="applications"
            desc="入会申込レコード"
            fields={['id', 'user_id', 'school_id', 'course', 'status', 'applied_at', 'confirmed_at']}
          />
          <TableSchema
            name="users"
            desc="ユーザー（BestBike会員と同一 or 連携）"
            fields={['id', 'email', 'name', 'bestbike_discount_rate', 'discount_code']}
          />
          <TableSchema
            name="referral_fees"
            desc="紹介料請求レコード（入会確定で自動生成）"
            fields={['id', 'application_id', 'school_id', 'amount=5000', 'billed_month', 'status']}
          />
        </div>
      </div>
    </div>
  </div>
);

const DataFlowRow = ({ from, to, event, desc, direction, highlight }) => {
  const arrow = {
    right: '→',
    'right2': '→',
    left: '←',
    'long-left': '← （教習所から直接連絡）',
    'long-left-b': '←',
    self: '↺',
  };
  return (
    <div className={`grid grid-cols-12 gap-3 items-center py-2 px-3 rounded-lg ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
      <div className="col-span-2 text-xs font-bold text-right">{from}</div>
      <div className="col-span-1 text-center text-2xl text-slate-400">{arrow[direction]}</div>
      <div className="col-span-2 text-xs font-bold">{to}</div>
      <div className="col-span-7">
        <div className="text-sm font-bold">{event}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
};

const TableSchema = ({ name, desc, fields }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <div className="bg-slate-800 text-white px-4 py-2">
      <div className="font-mono font-bold text-sm">{name}</div>
      <div className="text-xs text-slate-400">{desc}</div>
    </div>
    <div className="p-3 bg-slate-50 text-xs font-mono space-y-0.5">
      {fields.map(f => <div key={f} className="text-slate-700">• {f}</div>)}
    </div>
  </div>
);

// ===== メインアプリ =====
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [selectedSchool, setSelectedSchool] = useState(schools[0]);

  const screens = [
    { id: 'landing', label: 'LP（トップ）', icon: Home, category: 'user' },
    { id: 'list', label: '教習所一覧', icon: Search, category: 'user' },
    { id: 'detail', label: '教習所詳細', icon: School, category: 'user' },
    { id: 'form', label: '入会申込フォーム', icon: FileText, category: 'user' },
    { id: 'complete', label: '申込完了', icon: CheckCircle2, category: 'user' },
    { id: 'mypage', label: 'マイページ', icon: User, category: 'user' },
    { id: 'schoolAdmin', label: '教習所管理画面', icon: School, category: 'admin' },
    { id: 'bestbikeAdmin', label: 'BestBike運営画面', icon: TrendingUp, category: 'admin' },
    { id: 'flow', label: '画面遷移図', icon: Navigation2, category: 'doc' },
    { id: 'dataflow', label: 'データフロー図', icon: Zap, category: 'doc' },
  ];

  const renderScreen = () => {
    const nav = (id) => setCurrentScreen(id);
    switch (currentScreen) {
      case 'landing': return <ScreenLanding onNavigate={nav} />;
      case 'list': return <ScreenList onNavigate={nav} setSelectedSchool={setSelectedSchool} />;
      case 'detail': return <ScreenDetail onNavigate={nav} school={selectedSchool} />;
      case 'form': return <ScreenForm onNavigate={nav} school={selectedSchool} />;
      case 'complete': return <ScreenComplete onNavigate={nav} />;
      case 'mypage': return <ScreenMypage onNavigate={nav} />;
      case 'schoolAdmin': return <ScreenSchoolAdmin />;
      case 'bestbikeAdmin': return <ScreenBestBikeAdmin />;
      case 'flow': return <ScreenFlowDiagram />;
      case 'dataflow': return <ScreenDataFlow />;
      default: return <ScreenLanding onNavigate={nav} />;
    }
  };

  const categories = {
    user: { label: 'ユーザー向け画面', color: 'text-sky-600' },
    admin: { label: '管理画面', color: 'text-orange-600' },
    doc: { label: 'ドキュメント', color: 'text-emerald-600' },
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif' }}>
      {/* サイドバー */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-400 mb-1">プロトタイプ</div>
          <div className="font-black text-sm leading-tight">BestBike × 教習所<br />マッチング</div>
        </div>
        <div className="p-3">
          {Object.entries(categories).map(([catId, cat]) => (
            <div key={catId} className="mb-4">
              <div className={`text-xs font-bold px-3 py-1 ${cat.color}`}>{cat.label}</div>
              {screens.filter(s => s.category === catId).map(screen => (
                <button
                  key={screen.id}
                  onClick={() => setCurrentScreen(screen.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left mb-0.5 transition ${
                    currentScreen === screen.id 
                      ? 'bg-slate-900 text-white font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <screen.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{screen.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* メイン */}
      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>
    </div>
  );
}