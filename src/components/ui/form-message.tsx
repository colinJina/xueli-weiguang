import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";

type FormMessageVariant = "error" | "success" | "info" | "loading";

type FormMessageProps = {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  variant?: FormMessageVariant;
};

export function FormMessage({
  children,
  className,
  icon,
  variant = "info",
}: FormMessageProps) {
  return (
    <Alert
      className={className}
      role={variant === "error" ? "alert" : "status"}
      variant={variant === "error" ? "destructive" : "default"}
    >
      <span className="mt-0.5 text-foreground">{icon}</span>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
