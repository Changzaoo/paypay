export default function AddressInput({ label = "Endereço", value, onChange, placeholder }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="ios-control w-full resize-none px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600"
      />
    </label>
  );
}
