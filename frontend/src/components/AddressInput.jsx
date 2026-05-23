export default function AddressInput({ label = "Endereço", value, onChange, placeholder }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/60"
      />
    </label>
  );
}
