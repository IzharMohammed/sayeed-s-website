"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createOrderAction } from "@/app/actions/orders";
import { MATERIALS, ORDER_STATUSES, PAYMENT_STATUSES, THICKNESSES, label } from "@/lib/constants";

type Item = {
  description: string;
  height: string;
  width: string;
  pieces: number;
  thickness: string;
  material: string;
  remarks: string;
};
const blankItem = (): Item => ({
  description: "",
  height: "",
  width: "",
  pieces: 1,
  thickness: "4mm",
  material: "Glass",
  remarks: "",
});

export function OrderForm({ nextOrderNumber, error }: { nextOrderNumber: number; error?: string }) {
  const [items, setItems] = useState<Item[]>([blankItem()]);
  function update(index: number, key: keyof Item, value: string | number) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }
  return (
    <form action={createOrderAction} className="panel form-panel">
      {error && (
        <div className="error-box" style={{ margin: 20 }}>
          {error}
        </div>
      )}
      <section className="form-section">
        <h2>Customer and order</h2>
        <div className="form-grid">
          <div className="field">
            <label>Order number</label>
            <input
              className="input"
              name="orderNumber"
              type="number"
              min="1"
              defaultValue={nextOrderNumber}
              required
            />
          </div>
          <div className="field">
            <label>Customer name</label>
            <input className="input" name="customerName" placeholder="Customer name" required />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input className="input" name="customerPhone" inputMode="tel" placeholder="Optional" />
          </div>
          <div className="field">
            <label>Due date</label>
            <input className="input" name="dueDate" type="date" />
          </div>
          <div className="field">
            <label>Order details</label>
            <select className="select" name="orderStatus">
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Payment details</label>
            <select className="select" name="paymentStatus">
              {PAYMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Total amount</label>
            <input
              className="input"
              name="totalAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="₹ 0"
            />
          </div>
          <div className="field">
            <label>Advance received</label>
            <input
              className="input"
              name="advanceAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="₹ 0"
            />
          </div>
          <div className="field span-2">
            <label>Order remarks</label>
            <textarea
              className="textarea"
              name="remarks"
              placeholder="Any special instruction or urgent note"
            />
          </div>
        </div>
      </section>
      <section className="form-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Work items</h2>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => setItems((value) => [...value, blankItem()])}
          >
            <Plus size={15} /> Add item
          </button>
        </div>
        {items.map((item, index) => (
          <div className="line-item" key={index}>
            <div className="line-item-title">
              <span>Item {index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  className="button button-danger button-small"
                  onClick={() => setItems((value) => value.filter((_, i) => i !== index))}
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
            <div className="compact-grid">
              <div className="field">
                <label>Description / image name</label>
                <input
                  className="input"
                  value={item.description}
                  onChange={(e) => update(index, "description", e.target.value)}
                  placeholder="Scenery, Waterfalls…"
                  required
                />
              </div>
              <div className="field">
                <label>Height</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.height}
                  onChange={(e) => update(index, "height", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Width</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.width}
                  onChange={(e) => update(index, "width", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Pieces</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={item.pieces}
                  onChange={(e) => update(index, "pieces", Number(e.target.value))}
                  required
                />
              </div>
              <div className="field">
                <label>Thickness</label>
                <select
                  className="select"
                  value={item.thickness}
                  onChange={(e) => update(index, "thickness", e.target.value)}
                >
                  {THICKNESSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Material</label>
                <select
                  className="select"
                  value={item.material}
                  onChange={(e) => update(index, "material", e.target.value)}
                >
                  {MATERIALS.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        <input type="hidden" name="items" value={JSON.stringify(items)} />
      </section>
      <div className="form-actions">
        <Link href="/orders" className="button button-secondary">
          Cancel
        </Link>
        <button className="button button-primary" type="submit">
          Create order
        </button>
      </div>
    </form>
  );
}
