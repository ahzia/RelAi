"use client";

import { Fragment } from "react";
import type { AgentWorkflowStatus } from "@/lib/dashboard/types";
import { themeForStatus, themeForStep } from "./workflow-stepper-theme";

type WorkflowStepKey = "scanning" | "contacting" | "negotiating" | "done";

const STEPS: Array<{
  key: WorkflowStepKey;
  label: string;
  description: string;
}> = [
  { key: "scanning", label: "Scan", description: "Discover attendees" },
  { key: "contacting", label: "Contact", description: "Reach agent pairs" },
  { key: "negotiating", label: "Negotiate", description: "Evaluate & schedule" },
  { key: "done", label: "Ready", description: "Matches for approval" },
];

const STATUS_ORDER: AgentWorkflowStatus[] = [
  "idle",
  "scanning",
  "contacting",
  "negotiating",
  "done",
  "cancelled",
];

function statusIndex(status: AgentWorkflowStatus): number {
  return STATUS_ORDER.indexOf(status);
}

function stepIndex(key: AgentWorkflowStatus): number {
  return STATUS_ORDER.indexOf(key);
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepIcon({ stepKey }: { stepKey: AgentWorkflowStatus }) {
  const cls = "h-3.5 w-3.5";
  switch (stepKey) {
    case "scanning":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 20l-3-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "contacting":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 10h8M8 14h5M6 6h12a2 2 0 012 2v9l-3-2H6l-3 2V8a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "negotiating":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="4"
            y="5"
            width="16"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M8 3v2M16 3v2M4 10h16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "done":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l2.4 4.8L20 9l-4 3.9.9 5.6L12 16.8 7.1 18.5 8 12.9 4 9l5.6-1.2L12 3z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function StepConnector({
  fromKey,
  filled,
  animating,
}: {
  fromKey: AgentWorkflowStatus;
  filled: boolean;
  animating: boolean;
}) {
  const theme = themeForStep(fromKey);
  const width = filled ? "100%" : animating ? "55%" : "0%";

  return (
    <li
      className="relative z-0 mt-[14px] flex min-w-[12px] flex-1 list-none items-center px-0.5 sm:px-1"
      aria-hidden
    >
      <div className="relative h-[2px] w-full">
        <div className="absolute inset-0 rounded-full bg-zinc-800/90" />
        <div
          className="workflow-stepper-segment absolute left-0 top-0 h-full rounded-full"
          style={{
            width,
            backgroundColor: theme.connector,
            boxShadow:
              filled || animating ? `0 0 10px ${theme.glow}` : undefined,
          }}
        />
      </div>
    </li>
  );
}

interface WorkflowStepperProps {
  status: AgentWorkflowStatus;
  phaseLabel?: string;
}

export function WorkflowStepper({ status, phaseLabel }: WorkflowStepperProps) {
  const activeIdx = statusIndex(status);
  const currentTheme = themeForStatus(status);

  return (
    <nav className="workflow-stepper w-full" aria-label="Workflow progress">
      <ol className="flex w-full items-start">
        {STEPS.map((step, i) => {
          const idx = stepIndex(step.key);
          const theme = themeForStep(step.key);
          const isActive = status === step.key;
          const isComplete = activeIdx > idx;
          const prevKey = i > 0 ? STEPS[i - 1]!.key : null;

          let nodeClass = `workflow-step-node relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ease-out sm:h-[34px] sm:w-[34px] ${theme.nodeUpcoming}`;
          if (isComplete) nodeClass = `workflow-step-node relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ease-out sm:h-[34px] sm:w-[34px] ${theme.nodeComplete}`;
          if (isActive)
            nodeClass = `workflow-step-node workflow-step-node-active relative z-10 flex h-8 w-8 shrink-0 scale-110 items-center justify-center rounded-full border-2 ring-2 transition-all duration-500 ease-out sm:h-[34px] sm:w-[34px] ${theme.nodeActive} ${theme.ringActive}`;

          let labelClass = "mt-2 text-[10px] font-semibold tracking-tight text-zinc-600 sm:text-[11px]";
          if (isComplete) labelClass = `mt-2 text-[10px] font-semibold tracking-tight ${theme.labelComplete} sm:text-[11px]`;
          if (isActive) labelClass = `mt-2 text-[10px] font-semibold tracking-tight ${theme.labelActive} sm:text-[11px]`;

          return (
            <Fragment key={step.key}>
              {prevKey ? (
                <StepConnector
                  fromKey={prevKey}
                  filled={activeIdx > stepIndex(prevKey)}
                  animating={status === prevKey}
                />
              ) : null}
              <li className="relative z-10 flex min-w-[52px] flex-col items-center sm:min-w-[64px]">
                {/* Mask so connector never draws over the circle */}
                <div
                  className="relative rounded-full bg-zinc-950 p-[3px]"
                  aria-current={isActive ? "step" : undefined}
                >
                  <div className={nodeClass}>
                    {isComplete ? (
                      <CheckIcon />
                    ) : (
                      <StepIcon stepKey={step.key} />
                    )}
                  </div>
                </div>
                <span className={labelClass}>{step.label}</span>
                <span
                  className={[
                    "mt-0.5 hidden max-w-[80px] text-center text-[9px] leading-tight sm:block",
                    isActive ? "text-zinc-500" : isComplete ? "text-zinc-600" : "text-zinc-700",
                  ].join(" ")}
                >
                  {step.description}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>

      {phaseLabel ? (
        <div
          className="mt-2.5 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 sm:inline-flex"
          style={{
            borderLeftColor: currentTheme.connector,
            borderLeftWidth: 3,
          }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: currentTheme.connector }}
          />
          <p className="min-w-0 truncate text-[11px] text-zinc-400">
            <span className="font-medium text-zinc-500">Now · </span>
            {phaseLabel}
          </p>
        </div>
      ) : null}
    </nav>
  );
}
