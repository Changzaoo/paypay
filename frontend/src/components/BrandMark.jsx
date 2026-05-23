const sizes = {
  sm: "h-8 w-8 rounded-[12px]",
  md: "h-10 w-10 rounded-[14px]",
  lg: "h-12 w-12 rounded-[16px]"
};

export default function BrandMark({ compact = false, size, className = "" }) {
  const key = size || (compact ? "md" : "md");
  return (
    <img
      src="/paypay-mark.png"
      alt="Paypay"
      className={`${sizes[key] || sizes.md} shrink-0 object-contain ${className}`}
    />
  );
}
