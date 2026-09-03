import React, { useState } from 'react';
import { X, Award, Gift, Copy, CheckCircle, Sparkles, Tag, ShoppingBag, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const VOUCHER_CATALOG = [
  {
    id: 'v-apollo',
    brand: 'Apollo Pharmacy',
    title: '25% Off Emergency First-Aid & Life-Saving Meds',
    pointsCost: 150,
    category: 'Healthcare',
    codePrefix: 'APOLLO-CARE-',
    color: 'border-red-200 bg-red-50/70 text-red-900',
    iconColor: 'bg-red-600 text-white',
    expiresIn: 'Valid for 30 Days',
  },
  {
    id: 'v-bigbasket',
    brand: 'BigBasket Relief',
    title: '₹200 Off Community Dry Rations & Clean Water Packs',
    pointsCost: 200,
    category: 'Groceries',
    codePrefix: 'BB-HERO-',
    color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
    iconColor: 'bg-emerald-600 text-white',
    expiresIn: 'Valid for 45 Days',
  },
  {
    id: 'v-decathlon',
    brand: 'Decathlon Disaster Gear',
    title: '20% Off Waterproof Ponchos, Heavy Boots & Headlamps',
    pointsCost: 250,
    category: 'Outdoor & Safety',
    codePrefix: 'DECA-SAFE-',
    color: 'border-blue-200 bg-blue-50/70 text-blue-900',
    iconColor: 'bg-blue-600 text-white',
    expiresIn: 'Valid for 60 Days',
  },
  {
    id: 'v-uber',
    brand: 'Uber / Ola SafeRide',
    title: '₹300 Free Evacuation & High-Ground Transit Ride',
    pointsCost: 300,
    category: 'Mobility',
    codePrefix: 'UBER-RESCUE-',
    color: 'border-amber-200 bg-amber-50/70 text-amber-900',
    iconColor: 'bg-amber-600 text-white',
    expiresIn: 'Valid for 14 Days',
  },
  {
    id: 'v-croma',
    brand: 'Croma Emergency Tech',
    title: '15% Off High-Capacity Power Banks & Solar Chargers',
    pointsCost: 100,
    category: 'Electronics',
    codePrefix: 'CROMA-PWR-',
    color: 'border-purple-200 bg-purple-50/70 text-purple-900',
    iconColor: 'bg-purple-600 text-white',
    expiresIn: 'Valid for 30 Days',
  },
];

export default function VolunteerRewardsModal({ user, points, onPointsUpdate, onClose }) {
  const [redeemedVouchers, setRedeemedVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem('crisisconnect_redeemed_vouchers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleRedeem = (item) => {
    if (points < item.pointsCost) {
      toast.error(`Insufficient points! You need ${item.pointsCost - points} more Karma points.`);
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const voucherCode = `${item.codePrefix}${randomSuffix}`;

    const newRedemption = {
      id: `red-${Date.now()}`,
      brand: item.brand,
      title: item.title,
      code: voucherCode,
      redeemedAt: new Date().toLocaleDateString(),
    };

    const updated = [newRedemption, ...redeemedVouchers];
    setRedeemedVouchers(updated);
    try {
      localStorage.setItem('crisisconnect_redeemed_vouchers', JSON.stringify(updated));
    } catch {}

    const newBalance = points - item.pointsCost;
    onPointsUpdate(newBalance);
    toast.success(`🎉 Redeemed ${item.brand} Voucher: ${voucherCode}!`);
  };

  const handleCopy = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast.success(`Voucher code ${code} copied!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner">
              <Award className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                  IMPACT REWARDS STORE
                </span>
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
              </div>
              <h2 className="text-base font-black text-white">
                Volunteer Karma Points
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Balance Card */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Available Balance
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-400">{points}</span>
              <span className="text-xs font-bold text-slate-300">Karma Points</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Level 2 Guardian
            </span>
            <p className="text-[10px] text-slate-400 mt-1">
              +100 pts per volunteer mission
            </p>
          </div>
        </div>

        {/* Scrollable Catalog */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Active Redeemed Vouchers */}
          {redeemedVouchers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                My Active Vouchers ({redeemedVouchers.length})
              </h3>
              <div className="space-y-2">
                {redeemedVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase">{v.brand}</span>
                      <p className="font-mono font-black text-slate-900 text-sm">{v.code}</p>
                      <p className="text-[10px] text-slate-500">Redeemed: {v.redeemedAt}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(v.code)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vouchers Available for Purchase */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Partner Brand Impact Vouchers
            </h3>
            <p className="text-[11px] text-slate-500">
              Leading brands sponsor disaster relief by rewarding civic responders with emergency discounts.
            </p>

            <div className="space-y-2.5">
              {VOUCHER_CATALOG.map((item) => {
                const canAfford = points >= item.pointsCost;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${item.color}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200">
                          {item.brand}
                        </span>
                        <h4 className="font-black text-xs text-slate-900 mt-1.5 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.expiresIn}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 font-black text-sm text-slate-900">
                          <span>{item.pointsCost}</span>
                          <span className="text-[10px] text-amber-600">PTS</span>
                        </div>
                        <button
                          onClick={() => handleRedeem(item)}
                          disabled={!canAfford}
                          className={`mt-2 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            canAfford
                              ? 'bg-slate-900 hover:bg-black text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'Redeem' : 'Need More'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500">
            Earn +100 points for every community mission you sign up for on CrisisConnect.
          </p>
        </div>
      </div>
    </div>
  );
}
