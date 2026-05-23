export const money = (value, currency = "BRL") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format(Number(value || 0));
};

export const compactDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
};

export const shortId = (value) => {
  if (!value) return "-";
  return String(value).slice(0, 8);
};

export const shortHash = (value) => {
  if (!value) return "-";
  const next = String(value);
  if (next.length <= 16) return next;
  return `${next.slice(0, 8)}...${next.slice(-6)}`;
};
