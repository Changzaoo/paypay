export default function BrandMark({ compact = false, className = "" }) {
  return (
    <img
      src={compact ? "/icons/icon-192.png" : "/paypay-logo.png"}
      alt="Paypay"
      className={`${compact ? "h-10 w-10 rounded-[14px]" : "h-10 w-auto"} object-contain ${className}`}
    />
  );
}
