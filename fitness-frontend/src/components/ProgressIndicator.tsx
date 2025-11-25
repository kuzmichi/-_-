import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  label?: string;
  fullscreen?: boolean;
}

/**
 * Компонент ProgressIndicator, использующий классы из app.css (без Tailwind и Framer Motion)
 */
export function ProgressIndicator({ label = "Загрузка...", fullscreen = false }: ProgressIndicatorProps) {
  
  // JSX для самого лоадера
  const loader = (
    <div className="progress-indicator">
      <Loader2 className="progress-indicator-spinner" />
      <span className="progress-indicator-label">{label}</span>
    </div>
  );

  // Если нужен полноэкранный режим, оборачиваем в специальный контейнер
  if (fullscreen) {
    return (
      <div className="progress-indicator-fullscreen">
        {loader}
      </div>
    );
  }

  // Возвращаем обычный (встроенный) лоадер
  return loader;
}