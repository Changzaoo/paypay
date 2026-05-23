import { Check, Circle, Loader2, X } from "lucide-react";
import { progressForStatus, stepForStatus } from "../lib/progress";

const stateRank = {
  CREATED: 0,
  WAITING_PAYMENT: 1,
  PAYMENT_CONFIRMED: 2,
  WAITING_INTERMEDIATE_SETTLEMENT: 3,
  WAITING_MANUAL_STEP: 4,
  INTERMEDIATE_RECEIVED: 4,
  INTERMEDIATE_CONVERSION_STARTED: 4,
  INTERMEDIATE_CONVERSION_DONE: 5,
  FINAL_SHIFT_CREATED: 5,
  WAITING_FINAL_DEPOSIT: 6,
  FINAL_PROCESSING: 6,
  COMPLETED: 7,
  FAILED: 4,
  EXPIRED: 1,
  REFUNDED: 1,
  CANCELLED: 1
};

const labels = ["PIX", "Entrada", "Confirmado", "DePix", "USDT L", "Shift", "Envio", "Final"];
const colors = ["#64748b", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4"];
const terminal = new Set(["FAILED", "EXPIRED", "REFUNDED", "CANCELLED"]);

export default function FlowStepper({ status, dense = false, plain = false }) {
  const current = Math.min(stateRank[status] ?? 0, labels.length - 1);
  const percent = progressForStatus(status);
  return (
    <div className={`flow-stepper ${dense ? "flow-stepper-dense" : ""}`}>
      {!plain && (
        <div className="flow-stepper-head">
          <span>{percent}%</span>
          <span>{stepForStatus(status) || labels[current] || "PIX"}</span>
        </div>
      )}
      <div className="flow-stepper-path">
        <div className="flow-stepper-line" />
        <div className="flow-stepper-active" style={{ width: `${percent}%` }} />
        <div className="flow-stepper-steps">
          {labels.map((label, index) => {
            const isDone = status === "COMPLETED" || index < current;
            const isCurrent = index === current && status !== "COMPLETED";
            const isError = terminal.has(status) && index === current;
            return (
              <div key={label} className="flow-step" style={{ "--step-color": colors[index] }}>
                <div className={`flow-step-node ${isDone ? "flow-step-done" : ""} ${isCurrent ? "flow-step-current" : ""} ${isError ? "flow-step-error" : ""}`}>
                  {isDone ? <Check size={dense ? 10 : 12} /> : isError ? <X size={dense ? 10 : 12} /> : isCurrent ? <Loader2 size={dense ? 10 : 12} className="animate-spin" /> : <Circle size={dense ? 8 : 10} />}
                </div>
                <div className="flow-step-number" style={{ color: isDone || isCurrent || isError ? colors[index] : "rgba(148,163,184,0.58)" }}>{index + 1}</div>
                <div className="flow-step-label">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
