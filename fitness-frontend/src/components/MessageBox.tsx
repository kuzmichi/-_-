import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface MessageBoxProps {
  type?: "success" | "error" | "warning" | "info";
  message: string;
  className?: string;
}

// Объекты для иконок и CSS-классов
const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const typeClasses = {
  success: "msg-success",
  error: "msg-error",
  warning: "msg-warning",
  info: "msg-info",
};

/**
 * Компонент MessageBox, использующий классы из app.css (без Tailwind)
 */
export function MessageBox({ type = "info", message, className }: MessageBoxProps) {
  const Icon = icons[type];
  const typeClass = typeClasses[type];

  // Собираем классы: базовый, по типу и дополнительный (если есть)
  const combinedClassName = `message-box ${typeClass} ${className || ''}`.trim();

  return (
    <div className={combinedClassName}>
      <Icon className="message-box-icon" />
      <span>{message}</span>
    </div>
  );
}