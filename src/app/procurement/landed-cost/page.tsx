"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi, AdminApiError } from "@/lib/api/admin-client";
import { PurchaseBill, LandedCostAllocationMethod } from "@/types/procurement";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  Scale,
  ArrowLeft,
  Calculator,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";

interface ModelLineItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  rawUnitCost: number;
  weight: number;
}

export default function LandedCostCalculatorPage() {
  const [draftBills, setDraftBills] = useState<PurchaseBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>("");
  const [loadingBills, setLoadingBills] = useState<boolean>(true);

  // Allocation Method
  const [allocationMethod, setAllocationMethod] = useState<LandedCostAllocationMethod>("value");

  // Charges
  const [freight, setFreight] = useState<number>(1500);
  const [customs, setCustoms] = useState<number>(450);
  const [clearing, setClearing] = useState<number>(200);
  const [other, setOther] = useState<number>(100);

  // Line items
  const [items, setItems] = useState<ModelLineItem[]>([
    {
      id: "1",
      name: "Organic Basmati Rice 5kg",
      sku: "RIC-BAS-001",
      quantity: 100,
      rawUnitCost: 380,
      weight: 5.0,
    },
    {
      id: "2",
      name: "Pure Mustard Oil 1L",
      sku: "OIL-MUS-001",
      quantity: 50,
      rawUnitCost: 240,
      weight: 1.0,
    },
  ]);

  const [savingBill, setSavingBill] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Load draft bills for quick loading
  useEffect(() => {
    async function fetchDrafts() {
      try {
        setLoadingBills(true);
        const res = await adminApi.getPurchaseBills({ status: "draft", page_size: 50 });
        setDraftBills(res.results);
      } catch (err) {
        // non-blocking
      } finally {
        setLoadingBills(false);
      }
    }
    fetchDrafts();
  }, []);

  const handleSelectBill = (billId: string) => {
    setSelectedBillId(billId);
    if (!billId) return;
    const bill = draftBills.find((b) => String(b.id) === billId);
    if (!bill) return;

    setFreight(parseFloat(bill.freight_charges) || 0);
    setCustoms(parseFloat(bill.customs_duties) || 0);
    setClearing(parseFloat(bill.clearing_charges) || 0);
    setOther(parseFloat(bill.other_landed_costs) || 0);

    const mapped: ModelLineItem[] = bill.items.map((it, idx) => ({
      id: String(idx + 1),
      name: it.product_name,
      sku: it.product_sku,
      quantity: it.billed_quantity,
      rawUnitCost: parseFloat(it.raw_unit_cost) || 0,
      weight: parseFloat(it.allocation_weight || "1.0"),
    }));

    setItems(mapped);
    setFeedback({
      type: "success",
      message: `Loaded lines and charges from draft bill ${bill.bill_number}.`,
    });
  };

  const handleApplyToBill = async () => {
    if (!selectedBillId) {
      setFeedback({ type: "error", message: "Please select a draft bill to apply." });
      return;
    }

    try {
      setSavingBill(true);
      setFeedback(null);
      await adminApi.updateBillLandedCost(selectedBillId, {
        allocation_method: allocationMethod,
        freight_charges: freight,
        customs_duties: customs,
        clearing_charges: clearing,
        other_landed_costs: other,
      });

      setFeedback({
        type: "success",
        message: `Successfully allocated and saved landed costs to draft bill #${selectedBillId}.`,
      });
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFeedback({ type: "error", message: err.message });
      } else {
        setFeedback({ type: "error", message: "Failed to update draft bill landed costs." });
      }
    } finally {
      setSavingBill(false);
    }
  };

  const handleAddItem = () => {
    const nextId = String(items.length + 1);
    setItems((prev) => [
      ...prev,
      {
        id: nextId,
        name: `Merchandise Item ${nextId}`,
        sku: `SKU-${nextId}`,
        quantity: 10,
        rawUnitCost: 100,
        weight: 1.0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ModelLineItem, val: string | number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  // Calculations
  const totalLandedCharges = freight + customs + clearing + other;
  const rawSubtotal = items.reduce((acc, it) => acc + it.quantity * it.rawUnitCost, 0);
  const totalWeight = items.reduce((acc, it) => acc + it.quantity * it.weight, 0);

  // Proportional Distribution Simulation with Penny Remainder Reconciliation
  const calculatedItems = items.map((it) => {
    const rawLineTotal = it.quantity * it.rawUnitCost;
    const lineTotalWeight = it.quantity * it.weight;

    let baseRatio = 0;
    if (allocationMethod === "value") {
      baseRatio = rawSubtotal > 0 ? rawLineTotal / rawSubtotal : 0;
    } else {
      baseRatio = totalWeight > 0 ? lineTotalWeight / totalWeight : 0;
    }

    const unroundedAllocated = totalLandedCharges * baseRatio;
    const allocatedLanded = Math.round(unroundedAllocated * 100) / 100;
    const landedLineTotal = rawLineTotal + allocatedLanded;
    const landedUnitCost = it.quantity > 0 ? landedLineTotal / it.quantity : 0;

    return {
      ...it,
      rawLineTotal,
      lineTotalWeight,
      ratio: baseRatio,
      allocatedLanded,
      landedLineTotal,
      landedUnitCost,
    };
  });

  // Remainder check
  const sumAllocated = calculatedItems.reduce((acc, it) => acc + it.allocatedLanded, 0);
  const discrepancy = Math.round((totalLandedCharges - sumAllocated) * 100) / 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/procurement/purchase-bills"
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Scale className="h-6 w-6 text-indigo-600" />
              Landed Cost Allocation Engine
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Simulate proportional absorption of freight, customs, and port clearing into inventory unit costs.
            </p>
          </div>
        </div>

        {selectedBillId && (
          <Button
            onClick={handleApplyToBill}
            disabled={savingBill}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
          >
            {savingBill ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Save to Draft Bill
          </Button>
        )}
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === "error" ? "danger" : feedback.type}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Bill Selector Bar */}
      <Card className="p-4 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calculator className="h-4 w-4 text-indigo-600" />
          <span className="font-medium">Model Existing Draft Bill:</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedBillId}
            onChange={(e) => handleSelectBill(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 bg-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={loadingBills}
          >
            <option value="">-- Standalone Sandbox Simulator --</option>
            {draftBills.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.bill_number} &bull; {b.supplier_name} (৳{parseFloat(b.total_amount).toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Method & Charges */}
        <Card className="p-6 md:col-span-1 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Allocation Methodology
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setAllocationMethod("value")}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  allocationMethod === "value"
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Value-Based
              </button>
              <button
                type="button"
                onClick={() => setAllocationMethod("weight")}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  allocationMethod === "weight"
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Weight-Based
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {allocationMethod === "value"
                ? "Costs are distributed proportionally to merchandise raw line total value."
                : "Costs are distributed proportionally to total physical weight of each line item."}
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Acquisition Charges (৳)
            </h3>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Freight & Shipping</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={freight}
                onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Customs Duties</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customs}
                onChange={(e) => setCustoms(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Clearing / Port Fees</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={clearing}
                onChange={(e) => setClearing(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Other Surcharges</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={other}
                onChange={(e) => setOther(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-sm font-semibold text-gray-900">
              <span>Total Landed Pool:</span>
              <span className="text-indigo-700">৳{totalLandedCharges.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Real-time Results & Simulator */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Simulated Products ({items.length})
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 uppercase font-medium text-gray-500 border-b">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 w-16 text-right">Qty</th>
                    <th className="px-3 py-2 w-20 text-right">Raw (৳)</th>
                    {allocationMethod === "weight" && (
                      <th className="px-3 py-2 w-20 text-right">Kg/Unit</th>
                    )}
                    <th className="px-3 py-2 text-right">Ratio</th>
                    <th className="px-3 py-2 text-right text-indigo-700">Allocated (৳)</th>
                    <th className="px-3 py-2 text-right text-emerald-800 font-semibold">
                      Final Unit (৳)
                    </th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {calculatedItems.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => handleItemChange(it.id, "name", e.target.value)}
                          className="w-full font-medium text-gray-900 border-0 bg-transparent p-0 focus:ring-0 text-xs"
                        />
                        <div className="text-gray-400 font-mono text-[10px]">{it.sku}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) =>
                            handleItemChange(it.id, "quantity", parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-1.5 py-1 text-right border rounded text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.rawUnitCost}
                          onChange={(e) =>
                            handleItemChange(it.id, "rawUnitCost", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-1.5 py-1 text-right border rounded text-xs"
                        />
                      </td>
                      {allocationMethod === "weight" && (
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={it.weight}
                            onChange={(e) =>
                              handleItemChange(it.id, "weight", parseFloat(e.target.value) || 0.1)
                            }
                            className="w-16 px-1.5 py-1 text-right border rounded text-xs"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 text-right font-mono text-gray-500">
                        {(it.ratio * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-indigo-700">
                        +৳{it.allocatedLanded.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">
                        ৳{it.landedUnitCost.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-gray-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Note */}
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-600" />
                Penny reconciliation check: Sum of allocations = ৳{sumAllocated.toFixed(2)} / Pool = ৳{totalLandedCharges.toFixed(2)}
              </span>
              <span className="font-mono text-emerald-700 font-semibold">
                Variance: {discrepancy === 0 ? "Exact ৳0.00" : `৳${discrepancy.toFixed(2)}`}
              </span>
            </div>
          </Card>

          {/* Mathematical Proof Card */}
          <Card className="p-4 bg-indigo-50/40 border-indigo-200 text-xs text-indigo-900 space-y-2">
            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-indigo-950">
              Deterministic Absorption Formula
            </h4>
            <p>
              Each item absorbs a fractional share of landed acquisition costs:
            </p>
            <div className="p-2.5 bg-white rounded border border-indigo-200 font-mono text-[11px] text-indigo-800">
              {allocationMethod === "value"
                ? "Allocated_Cost_i = Total_Landed_Pool * (Raw_Line_Total_i / Merchandise_Subtotal)"
                : "Allocated_Cost_i = Total_Landed_Pool * (Total_Weight_i / Total_Shipment_Weight)"}
            </div>
            <p className="text-[11px] text-indigo-700">
              Capitalized FIFO CostLayer Unit Cost:{" "}
              <strong className="font-mono text-indigo-950">
                (Raw_Line_Total + Allocated_Landed) / Billed_Quantity
              </strong>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
