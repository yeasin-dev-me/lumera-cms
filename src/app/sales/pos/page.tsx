"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { POSSession, SalesInvoice, TenderMethod, POSCheckoutInput } from "@/types/sales";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Store,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Printer,
  DollarSign,
  CreditCard,
  Smartphone,
  History,
  Loader2,
  Package,
  AlertTriangle,
  X,
} from "lucide-react";

interface CartLine {
  productId: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  quantity: number;
  discount: number;
}

interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  price: string | number;
  stock_quantity: number;
  status: string;
}

export default function POSCounterPage() {
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Catalog search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // Cart
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);

  // Tender Modal
  const [showTenderModal, setShowTenderModal] = useState<boolean>(false);
  const [tenderMethod, setTenderMethod] = useState<TenderMethod>("cash");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

  // Success Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<SalesInvoice | null>(null);

  // Load active session
  const checkSession = useCallback(async () => {
    try {
      setLoadingSession(true);
      const sess = await adminApi.getActivePosSession();
      setActiveSession(sess);
    } catch {
      setActiveSession(null);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Search catalog products
  const searchCatalog = useCallback(async (query: string) => {
    try {
      setSearchLoading(true);
      const res = await fetch(`/api/v1/admin/products/?q=${encodeURIComponent(query)}&page_size=12`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_access_token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const prods: CatalogProduct[] = (data.results || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: parseFloat(p.price || "0"),
          stock_quantity: p.stock_quantity ?? 0,
          status: p.status,
        }));
        setCatalog(prods);
      }
    } catch (err) {
      console.error("Failed to load catalog products", err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    searchCatalog(searchQuery);
  }, [searchQuery, searchCatalog]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.price * it.quantity - it.discount, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    const tot = subtotal - orderDiscount;
    return tot > 0 ? tot : 0;
  }, [subtotal, orderDiscount]);

  const changeDue = useMemo(() => {
    const tendered = parseFloat(amountTendered || "0");
    return tendered > grandTotal ? tendered - grandTotal : 0;
  }, [amountTendered, grandTotal]);

  const addToCart = (prod: CatalogProduct) => {
    if (prod.stock_quantity <= 0) {
      setError(`Product '${prod.name}' is out of stock.`);
      return;
    }
    setError(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === prod.id);
      if (existing) {
        if (existing.quantity >= prod.stock_quantity) {
          setError(`Cannot add more. Available stock: ${prod.stock_quantity}`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: typeof prod.price === "number" ? prod.price : parseFloat(prod.price),
          stock: prod.stock_quantity,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.stock) {
              setError(`Max stock available is ${item.stock}`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartLine[]
    );
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const openTender = () => {
    if (cart.length === 0) return;
    setAmountTendered(grandTotal.toFixed(2));
    setShowTenderModal(true);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) {
      setError("No active register session. Please open one first.");
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const payload: POSCheckoutInput = {
        session_id: activeSession.id,
        items: cart.map((it) => ({
          product_id: it.productId,
          quantity: it.quantity,
          unit_price: it.price,
          discount_amount: it.discount,
        })),
        tender_method: tenderMethod,
        amount_tendered: amountTendered || grandTotal,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_reference: paymentRef,
        discount_amount: orderDiscount,
      };

      const inv = await adminApi.posCheckout(payload);
      setShowTenderModal(false);
      setCompletedInvoice(inv);
      setCart([]);
      setOrderDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentRef("");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("POS Checkout failed. Please review items and stock.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="py-20 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-600" />
        Checking POS session status...
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
        <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <Store className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">POS Terminal Inactive</h2>
        <p className="text-sm text-gray-600">
          No cashier register session is open for this workstation. Please open a shift with starting drawer float before ringing up sales.
        </p>
        <Link href="/sales/pos/sessions">
          <Button className="w-full bg-primary-600 text-white mt-2">
            <History className="h-4 w-4 mr-2" />
            Open Register Shift
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{activeSession.register_name}</span>
              <span className="text-xs text-gray-500 font-mono">({activeSession.session_number})</span>
              <Badge variant="success" className="text-[10px] px-1.5 py-0">Online</Badge>
            </div>
            <p className="text-xs text-gray-500">
              Cashier: {activeSession.cashier_name || activeSession.cashier_email} • Drawer Float: ৳{activeSession.opening_cash}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sales/pos/sessions">
            <Button variant="secondary" size="sm">
              <History className="h-3.5 w-3.5 mr-1.5" />
              Manage Shift
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Main POS Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by SKU, barcode, or name..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 shadow-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {searchLoading ? (
              <div className="col-span-3 py-12 text-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Searching inventory...
              </div>
            ) : catalog.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-gray-400">
                <Package className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                No products found.
              </div>
            ) : (
              catalog.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  disabled={prod.stock_quantity <= 0}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    prod.stock_quantity <= 0
                      ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                      : "bg-white border-gray-200 hover:border-primary-500 hover:shadow-md cursor-pointer"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono font-medium text-gray-400 block truncate">
                      {prod.sku}
                    </span>
                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mt-0.5">
                      {prod.name}
                    </h4>
                  </div>
                  <div className="mt-3 flex justify-between items-end border-t pt-2">
                    <span className="text-sm font-bold text-primary-600">৳{prod.price}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        prod.stock_quantity <= 5
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {prod.stock_quantity} left
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: POS Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="flex flex-col h-full max-h-[calc(100vh-210px)] p-0 overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-gray-50/70 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary-600" />
                Current Order ({cart.reduce((sum, it) => sum + it.quantity, 0)} items)
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-gray-400">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">Cart is empty.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Select items from catalog or scan barcode.
                  </p>
                </div>
              ) : (
                cart.map((line) => (
                  <div key={line.productId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{line.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        ৳{line.price} × {line.quantity}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(line.productId, -1)}
                        className="p-1 border rounded bg-gray-50 hover:bg-gray-100 text-gray-600"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-gray-900">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(line.productId, 1)}
                        className="p-1 border rounded bg-gray-50 hover:bg-gray-100 text-gray-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right pl-2">
                      <span className="text-xs font-bold text-gray-900 block">
                        ৳{(line.price * line.quantity - line.discount).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeLine(line.productId)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Financial Summary & Pay Action */}
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Order Discount:</span>
                  <div className="flex items-center gap-1 w-24">
                    <span className="text-gray-400">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      value={orderDiscount || ""}
                      onChange={(e) => setOrderDiscount(parseFloat(e.target.value || "0"))}
                      className="w-full px-1.5 py-0.5 border rounded text-right text-xs focus:ring-1 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2">
                  <span>Grand Total:</span>
                  <span className="text-primary-700">৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={openTender}
                disabled={cart.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
              >
                <DollarSign className="h-5 w-5 mr-1" />
                Pay ৳{grandTotal.toFixed(2)}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Tender & Payment Modal */}
      {showTenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Complete POS Sale</h3>
                <p className="text-xs text-gray-500">Total Due: ৳{grandTotal.toFixed(2)}</p>
              </div>
              <button onClick={() => setShowTenderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Tender Methods */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select Tender Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cash", label: "Cash", icon: DollarSign },
                    { id: "pos_card", label: "Card Slip", icon: CreditCard },
                    { id: "bkash", label: "bKash QR", icon: Smartphone },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = tenderMethod === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setTenderMethod(m.id as TenderMethod)}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? "border-primary-600 bg-primary-50 text-primary-700 font-bold"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Tendered */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount Tendered (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Change Due (৳)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`৳${changeDue.toFixed(2)}`}
                    className="w-full px-3 py-2 border rounded-lg text-base font-bold text-emerald-700 bg-emerald-50 border-emerald-200 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Transaction Reference (if Card or bKash) */}
              {tenderMethod !== "cash" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Reference / Auth Code
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Slip auth code or bKash TrxID"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Optional Customer Info */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="secondary" onClick={() => setShowTenderModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={checkoutLoading || parseFloat(amountTendered || "0") < grandTotal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm & Complete Sale
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Complete Receipt Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">Sale Completed!</h3>
              <p className="text-sm font-mono font-semibold text-primary-600 mt-1">
                {completedInvoice.invoice_number}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Grand Total: ৳{completedInvoice.grand_total} • Method: {completedInvoice.tender_method}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={adminApi.getSalesInvoicePdfUrl(completedInvoice.id)}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Official PDF Invoice
                </Button>
              </a>

              <Button
                variant="secondary"
                onClick={() => setCompletedInvoice(null)}
                className="w-full"
              >
                Next Customer (Ready)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
