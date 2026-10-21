// Pure, state-derived exchange tracker. Mirrors server rules in
// api-server/src/lib/marketplace.ts; it never unlocks anything the server forbids.
export type StepId = "matched" | "plan" | "accept" | "exchange" | "confirm";
export type StepState = "done" | "current" | "todo";
export type Outcome = "open" | "completed" | "cancelled" | "disputeClosed";
export type NextKey =
  | "nx_propose" | "nx_accept" | "nx_waitAccept" | "nx_meet" | "nx_confirmOther" | "nx_waitConfirm"
  | "nx_completed" | "nx_cancelled" | "nx_disputed";

export type ExchangeInputState = {
  status: string; proposal: string; acceptedBy: string[]; completedBy: string[];
  me: string; other: string; demo?: boolean;
};

export type ExchangeView = {
  steps: { id: StepId; state: StepState }[];
  outcome: Outcome;
  next: NextKey;
  myTurn: boolean;
  iAccepted: boolean; otherAccepted: boolean; iDone: boolean; otherDone: boolean;
  canPropose: boolean; canAccept: boolean; canComplete: boolean; canCancel: boolean;
  handoffStarted: boolean;
};

const ORDER: StepId[] = ["matched", "plan", "accept", "exchange", "confirm"];

export function deriveExchange(s: ExchangeInputState): ExchangeView {
  const iAccepted = s.acceptedBy.includes(s.me), otherAccepted = s.acceptedBy.includes(s.other);
  const iDone = s.completedBy.includes(s.me), otherDone = s.completedBy.includes(s.other);
  const handoffStarted = s.completedBy.length > 0;
  const status = s.status === "canceled" ? "cancelled" : s.status;
  const bothAccepted = status === "accepted" && iAccepted && otherAccepted;
  const live = !s.demo;

  let outcome: Outcome = "open";
  if (status === "completed") outcome = "completed";
  else if (status === "cancelled") outcome = handoffStarted ? "disputeClosed" : "cancelled";

  let current: number; let next: NextKey; let myTurn = false;
  if (outcome === "completed") { current = ORDER.length; next = "nx_completed"; }
  else if (outcome !== "open") { current = -1; next = outcome === "cancelled" ? "nx_cancelled" : "nx_disputed"; }
  else if (!s.proposal) { current = 1; next = "nx_propose"; myTurn = true; }
  else if (!bothAccepted) { current = 2; if (iAccepted) next = "nx_waitAccept"; else { next = "nx_accept"; myTurn = true; } }
  else if (!handoffStarted) { current = 3; next = "nx_meet"; myTurn = true; }
  else if (iDone) { current = 4; next = "nx_waitConfirm"; }
  else { current = 4; next = "nx_confirmOther"; myTurn = true; }

  const steps = ORDER.map((id, i) => {
    let state: StepState;
    if (outcome === "completed") state = "done";
    else if (current === -1) state = i === 0 || (i === 1 && !!s.proposal) || (i === 2 && bothAccepted) || (i === 3 && handoffStarted) ? "done" : "todo";
    else state = i < current ? "done" : i === current ? "current" : "todo";
    return { id, state };
  });

  const open = outcome === "open";
  return {
    steps, outcome, next, myTurn: myTurn && live, iAccepted, otherAccepted, iDone, otherDone, handoffStarted,
    canPropose: open && live && status !== "accepted",
    canAccept: open && live && !!s.proposal && !iAccepted && (status === "proposed" || status === "accepted"),
    canComplete: open && live && bothAccepted && !iDone,
    canCancel: open && live && !handoffStarted,
  };
}
