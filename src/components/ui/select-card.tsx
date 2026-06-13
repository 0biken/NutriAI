import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

interface SelectCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function SelectCard({
  className,
  selected = false,
  title,
  description,
  icon,
  ...props
}: SelectCardProps) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-md",
        selected
          ? "border-forest bg-forest/5"
          : "border-border bg-white hover:border-forest/50",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="text-forest">{icon}</div>}
          <h3 className="font-semibold text-forest">{title}</h3>
        </div>
        {selected && (
          <CheckCircle2 className="h-5 w-5 text-forest" />
        )}
      </div>
      {description && (
        <p className="text-sm text-muted">{description}</p>
      )}
    </div>
  )
}
