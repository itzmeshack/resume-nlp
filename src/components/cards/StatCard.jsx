export default function StatCard({ icon, label, value, valueClassName = '' }) {
  return (
    <div className="p-4 rounded-xl shadow bg-white/10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className={`text-lg font-bold ${valueClassName}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
