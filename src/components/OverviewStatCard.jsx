export default function OverviewStatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-navy-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}
