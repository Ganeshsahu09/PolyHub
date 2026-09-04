import React, { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Coins,
  Star,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import ModelViewer3D from "./ModelViewer3D";
import { useModel } from "../hooks/useCatalog";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { loadRazorpayScript } from "../lib/razorpay";

export default function PolyHubModelDetail({ modelId, onViewChange }) {
  const { model, viewUrl, loading, error } = useModel(modelId);
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState({ line1: "", city: "", postalCode: "", country: "" });
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [starred, setStarred] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | paying | paid | failed
  const [paymentError, setPaymentError] = useState(null);

  async function toggleStar() {
    try {
      const result = await api.post(`/models/${modelId}/star`);
      setStarred(result.starred);
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function placeOrder(e) {
    e.preventDefault();
    setPlacing(true);
    setOrderError(null);
    try {
      const order = await api.post("/orders", {
        modelId,
        quantity: Number(quantity),
        shippingAddress: address,
      });
      setOrderResult(order);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  // Real Razorpay checkout: create our own Payment row + a Razorpay
  // order server-side, open their widget, verify the signature we get
  // back, then reflect the real paid state in the UI.
  async function handlePayNow() {
    setPaymentStatus("paying");
    setPaymentError(null);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment widget — check your connection and try again.");
      }

      const payment = await api.post("/payments/create", { orderId: orderResult.id });

      const razorpay = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.razorpayOrderId,
        name: "PolyHub",
        description: model.title,
        prefill: { email: user?.email },
        theme: { color: "#2dd4bf" },
        handler: async (response) => {
          try {
            await api.post("/payments/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPaymentStatus("paid");
          } catch (err) {
            setPaymentStatus("failed");
            setPaymentError(err.message);
          }
        },
        modal: {
          ondismiss: () => {
            // Buyer closed the widget without paying — not an error,
            // just back to idle so they can try again.
            setPaymentStatus("idle");
          },
        },
      });

      razorpay.on("payment.failed", () => {
        setPaymentStatus("failed");
        setPaymentError("Payment failed or was declined.");
      });

      razorpay.open();
    } catch (err) {
      setPaymentStatus("failed");
      setPaymentError(err.message);
    }
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading model...</p>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-red-400">Failed to load model: {error}</p>
      </div>
    );
  }

  const price = Number(model.priceBase);
  const addressComplete = address.line1 && address.city && address.postalCode && address.country;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 font-sans antialiased sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          onClick={() => onViewChange?.("buyer-home")}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 hover:text-teal-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Browse
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video w-full rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-2xl">
              <ModelViewer3D modelUrl={viewUrl} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-900/40 border border-zinc-900/60 rounded-lg p-3 text-center">
                <span className="block text-[10px] uppercase font-mono text-zinc-500">Format</span>
                <span className="text-xs font-semibold text-teal-400 mt-0.5 block">{model.fileFormat?.toUpperCase()}</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900/60 rounded-lg p-3 text-center">
                <span className="block text-[10px] uppercase font-mono text-zinc-500">Category</span>
                <span className="text-xs font-semibold text-zinc-300 mt-0.5 block">{model.category}</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900/60 rounded-lg p-3 text-center">
                <span className="block text-[10px] uppercase font-mono text-zinc-500">Status</span>
                <span className="text-xs font-semibold text-zinc-300 mt-0.5 block">{model.status}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {model.category}
                </span>
                <button
                  onClick={toggleStar}
                  aria-pressed={starred}
                  className="flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1 text-zinc-400 hover:border-teal-400/40 hover:text-teal-300"
                >
                  <Star className={`h-3.5 w-3.5 ${starred ? "fill-teal-400 text-teal-400" : "fill-none"}`} />
                </button>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100 mt-2">{model.title}</h1>
              <p className="text-xs text-zinc-400 mt-1">
                by {model.designer?.user?.name || "Unknown designer"}
              </p>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{model.description}</p>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs font-mono">
              <span className="text-zinc-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" /> License:
              </span>
              <span className="text-zinc-300">{model.licenseType}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-zinc-400" /> Price:
              </span>
              <span className="font-semibold text-teal-300">
                {price === 0 ? "Free" : `$${price.toFixed(2)}`}
              </span>
            </div>

            <div className="border-t border-zinc-900 pt-4 space-y-3">
              <h3 className="text-xs font-mono font-semibold tracking-wide text-zinc-400 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-teal-400" /> PLACE ORDER
              </h3>

              {orderResult ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-teal-400/30 bg-teal-400/5 p-4">
                    <div className="flex items-center gap-2 text-teal-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Order placed</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                      Order ID: <span className="font-mono text-zinc-300">{orderResult.id}</span>
                    </p>
                    <p className="text-xs text-zinc-400">
                      Total: <span className="font-mono text-zinc-300">${Number(orderResult.estimatedCost).toFixed(2)}</span>
                    </p>
                  </div>

                  {paymentStatus === "paid" ? (
                    <div className="flex items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-400/10 p-4 text-teal-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Payment successful</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handlePayNow}
                        disabled={paymentStatus === "paying"}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                          paymentStatus === "paying"
                            ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
                            : "bg-teal-400 text-zinc-950 hover:bg-teal-300"
                        }`}
                      >
                        <CreditCard className="h-4 w-4" />
                        {paymentStatus === "paying" ? "Opening payment..." : `Pay $${Number(orderResult.estimatedCost).toFixed(2)}`}
                      </button>
                      {paymentStatus === "failed" && paymentError && (
                        <p className="text-xs text-red-400">{paymentError}</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={placeOrder} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-teal-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Address line</label>
                    <input
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-teal-400/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-teal-400/50"
                    />
                    <input
                      placeholder="Postal code"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-teal-400/50"
                    />
                  </div>
                  <input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-teal-400/50"
                  />

                  {orderError && <p className="text-xs text-red-400">{orderError}</p>}

                  <button
                    type="submit"
                    disabled={!addressComplete || placing}
                    className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                      addressComplete && !placing
                        ? "bg-teal-400 text-zinc-950 hover:bg-teal-300"
                        : "cursor-not-allowed bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    {placing ? "Placing order..." : `Order — $${(price * quantity).toFixed(2)}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}