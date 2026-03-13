import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CartItem {
  id: string; // This might be productId-size-color
  productId?: string; // The actual Supabase UUID
  name: string;
  price: number;
  image: string;
  category?: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isBuyNowOpen: boolean;
  setIsBuyNowOpen: (open: boolean) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => { },
  removeItem: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  isOpen: false,
  setIsOpen: () => { },
  isBuyNowOpen: false,
  setIsBuyNowOpen: () => { },
  totalItems: 0,
  totalPrice: 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty: number = 1) => {
    setItems((prev) => {
      // Create a unique cart item ID by appending size if it exists.
      const cartItemId = item.size ? `${item.id}-${item.size}` : item.id;
      const existing = prev.find((i) => i.id === cartItemId);

      if (existing) {
        return prev.map((i) => (i.id === cartItemId ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...item, id: cartItemId, productId: item.id, quantity: qty }];
    });
  }, []);

  const openBuyNow = useCallback(() => {
    setIsOpen(false);
    setIsBuyNowOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, isOpen, setIsOpen, isBuyNowOpen, setIsBuyNowOpen, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
