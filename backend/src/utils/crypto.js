import crypto from "node:crypto";

export const hmac256 = (secret, value) => {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
};

export const safeEqual = (left, right) => {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(String(left), "utf8");
  const rightBuffer = Buffer.from(String(right), "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const hashValue = (value) => {
  return crypto.createHash("sha256").update(value || "").digest("hex");
};

export const makeRef = (prefix = "flow") => {
  const stamp = Date.now().toString(36);
  const tail = crypto.randomBytes(8).toString("hex");
  return `${prefix}_${stamp}_${tail}`;
};

export const makePublicId = () => {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
};
