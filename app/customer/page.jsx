"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building,
  CreditCard,
  RotateCcw,
  Wallet,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  LogOut,
  Download,
  RefreshCw,
  Search,
  MapPin,
  ShieldCheck,
  User,
  Copy,
  Check,
  FileText,
  Home
} from "lucide-react";
import {
  getCustomerSummary,
  getCustomerPayments,
  getCustomerHousePayments,
  getCustomerRefunds,
  getCustomerProfile,
  getCustomerPlots,
} from "@/services/zazzauPayments";

import DownloadStatementButton from "@/components/DownloadStatementButton";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const s = String(dateString).trim();
  let date = new Date(s);
  if (!isNaN(date.getTime())) return date.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
  if (/^\d{4}-\d{2}$/.test(s)) {
    date = new Date(s + "-01");
    if (!isNaN(date.getTime())) return date.toLocaleDateString("en-NG", { year: "numeric", month: "short" });
  }
  const normalized = s.replace(" ", "T").replace(" ", "");
  date = new Date(normalized);
  return isNaN(date.getTime()) ? s : date.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
};

const formatNaira = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount || 0);

export default function CustomerDashboard() {
  const router = useRouter();

  // State
  const [userSession, setUserSession] = useState(null);
  const [ippis, setIppis] = useState("");
  const [activeTab, setActiveTab] = useState("payments"); // 'payments' | 'housing' | 'refunds' | 'properties'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [copiedIppis, setCopiedIppis] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Data from live endpoints
  const [summary, setSummary] = useState({ totalPaid: 0, totalLandPaid: 0, totalHousePaid: 0, totalRefunded: 0, netPaid: 0 });
  const [payments, setPayments] = useState([]);
  const [housePayments, setHousePayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [profile, setProfile] = useState(null);
  const [plots, setPlots] = useState([]);

  // Search & Filters
  const [paymentSearch, setPaymentSearch] = useState("");

  useEffect(() => {
    setIsClient(true);

    // 1. Authenticate customer from session
    let sessionData = null;
    try {
      const storedSession = localStorage.getItem("userSession");
      if (storedSession) {
        sessionData = JSON.parse(storedSession);
      }
    } catch (e) {
      console.error("Error parsing userSession:", e);
    }

    if (!sessionData) {
      router.push("/login");
      return;
    }

    // Role check: ensure customer role
    if (sessionData.role && sessionData.role !== "customer") {
      router.push("/login");
      return;
    }

    setUserSession(sessionData);

    // 2. Determine IPPIS number
    let detectedIppis =
      sessionData.ippis ||
      sessionData.userId ||
      sessionData.email ||
      sessionData.customerId ||
      "";

    // Also check "user" object in localStorage as fallback
    if (!detectedIppis) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          detectedIppis = parsedUser?.ippis || parsedUser?.userId || parsedUser?.email || "";
        }
      } catch (e) {
        console.error("Error reading fallback user from localStorage:", e);
      }
    }

    if (!detectedIppis) {
      setError("Customer IPPIS number could not be determined. Please log in again.");
      setLoading(false);
      return;
    }

    setIppis(detectedIppis);
    loadAllCustomerData(detectedIppis);
  }, [router]);

  const loadAllCustomerData = async (targetIppis) => {
    setLoading(true);
    setError("");

    try {
      const [sumRes, payRes, houseRes, refRes, profRes, plotsRes] = await Promise.allSettled([
        getCustomerSummary(targetIppis),
        getCustomerPayments(targetIppis),
        getCustomerHousePayments(targetIppis),
        getCustomerRefunds(targetIppis),
        getCustomerProfile(targetIppis),
        getCustomerPlots(targetIppis),
      ]);

      // Summary
      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value);
      } else {
        console.warn("Failed to load summary:", sumRes.reason);
      }

      // Land Payments
      if (payRes.status === "fulfilled") {
        setPayments(payRes.value);
      } else {
        console.warn("Failed to load land payments:", payRes.reason);
      }

      // Housing Payments
      if (houseRes.status === "fulfilled") {
        setHousePayments(houseRes.value);
      } else {
        console.warn("Failed to load housing payments:", houseRes.reason);
      }

      // Refunds
      if (refRes.status === "fulfilled") {
        setRefunds(refRes.value);
      } else {
        console.warn("Failed to load refunds:", refRes.reason);
      }

      // Profile
      if (profRes.status === "fulfilled" && profRes.value) {
        setProfile(profRes.value);
      }

      // Plots
      if (plotsRes.status === "fulfilled") {
        setPlots(plotsRes.value);
      }
    } catch (err) {
      console.error("Error in loadAllCustomerData:", err);
      setError("Failed to load financial records. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!ippis) return;
    setRefreshing(true);
    loadAllCustomerData(ippis);
  };

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleCopyIppis = () => {
    if (!ippis) return;
    navigator.clipboard.writeText(ippis);
    setCopiedIppis(true);
    setTimeout(() => setCopiedIppis(false), 2000);
  };

  // Best display customer metadata
  const customerMeta = useMemo(() => {
    const firstPayment = payments.length > 0 ? payments[0] : (housePayments.length > 0 ? housePayments[0] : null);
    return {
      name: profile?.name || firstPayment?.name || firstPayment?.fullname || userSession?.name || "Customer",
      ippis: ippis,
      command: profile?.command || firstPayment?.command || "Kaduna Command",
      element: profile?.element || firstPayment?.element || "Zazzau Plot Contribution",
      legacyid: profile?.legacyid || firstPayment?.legacyid || null,
      phone: userSession?.phone || null,
      email: userSession?.email || null,
    };
  }, [profile, payments, housePayments, userSession, ippis]);

  // Filtered payments (Land)
  const filteredPayments = useMemo(() => {
    if (!paymentSearch.trim()) return payments;
    const q = paymentSearch.toLowerCase();
    return payments.filter(
      (p) =>
        (p.period && p.period.toLowerCase().includes(q)) ||
        (p.element && p.element.toLowerCase().includes(q)) ||
        (p.command && p.command.toLowerCase().includes(q)) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        (p.ref && String(p.ref).includes(q))
    );
  }, [payments, paymentSearch]);

  // Filtered payments (Housing)
  const filteredHousePayments = useMemo(() => {
    if (!paymentSearch.trim()) return housePayments;
    const q = paymentSearch.toLowerCase();
    return housePayments.filter(
      (p) =>
        (p.period && p.period.toLowerCase().includes(q)) ||
        (p.element && p.element.toLowerCase().includes(q)) ||
        (p.command && p.command.toLowerCase().includes(q)) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        (p.ref && String(p.ref).includes(q))
    );
  }, [housePayments, paymentSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <Building className="absolute h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">
          Loading your financial profile & records...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  NMS Zazzau Properties
                </span>
                <span className="text-xs text-blue-600 font-medium">Customer Portal</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>IPPIS: {ippis}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to fetch some financial records</p>
                <p className="text-red-700 text-xs mt-0.5">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-white hover:bg-red-100 text-red-700 border-red-200 text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Customer Profile Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-lg shadow-blue-900/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-inner">
                {customerMeta.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {customerMeta.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Contributor
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100/90">
                  <button
                    onClick={handleCopyIppis}
                    className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer group"
                    title="Click to copy IPPIS"
                  >
                    <span>IPPIS: <strong className="text-white font-mono">{customerMeta.ippis}</strong></span>
                    {copiedIppis ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>

                  {customerMeta.command && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 opacity-70" />
                      {customerMeta.command}
                    </span>
                  )}

                  {customerMeta.legacyid && (
                    <span className="hidden sm:inline text-blue-200">
                      Legacy ID: <span className="font-mono">{customerMeta.legacyid}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-blue-200/80 pt-1">
                  Element: <strong className="text-white font-medium">{customerMeta.element}</strong>
                </p>
              </div>
            </div>

            {/* Actions: Statement Download */}
            <div className="flex flex-wrap items-center gap-3">
              <DownloadStatementButton
                customer={customerMeta}
                payments={payments}
                housePayments={housePayments}
                refunds={refunds}
                summary={summary}
              />
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-1/3 -top-12 w-48 h-48 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Financial Stat Cards (4-column breakdown: Land, Housing, Refunded, Net) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Land Paid */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Land Deductions
              </span>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatNaira(summary.totalLandPaid)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{payments.length} monthly deductions</span>
              <span className="text-blue-600 font-medium">Land Scheme</span>
            </div>
          </div>

          {/* Total Housing Paid */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Housing Deductions
              </span>
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Home className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-indigo-600 font-mono">
              {formatNaira(summary.totalHousePaid)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{housePayments.length} monthly deductions</span>
              <span className="text-indigo-600 font-medium">Housing Scheme</span>
            </div>
          </div>

          {/* Total Refunded */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Refunded
              </span>
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <RotateCcw className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-amber-600 font-mono">
              {formatNaira(summary.totalRefunded)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{refunds.length} refund adjustments</span>
              <span className="text-amber-600 font-medium">Processed</span>
            </div>
          </div>

          {/* Net Contribution */}
          <div className="group rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Net Contribution
              </span>
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-700 font-mono">
              {formatNaira(summary.netPaid)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Combined net balance</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <Check className="h-3 w-3" /> Active Balance
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("payments")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 px-1 ${
                activeTab === "payments"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Land Deductions</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "payments" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                {payments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("housing")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 px-1 ${
                activeTab === "housing"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Housing Deductions</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "housing" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                {housePayments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("refunds")}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 px-1 ${
                activeTab === "refunds"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Refund Records</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "refunds" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                {refunds.length}
              </span>
            </button>

            {plots.length > 0 && (
              <button
                onClick={() => setActiveTab("properties")}
                className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 px-1 ${
                  activeTab === "properties"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Assigned Plots</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "properties" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {plots.length}
                </span>
              </button>
            )}
          </div>

          {(activeTab === "payments" || activeTab === "housing") && (payments.length > 5 || housePayments.length > 5) && (
            <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search deductions..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-slate-200"
              />
            </div>
          )}
        </div>

        {/* Tab Content Display */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {activeTab === "payments" ? (
            payments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">No land payment deductions recorded</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  There are currently no land loan deductions associated with IPPIS number{" "}
                  <strong className="text-slate-700">{ippis}</strong>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Period</th>
                      <th className="px-6 py-3.5">Description / Element</th>
                      <th className="px-6 py-3.5">Command</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p, idx) => {
                      const statusVal = p.status ? p.status.toLowerCase() : "paid";
                      return (
                        <tr key={p.ref || `pay-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span>{formatDate(p.period)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-900">{p.element || "Land Loan Deduction"}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {p.command || "-"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 font-mono whitespace-nowrap">
                            {formatNaira(p.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                statusVal === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                  : statusVal === "partially-refunded"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                                  : statusVal === "refunded"
                                  ? "bg-red-50 text-red-700 border border-red-200/50"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {statusVal === "paid" && <CheckCircle2 className="h-3 w-3" />}
                              {statusVal === "partially-refunded" && <Clock className="h-3 w-3" />}
                              {statusVal === "refunded" && <AlertCircle className="h-3 w-3" />}
                              {p.status || "Paid"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono text-right whitespace-nowrap">
                            #{p.ref || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "housing" ? (
            housePayments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Home className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">No housing deductions recorded</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  No monthly housing deduction records have been processed for IPPIS number{" "}
                  <strong className="text-slate-700">{ippis}</strong> yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Period</th>
                      <th className="px-6 py-3.5">Housing Scheme / Element</th>
                      <th className="px-6 py-3.5">Command</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHousePayments.map((hp, idx) => {
                      const statusVal = hp.status ? hp.status.toLowerCase() : "paid";
                      return (
                        <tr key={hp.id || hp.ref || `hp-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                              <span>{formatDate(hp.period)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-900">{hp.element || "Housing Scheme Contribution"}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {hp.command || "-"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 font-mono whitespace-nowrap">
                            {formatNaira(hp.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                statusVal === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {hp.status || "Paid"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono text-right whitespace-nowrap">
                            #{hp.ref || hp.id || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "refunds" ? (
            refunds.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">No refunds recorded</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  No deduction refunds or over-deduction reversals have been processed for this account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Payment Period</th>
                      <th className="px-6 py-3.5">Refund Amount</th>
                      <th className="px-6 py-3.5">Reason / Details</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refunds.map((r, idx) => (
                      <tr key={r.id || `ref-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(r.payment_period)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-600 font-mono whitespace-nowrap">
                          {formatNaira(r.amount)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700">
                          {r.reason || "Processed refund deduction"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 capitalize">
                            <CheckCircle2 className="h-3 w-3" />
                            {r.status || "processed"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 text-right whitespace-nowrap">
                          {r.createdAt ? formatDate(r.createdAt) : r.created_at ? formatDate(r.created_at) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Assigned Plots tab
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plots.map((plot, idx) => (
                  <div key={plot.id || `plot-${idx}`} className="border border-slate-200 rounded-xl p-5 hover:bg-slate-50/50 transition-colors space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-slate-900 text-base">{plot.title || plot.element || "Residential Plot"}</h4>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {formatNaira(plot.price)}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      {plot.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{plot.location}</span>
                        </div>
                      )}
                      {plot.size && <div>Size: {plot.size}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
