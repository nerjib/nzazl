"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  RotateCcw, 
  Wallet, 
  Calendar, 
  Receipt, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Download,
  Building,
  RefreshCw,
  Search,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  getCustomerSummary, 
  getCustomerPayments, 
  getCustomerHousePayments,
  getCustomerRefunds,
  getCustomerProfile
} from "@/services/zazzauPayments";

import DownloadStatementButton from "@/components/DownloadStatementButton";

export default function CustomerPaymentsPage() {
  const [activeTab, setActiveTab] = useState("payments"); // 'payments' | 'housing' | 'refunds'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [ippis, setIppis] = useState("");
  const [isClient, setIsClient] = useState(false);
  
  const [summary, setSummary] = useState({ totalPaid: 0, totalLandPaid: 0, totalHousePaid: 0, totalRefunded: 0, netPaid: 0 });
  const [payments, setPayments] = useState([]);
  const [housePayments, setHousePayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (targetIppis) => {
    setLoading(true);
    setError("");
    try {
      const [sumRes, payRes, houseRes, refRes, profRes] = await Promise.allSettled([
        getCustomerSummary(targetIppis),
        getCustomerPayments(targetIppis),
        getCustomerHousePayments(targetIppis),
        getCustomerRefunds(targetIppis),
        getCustomerProfile(targetIppis),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (payRes.status === "fulfilled") setPayments(payRes.value);
      if (houseRes.status === "fulfilled") setHousePayments(houseRes.value);
      if (refRes.status === "fulfilled") setRefunds(refRes.value);
      if (profRes.status === "fulfilled") setProfile(profRes.value);
    } catch (err) {
      setError(err?.message || "Failed to load financial records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    // 1. Get logged-in customer's IPPIS from localStorage or session
    let targetIppis = "";
    try {
      const storedSession = localStorage.getItem("userSession");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        targetIppis = parsed?.ippis || parsed?.userId || parsed?.email || parsed?.customerId || "";
      }
      if (!targetIppis) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          targetIppis = parsed?.ippis || parsed?.userId || parsed?.email || "";
        }
      }
    } catch (e) {
      console.error("Error reading user session", e);
    }

    if (!targetIppis) {
      setError("Customer IPPIS number not found. Please log in again.");
      setLoading(false);
      return;
    }

    setIppis(targetIppis);
    fetchData(targetIppis);
  }, []);

  const formatNaira = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const customerMeta = useMemo(() => {
    const firstPayment = payments.length > 0 ? payments[0] : (housePayments.length > 0 ? housePayments[0] : null);
    return {
      name: profile?.name || firstPayment?.name || "Customer",
      ippis: ippis,
      command: profile?.command || firstPayment?.command || "Kaduna Command",
      element: profile?.element || firstPayment?.element || "Zazzau Plot Contribution",
      legacyid: profile?.legacyid || firstPayment?.legacyid || null,
    };
  }, [profile, payments, housePayments, ippis]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase();
    return payments.filter(
      (p) =>
        (p.period && p.period.toLowerCase().includes(q)) ||
        (p.element && p.element.toLowerCase().includes(q)) ||
        (p.command && p.command.toLowerCase().includes(q)) ||
        (p.ref && String(p.ref).includes(q))
    );
  }, [payments, searchQuery]);

  const filteredHousePayments = useMemo(() => {
    if (!searchQuery.trim()) return housePayments;
    const q = searchQuery.toLowerCase();
    return housePayments.filter(
      (p) =>
        (p.period && p.period.toLowerCase().includes(q)) ||
        (p.element && p.element.toLowerCase().includes(q)) ||
        (p.command && p.command.toLowerCase().includes(q)) ||
        (p.ref && String(p.ref).includes(q))
    );
  }, [housePayments, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/customer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
              <ArrowLeft className="h-3 w-3" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments & Refunds</h1>
          <p className="text-sm text-slate-500">
            Track all IPPIS salary deductions and processed refund adjustments for <strong className="text-slate-700">{ippis}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchData(ippis);
            }}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <DownloadStatementButton
            customer={customerMeta}
            payments={payments}
            housePayments={housePayments}
            refunds={refunds}
            summary={summary}
            variant="secondary"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Land Paid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Land Deductions</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 font-mono">{formatNaira(summary.totalLandPaid)}</div>
          <p className="mt-1 text-xs text-slate-400">{payments.length} deductions (Land)</p>
        </div>

        {/* Total Housing Paid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Housing Deductions</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Home className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-indigo-600 font-mono">{formatNaira(summary.totalHousePaid)}</div>
          <p className="mt-1 text-xs text-slate-400">{housePayments.length} deductions (Housing)</p>
        </div>

        {/* Total Refunded */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Refunded</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 font-mono">{formatNaira(summary.totalRefunded)}</div>
          <p className="mt-1 text-xs text-slate-400">{refunds.length} refund adjustments</p>
        </div>

        {/* Net Contribution */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Net Contribution</span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-700 font-mono">{formatNaira(summary.netPaid)}</div>
          <p className="mt-1 text-xs text-emerald-700/80">Combined balance held</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "payments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Land Deductions ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("housing")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "housing"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Housing Deductions ({housePayments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("refunds")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "refunds"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Refunds ({refunds.length})</span>
          </button>
        </div>

        {(activeTab === "payments" || activeTab === "housing") && (payments.length > 5 || housePayments.length > 5) && (
          <div className="relative w-full sm:w-60 pb-2 sm:pb-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search deductions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Active Tab Content */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {activeTab === "payments" ? (
          payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No land payment deductions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Period</th>
                    <th className="px-6 py-3.5">Description / Element</th>
                    <th className="px-6 py-3.5">Command</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p, idx) => (
                    <tr key={p.ref || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2 whitespace-nowrap">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {p.period}
                      </td>
                      <td className="px-6 py-4">{p.element || "Land Loan Deduction"}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{p.command || "-"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 font-mono whitespace-nowrap">{formatNaira(p.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            p.status === "paid" || !p.status
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : p.status === "partially-refunded"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {(p.status === "paid" || !p.status) && <CheckCircle2 className="h-3 w-3" />}
                          {p.status === "partially-refunded" && <Clock className="h-3 w-3" />}
                          {p.status || "paid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === "housing" ? (
          housePayments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No housing payment deductions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Period</th>
                    <th className="px-6 py-3.5">Housing Element</th>
                    <th className="px-6 py-3.5">Command</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHousePayments.map((hp, idx) => (
                    <tr key={hp.id || hp.ref || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2 whitespace-nowrap">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        {hp.period}
                      </td>
                      <td className="px-6 py-4">{hp.element || "Housing Scheme"}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{hp.command || "-"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 font-mono whitespace-nowrap">{formatNaira(hp.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 capitalize">
                          <CheckCircle2 className="h-3 w-3" />
                          {hp.status || "paid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : refunds.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No refunds recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Payment Period</th>
                  <th className="px-6 py-3.5">Refund Amount</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Processed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{r.payment_period}</td>
                    <td className="px-6 py-4 font-semibold text-amber-600 font-mono whitespace-nowrap">{formatNaira(r.amount)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{r.reason || "Processed refund"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 capitalize">
                        <CheckCircle2 className="h-3 w-3" />
                        {r.status || "processed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
