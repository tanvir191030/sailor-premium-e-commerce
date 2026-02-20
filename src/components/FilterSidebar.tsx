import { useState } from "react";
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

export interface FilterState {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "ফ্রি সাইজ"];
const COLORS = [
  { name: "কালো", value: "black", hex: "#111111" },
  { name: "সাদা", value: "white", hex: "#f5f5f5" },
  { name: "নীল", value: "blue", hex: "#3b82f6" },
  { name: "লাল", value: "red", hex: "#ef4444" },
  { name: "সবুজ", value: "green", hex: "#22c55e" },
  { name: "হলুদ", value: "yellow", hex: "#eab308" },
  { name: "ধূসর", value: "gray", hex: "#9ca3af" },
  { name: "গোলাপী", value: "pink", hex: "#ec4899" },
  { name: "বেগুনি", value: "purple", hex: "#a855f7" },
  { name: "কমলা", value: "orange", hex: "#f97316" },
  { name: "বাদামী", value: "brown", hex: "#92400e" },
  { name: "নেভি", value: "navy", hex: "#1e3a5f" },
];
const PRICE_MAX = 5000;

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

const Accordion = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-sm font-medium text-foreground"
      >
        {title}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
};

const FilterSidebar = ({ filters, onChange, mobileOpen, onClose }: Props) => {
  const toggleSize = (s: string) => {
    const next = filters.sizes.includes(s)
      ? filters.sizes.filter((x) => x !== s)
      : [...filters.sizes, s];
    onChange({ ...filters, sizes: next });
  };

  const toggleColor = (c: string) => {
    const next = filters.colors.includes(c)
      ? filters.colors.filter((x) => x !== c)
      : [...filters.colors, c];
    onChange({ ...filters, colors: next });
  };

  const hasFilters =
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.priceMin > 0 ||
    filters.priceMax < PRICE_MAX;

  const clearAll = () =>
    onChange({ sizes: [], colors: [], priceMin: 0, priceMax: PRICE_MAX });

  const content = (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal size={15} /> ফিল্টার
        </span>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-primary hover:underline">
            সব মুছুন
          </button>
        )}
      </div>

      {/* Price Range */}
      <Accordion title="মূল্য সীমা">
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={PRICE_MAX}
            step={50}
            value={filters.priceMax}
            onChange={(e) => onChange({ ...filters, priceMax: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>৳{filters.priceMin}</span>
            <span>৳{filters.priceMax === PRICE_MAX ? `${PRICE_MAX}+` : filters.priceMax}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={filters.priceMax}
              value={filters.priceMin}
              onChange={(e) => onChange({ ...filters, priceMin: Math.min(Number(e.target.value), filters.priceMax) })}
              placeholder="Min"
              className="w-full px-2 py-1.5 border border-border rounded-lg text-xs bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="number"
              min={filters.priceMin}
              max={PRICE_MAX}
              value={filters.priceMax}
              onChange={(e) => onChange({ ...filters, priceMax: Math.max(Number(e.target.value), filters.priceMin) })}
              placeholder="Max"
              className="w-full px-2 py-1.5 border border-border rounded-lg text-xs bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </Accordion>

      {/* Sizes */}
      <Accordion title="সাইজ">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                filters.sizes.includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Accordion>

      {/* Colors */}
      <Accordion title="রঙ">
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => {
            const active = filters.colors.includes(c.value);
            return (
              <button
                key={c.value}
                onClick={() => toggleColor(c.value)}
                title={c.name}
                className={`relative w-7 h-7 rounded-full border-2 transition-all ${
                  active ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-border"
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {active && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ textShadow: "0 0 3px rgba(0,0,0,0.5)" }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {filters.colors.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {filters.colors.map((v) => COLORS.find((c) => c.value === v)?.name).join(", ")}
          </p>
        )}
      </Accordion>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
        <div className="bg-card border border-border rounded-xl p-4">{content}</div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border p-5 overflow-y-auto transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-serif text-base">ফিল্টার</span>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X size={18} />
          </button>
        </div>
        {content}
      </div>
    </>
  );
};

export { SIZES, COLORS, PRICE_MAX };
export default FilterSidebar;
