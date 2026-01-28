"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { MACHINE_SLUG, getMachineProduct } from "@/data/products";

export interface CartItem {
  productSlug: string;
  productName: string;
  productType: "cialde" | "machine";
  quantity: number;
  price: number;
  image: string;
  isFreeWithSubscription?: boolean;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isSubscription: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productSlug: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productSlug: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "SET_SUBSCRIPTION"; payload: boolean }
  | { type: "LOAD_CART"; payload: { items: CartItem[]; isSubscription: boolean } };

const initialState: CartState = {
  items: [],
  isOpen: false,
  isSubscription: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        (item) => item.productSlug === action.payload.productSlug
      );

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems, isOpen: true };
      }

      return { ...state, items: [...state.items, action.payload], isOpen: true };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.productSlug !== action.payload.productSlug
        ),
      };

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.productSlug !== action.payload.productSlug
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.productSlug === action.payload.productSlug
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case "SET_SUBSCRIPTION": {
      const isSubscription = action.payload;
      let newItems = [...state.items];
      
      const hasCialde = newItems.some((item) => item.productType === "cialde");
      const machineIndex = newItems.findIndex((item) => item.productSlug === MACHINE_SLUG);
      
      if (isSubscription && hasCialde) {
        // Add free machine if subscription is enabled and has cialde
        if (machineIndex === -1) {
          const machine = getMachineProduct();
          if (machine) {
            newItems.push({
              productSlug: machine.slug,
              productName: machine.name,
              productType: "machine",
              quantity: 1,
              price: 0,
              image: machine.images[0] || "/images/placeholder.svg",
              isFreeWithSubscription: true,
            });
          }
        } else {
          // Update existing machine to be free
          newItems[machineIndex] = {
            ...newItems[machineIndex],
            price: 0,
            isFreeWithSubscription: true,
          };
        }
      } else if (!isSubscription && machineIndex >= 0) {
        // Remove free machine or restore price if subscription is disabled
        const machine = getMachineProduct();
        if (newItems[machineIndex].isFreeWithSubscription) {
          // Remove the free machine
          newItems = newItems.filter((item) => item.productSlug !== MACHINE_SLUG);
        } else if (machine) {
          // Restore original price
          newItems[machineIndex] = {
            ...newItems[machineIndex],
            price: machine.price,
            isFreeWithSubscription: false,
          };
        }
      }

      return { ...state, isSubscription, items: newItems };
    }

    case "CLEAR_CART":
      return { ...state, items: [], isSubscription: false };

    case "OPEN_CART":
      return { ...state, isOpen: true };

    case "CLOSE_CART":
      return { ...state, isOpen: false };

    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };

    case "LOAD_CART":
      return { ...state, items: action.payload.items, isSubscription: action.payload.isSubscription };

    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isSubscription: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productSlug: string) => void;
  updateQuantity: (productSlug: string, quantity: number) => void;
  setSubscription: (isSubscription: boolean) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: number;
  totalPrice: number;
  hasCialde: boolean;
  hasFreeMachine: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "vento-caffe-cart";
const SUBSCRIPTION_STORAGE_KEY = "vento-caffe-subscription";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(CART_STORAGE_KEY);
      const storedSubscription = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      
      const items = storedItems ? JSON.parse(storedItems) : [];
      const isSubscription = storedSubscription === "true";
      
      dispatch({ type: "LOAD_CART", payload: { items, isSubscription } });
    } catch (error) {
      console.error("Failed to load cart from storage:", error);
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, String(state.isSubscription));
    } catch (error) {
      console.error("Failed to save cart to storage:", error);
    }
  }, [state.items, state.isSubscription]);

  const addItem = (item: CartItem) => dispatch({ type: "ADD_ITEM", payload: item });
  const removeItem = (productSlug: string) =>
    dispatch({ type: "REMOVE_ITEM", payload: { productSlug } });
  const updateQuantity = (productSlug: string, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { productSlug, quantity } });
  const setSubscription = (isSubscription: boolean) =>
    dispatch({ type: "SET_SUBSCRIPTION", payload: isSubscription });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const openCart = () => dispatch({ type: "OPEN_CART" });
  const closeCart = () => dispatch({ type: "CLOSE_CART" });
  const toggleCart = () => dispatch({ type: "TOGGLE_CART" });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const hasCialde = state.items.some((item) => item.productType === "cialde");
  const hasFreeMachine = state.items.some(
    (item) => item.productSlug === MACHINE_SLUG && item.isFreeWithSubscription
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        isSubscription: state.isSubscription,
        addItem,
        removeItem,
        updateQuantity,
        setSubscription,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        totalItems,
        totalPrice,
        hasCialde,
        hasFreeMachine,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
