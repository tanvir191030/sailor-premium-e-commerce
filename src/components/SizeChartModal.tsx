import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  product?: any;
}

const defaultMeasurements = [
  { size: "XS", chest: "32-34", waist: "24-26", hip: "34-36", height: "155-160" },
  { size: "S", chest: "34-36", waist: "26-28", hip: "36-38", height: "160-165" },
  { size: "M", chest: "36-38", waist: "28-30", hip: "38-40", height: "165-170" },
  { size: "L", chest: "38-40", waist: "30-32", hip: "40-42", height: "170-175" },
  { size: "XL", chest: "40-42", waist: "32-34", hip: "42-44", height: "175-180" },
  { size: "XXL", chest: "42-44", waist: "34-36", hip: "44-46", height: "178-183" },
  { size: "3XL", chest: "44-46", waist: "36-38", hip: "46-48", height: "180-185" },
];

const SizeChartModal = ({ open, onClose, product }: Props) => {
  const rawSizes = product?.sizes as any;
  const isComplexSize = rawSizes && rawSizes.variants !== undefined;
  const sizeVariants = isComplexSize ? rawSizes.variants : null;
  const productSubCategory = isComplexSize ? (rawSizes.sub_category || product?.sub_category) : product?.sub_category;

  const isHijabOrna = productSubCategory?.toLowerCase() === "hijab" || productSubCategory?.toLowerCase() === "orna";

  let dynamicHeaders: string[] = [];
  let dynamicRows: Record<string, any>[] = [];

  if (sizeVariants) {
    const allKeys = new Set<string>();
    Object.entries(sizeVariants).forEach(([sizeKey, data]: any) => {
      if (data && typeof data === 'object' && data.measurements) {
        Object.keys(data.measurements).forEach(k => allKeys.add(k));
      }
    });

    dynamicHeaders = Array.from(allKeys);

    Object.entries(sizeVariants).forEach(([sizeKey, data]: any) => {
      if (data && typeof data === 'object' && data.measurements && Object.keys(data.measurements).length > 0) {
        dynamicRows.push({ size: sizeKey, ...data.measurements });
      }
    });
  }

  const hasDynamicData = dynamicHeaders.length > 0 && dynamicRows.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-serif text-lg text-foreground">{product?.name ? `${product.name} - সাইজ চার্ট` : "সাইজ চার্ট"}</h2>
                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                <p className="text-xs text-muted-foreground">
                  সঠিক সাইজ নির্বাচনের জন্য নিচের পরিমাপ অনুসরণ করুন। সব পরিমাপ ইঞ্চিতে।
                </p>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="px-4 py-3 text-left font-semibold text-foreground">সাইজ</th>
                        {hasDynamicData ? (
                          dynamicHeaders.map(h => (
                            <th key={h} className="px-4 py-3 text-center capitalize">{h}</th>
                          ))
                        ) : (
                          <>
                            {isHijabOrna ? (
                              <>
                                <th className="px-4 py-3 text-center">চওড়া (Width)</th>
                                <th className="px-4 py-3 text-center">লম্বা (Length)</th>
                              </>
                            ) : (
                              <>
                                <th className="px-4 py-3 text-center">বুক</th>
                                <th className="px-4 py-3 text-center">কোমর</th>
                                <th className="px-4 py-3 text-center">হিপ</th>
                                <th className="px-4 py-3 text-center">উচ্চতা (cm)</th>
                              </>
                            )}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {hasDynamicData ? (
                        dynamicRows.map((row, i) => (
                          <tr key={row.size} className={`border-t border-border transition-colors ${i % 2 === 0 ? "" : "bg-secondary/30"}`}>
                            <td className="px-4 py-3">
                              <span className="font-bold text-primary text-sm">{row.size}</span>
                            </td>
                            {dynamicHeaders.map(h => (
                              <td key={h} className="px-4 py-3 text-center text-foreground text-xs">{row[h] || "-"}</td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        defaultMeasurements.map((row, i) => (
                          <tr key={row.size} className={`border-t border-border transition-colors ${i % 2 === 0 ? "" : "bg-secondary/30"}`}>
                            <td className="px-4 py-3">
                              <span className="font-bold text-primary text-sm">{row.size}</span>
                            </td>
                            {isHijabOrna ? (
                              <>
                                <td className="px-4 py-3 text-center text-foreground text-xs text-muted-foreground">N/A</td>
                                <td className="px-4 py-3 text-center text-foreground text-xs text-muted-foreground">N/A</td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 text-center text-foreground text-xs">{row.chest}"</td>
                                <td className="px-4 py-3 text-center text-foreground text-xs">{row.waist}"</td>
                                <td className="px-4 py-3 text-center text-foreground text-xs">{row.hip}"</td>
                                <td className="px-4 py-3 text-center text-foreground text-xs">{row.height}</td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!hasDynamicData && !isHijabOrna && (
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground mb-2">📏 কিভাবে মাপবেন</p>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">বুক:</strong> বুকের সবচেয়ে প্রশস্ত অংশ মাপুন, বগলের নিচ দিয়ে।
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">কোমর:</strong> পেটের সবচেয়ে চিকন অংশে মাপুন।
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">হিপ:</strong> নিতম্বের সবচেয়ে প্রশস্ত অংশে মাপুন।
                    </p>
                  </div>
                )}

                {isHijabOrna && (
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground mb-2">📏 কিভাবে মাপবেন (হিজাব/ওড়না)</p>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">চওড়া:</strong> এক প্রান্ত থেকে অন্য প্রান্ত পর্যন্ত মাপুন।
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">লম্বা:</strong> উপর থেকে নিচ পর্যন্ত সম্পূর্ণ দৈর্ঘ্য মাপুন।
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  সাইজ নিয়ে সন্দেহ? সাহায্যের জন্য আমাদের সাথে যোগাযোগ করুন।
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SizeChartModal;
