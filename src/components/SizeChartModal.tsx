import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSubCategories, MEASUREMENT_TEMPLATES } from "@/hooks/useSubCategories";

interface Props {
  open: boolean;
  onClose: () => void;
  product?: any;
}

// Default fallback charts
const defaultClothingChart = [
  { size: "XS", chest: "32-34", waist: "24-26", hip: "34-36", height: "155-160" },
  { size: "S", chest: "34-36", waist: "26-28", hip: "36-38", height: "160-165" },
  { size: "M", chest: "36-38", waist: "28-30", hip: "38-40", height: "165-170" },
  { size: "L", chest: "38-40", waist: "30-32", hip: "40-42", height: "170-175" },
  { size: "XL", chest: "40-42", waist: "32-34", hip: "42-44", height: "175-180" },
  { size: "XXL", chest: "42-44", waist: "34-36", hip: "44-46", height: "178-183" },
  { size: "3XL", chest: "44-46", waist: "36-38", hip: "46-48", height: "180-185" },
];

const defaultShoeChart = [
  { size: "36", eu: "36", uk: "3.5", us: "5.5", foot_length_cm: "22.5" },
  { size: "37", eu: "37", uk: "4", us: "6", foot_length_cm: "23" },
  { size: "38", eu: "38", uk: "5", us: "7", foot_length_cm: "23.5" },
  { size: "39", eu: "39", uk: "5.5", us: "7.5", foot_length_cm: "24.5" },
  { size: "40", eu: "40", uk: "6.5", us: "8", foot_length_cm: "25" },
  { size: "41", eu: "41", uk: "7", us: "8.5", foot_length_cm: "25.5" },
  { size: "42", eu: "42", uk: "8", us: "9.5", foot_length_cm: "26.5" },
  { size: "43", eu: "43", uk: "9", us: "10", foot_length_cm: "27" },
  { size: "44", eu: "44", uk: "9.5", us: "10.5", foot_length_cm: "27.5" },
  { size: "45", eu: "45", uk: "10.5", us: "11.5", foot_length_cm: "28.5" },
];

const fieldLabels: Record<string, string> = {
  size: "সাইজ", chest: "বুক (\")", length: "দৈর্ঘ্য (\")", shoulder: "কাঁধ (\")",
  waist: "কোমর (\")", hip: "হিপ (\")", height: "উচ্চতা (cm)", width: "চওড়া (\")",
  bust: "বাস্ট (\")", eu: "EU", uk: "UK", us: "US", foot_length_cm: "পায়ের দৈর্ঘ্য (cm)",
  diameter: "ব্যাস", case_mm: "Case (mm)",
};

