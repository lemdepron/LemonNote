import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
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
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme();
  const current = MODES.find((item) => item.id === mode) ?? MODES[2];
  const Icon = current.id === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  const label = current.id === "system" ? `System (${resolved})` : current.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`Theme: ${label}`}
          aria-label={`Theme: ${label}. Change theme`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground md:h-8 md:w-8"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="nb-label">Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={mode} onValueChange={setMode}>
          {MODES.map(({ id, label: itemLabel, icon: ItemIcon }) => (
            <DropdownMenuRadioItem key={id} value={id} className="gap-2 text-[13px]">
              <ItemIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              {itemLabel}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}