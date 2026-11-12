import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODES = [
  { id: "light", labelKey: "settings.appearance.light", icon: Sun },
  { id: "dark", labelKey: "settings.appearance.dark", icon: Moon },
  { id: "system", labelKey: "settings.appearance.system", icon: Monitor },
];

export default function ThemeToggle() {
  const { t } = useI18n();
  const { mode, resolved, setMode } = useTheme();
  const current = MODES.find((item) => item.id === mode) ?? MODES[2];
  const Icon = current.id === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  const label = current.id === "system" ? `${t(current.labelKey)} (${t(resolved === "dark" ? "settings.appearance.dark" : "settings.appearance.light")})` : t(current.labelKey);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={t("settings.appearance.themeMode") + ": " + label}
          aria-label={t("settings.appearance.themeMode") + ": " + label + ". " + t("settings.appearance.followSystemLabel")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground md:h-8 md:w-8"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="nb-label">{t("settings.appearance.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={mode} onValueChange={setMode}>
          {MODES.map(({ id, labelKey, icon: ItemIcon }) => (
            <DropdownMenuRadioItem key={id} value={id} className="gap-2 text-[13px]">
              <ItemIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}