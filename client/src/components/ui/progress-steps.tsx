import { cn } from "@/lib/utils";

export interface ProgressStep {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
}

export function ProgressSteps({ steps, className }: ProgressStepsProps) {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center space-y-2 relative w-1/5">
          <div
            className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium", {
              "step-active": step.isActive,
              "bg-primary text-white border-primary": step.isCompleted && !step.isActive,
              "border-neutral-300 text-neutral-600": !step.isActive && !step.isCompleted,
            })}
          >
            {step.id}
          </div>
          <span className="text-xs md:text-sm text-center">{step.label}</span>
          
          {index < steps.length - 1 && (
            <div className="absolute left-[calc(100%_-_5px)] w-[calc(100%_+_10px)] top-5 -translate-y-1/2 h-1 bg-neutral-300">
              <div 
                className="absolute inset-0 bg-primary" 
                style={{ 
                  width: step.isCompleted ? "100%" : "0%" 
                }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
