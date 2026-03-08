import { ArrowUpDown } from "lucide-react";

export type SortOption = "newest" | "price_asc" | "price_desc";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price_asc", label: "দাম: কম → বেশি" },
  { value: "price_desc", label: "দাম: বেশি → কম" },
];

interface SortSelectProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

const SortSelect = ({ value, onChange }: SortSelectProps) => (
  <div className="flex items-center gap-2">
    <ArrowUpDown size={14} className="text-muted-foreground" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export default SortSelect;
