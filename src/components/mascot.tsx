import { cn } from "@/lib/cn";
import { themeById, useTheme } from "@/lib/theme";

export function Mascot({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  const { theme } = useTheme();
  const info = themeById(theme);
  return (
    <img
      src={info.src}
      alt={decorative ? "" : info.alt}
      width={576}
      height={747}
      draggable={false}
      className={cn("pointer-events-none object-contain object-bottom select-none", className)}
    />
  );
}
