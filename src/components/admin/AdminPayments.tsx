import { CreditCard } from "lucide-react";

const AdminPayments = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-serif text-lg mb-4">Payment Gateway Configuration</h3>
        <p className="text-sm text-gray-500 mb-6">Configure your payment methods for customer checkout.</p>

        <div className="space-y-4">
          {/* Bkash */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <CreditCard size={18} className="text-pink-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Bkash</h4>
                <p className="text-xs text-gray-500">Mobile payment gateway</p>
              </div>
            </div>
            <div className="space-y-2">
              <input placeholder="Bkash Merchant Number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              <input placeholder="API Key (optional)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
          </div>

          {/* Nagad */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <CreditCard size={18} className="text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Nagad</h4>
                <p className="text-xs text-gray-500">Mobile payment gateway</p>
              </div>
            </div>
            <div className="space-y-2">
              <input placeholder="Nagad Merchant Number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
              <input placeholder="API Key (optional)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
          </div>

          {/* COD */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CreditCard size={18} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Cash on Delivery</h4>
                <p className="text-xs text-gray-500">Always enabled</p>
              </div>
              <span className="ml-auto px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">Active</span>
            </div>
          </div>
        </div>

        <button className="mt-4 bg-[hsl(160,84%,20%)] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
          Save Configuration
        </button>
      </div>

      {/* Shipping */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-serif text-lg mb-4">Shipping Configuration</h3>
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Default courier name" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            <input placeholder="Default shipping cost (৳)" type="number" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <p className="text-xs text-gray-400">Tracking IDs can be added per order in the Orders section.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