const SizeChartModal = ({ open, onClose, product }: Props) => {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const { data: subCategories = [] } = useSubCategories();

  // Find matching sub-category for this product
  const matchedSubCategory = useMemo(() => {
    if (!product) return null;
    const subCatName = product.sub_category;
    const catName = product.category;
    if (!subCatName) return null;

    // Try exact match on sub-category name
    const match = subCategories.find((sc: any) => {
      if (sc.name.toLowerCase() !== subCatName.toLowerCase()) return false;
      // If we know the category, also check category_id
      return true;
    });
    return match || null;
  }, [product, subCategories]);

  // Determine chart content
  const { chartImage, chartRows, chartHeaders, template, chartTitle } = useMemo(() => {
    const subCat = matchedSubCategory;
    const template = subCat?.measurement_template || "clothing";

    // 1. If sub-category has a custom size chart image
    const chartImage = subCat?.size_chart_image || null;

    // 2. If sub-category has custom chart data
    const customData = subCat?.size_chart_data;
    if (customData && Array.isArray(customData) && customData.length > 0) {
      const allKeys = new Set<string>();
      customData.forEach((row: any) => Object.keys(row).forEach(k => allKeys.add(k)));
      // Ensure 'size' is first
      const headers = ["size", ...Array.from(allKeys).filter(k => k !== "size")];
      return { chartImage, chartRows: customData, chartHeaders: headers, template, chartTitle: subCat?.name || "" };
    }

    // 3. Check product's own sizes.variants data
    const rawSizes = product?.sizes as any;
    if (rawSizes?.variants) {
      const variants = rawSizes.variants;
      const allKeys = new Set<string>();
      Object.values(variants).forEach((data: any) => {
        if (data?.measurements) Object.keys(data.measurements).forEach(k => allKeys.add(k));
      });
      if (allKeys.size > 0) {
        const headers = Array.from(allKeys);
        const rows = Object.entries(variants)
          .filter(([, data]: any) => data?.measurements && Object.keys(data.measurements).length > 0)
          .map(([sizeKey, data]: any) => ({ size: sizeKey, ...data.measurements }));
        if (rows.length > 0) {
          return { chartImage, chartRows: rows, chartHeaders: ["size", ...headers], template, chartTitle: subCat?.name || "" };
        }
      }
    }

    // 4. Fallback defaults based on template
    if (template === "shoes") {
      return { chartImage, chartRows: defaultShoeChart, chartHeaders: ["size", "eu", "uk", "us", "foot_length_cm"], template, chartTitle: "জুতার সাইজ" };
    }

    // Default clothing chart
    return {
      chartImage,
      chartRows: defaultClothingChart,
      chartHeaders: ["size", "chest", "waist", "hip", "height"],
      template,
      chartTitle: subCat?.name || "সাধারণ",
    };
  }, [matchedSubCategory, product]);

  // Measurement tips based on template
  const measurementTips = useMemo(() => {
    if (template === "shoes") {
      return [
        { label: "পায়ের দৈর্ঘ্য", tip: "একটি কাগজে দাঁড়ান এবং গোড়ালি থেকে বৃদ্ধাঙ্গুলি পর্যন্ত মাপুন।" },
        { label: "EU ↔ UK ↔ US", tip: "বিভিন্ন দেশের সাইজ রূপান্তর উপরের চার্ট দেখুন।" },
      ];
    }
    if (template === "hijab") {
      return [
        { label: "চওড়া", tip: "এক প্রান্ত থেকে অন্য প্রান্ত পর্যন্ত মাপুন।" },
        { label: "লম্বা", tip: "উপর থেকে নিচ পর্যন্ত সম্পূর্ণ দৈর্ঘ্য মাপুন।" },
      ];
    }
    if (template === "pants") {
      return [
        { label: "কোমর", tip: "পেটের সবচেয়ে চিকন অংশে মাপুন।" },
        { label: "দৈর্ঘ্য", tip: "কোমর থেকে গোড়ালি পর্যন্ত মাপুন।" },
      ];
    }
    return [
      { label: "বুক", tip: "বুকের সবচেয়ে প্রশস্ত অংশ মাপুন, বগলের নিচ দিয়ে।" },
      { label: "কোমর", tip: "পেটের সবচেয়ে চিকন অংশে মাপুন।" },
      { label: "হিপ", tip: "নিতম্বের সবচেয়ে প্রশস্ত অংশে মাপুন।" },
    ];
  }, [template]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9998 }} onClick={onClose} />
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }} onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-serif text-base sm:text-lg text-foreground">
                    {product?.name ? `${product.name}` : "সাইজ চার্ট"}
                  </h2>
                  {chartTitle && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {chartTitle} — সাইজ গাইড
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"><X size={18} /></button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[65vh]">
                <p className="text-xs text-muted-foreground">
                  সঠিক সাইজ নির্বাচনের জন্য নিচের পরিমাপ অনুসরণ করুন। সব পরিমাপ ইঞ্চিতে (যদি অন্যথায় উল্লেখ না থাকে)।
                </p>

                {/* Size Chart Image (if uploaded) */}
                {chartImage && (
                  <div className="rounded-xl overflow-hidden border border-border">
                    <img src={chartImage} alt="Size chart" className="w-full h-auto object-contain bg-secondary/30" />
                  </div>
                )}

                {/* Size Chart Table */}
                {chartRows.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary text-xs text-muted-foreground uppercase tracking-wide">
                          {chartHeaders.map((h) => (
                            <th key={h} className={`px-3 sm:px-4 py-3 ${h === "size" ? "text-left font-semibold text-foreground" : "text-center"}`}>
                              {fieldLabels[h] || h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chartRows.map((row: any, i: number) => (
                          <tr key={row.size || i} className={`border-t border-border ${i % 2 !== 0 ? "bg-secondary/30" : ""}`}>
                            {chartHeaders.map((h) => (
                              <td key={h} className={`px-3 sm:px-4 py-3 text-xs ${h === "size" ? "font-bold text-primary text-sm" : "text-center text-foreground"}`}>
                                {row[h] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Measurement Tips */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground mb-2">📏 কিভাবে মাপবেন</p>
                  {measurementTips.map((tip) => (
                    <p key={tip.label} className="text-xs text-muted-foreground">
                      <strong className="text-foreground">{tip.label}:</strong> {tip.tip}
                    </p>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  সাইজ নিয়ে সন্দেহ? সাহায্যের জন্য আমাদের সাথে যোগাযোগ করুন।
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SizeChartModal;
