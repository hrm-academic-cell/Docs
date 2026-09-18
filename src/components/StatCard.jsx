export default function StatCard({ label, value, icon, accent = false }) {
  return (
    <div
      className={`rounded-xl p-5 border flex items-center gap-4 font-thai ${
        accent
          ? 'bg-gradient-to-br from-gold-500 to-gold-600 border-gold-600 text-navy-950'
          : 'bg-navy-900 border-navy-700 text-white'
      }`}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <div className={`text-2xl font-bold ${accent ? 'text-navy-950' : 'text-white'}`}>
          {value}
        </div>
        <div className={`text-sm ${accent ? 'text-navy-900/80' : 'text-slate-300'}`}>{label}</div>
      </div>
    </div>
  )
}
