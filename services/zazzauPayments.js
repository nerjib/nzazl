import { customBaseUrl } from "@/lib/https";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || customBaseUrl?.baseUrl || "https://myappapi-0be985206ca4.herokuapp.com";

/**
 * Fetch customer payment & refund totals with Land + Housing breakdown
 * @param {string} ippis - Customer IPPIS number
 * @returns {Promise<{totalPaid: number, totalLandPaid: number, totalHousePaid: number, totalRefunded: number, netPaid: number}>}
 */
export async function getCustomerSummary(ippis) {
  if (!ippis) {
    return {
      totalPaid: 0,
      totalLandPaid: 0,
      totalHousePaid: 0,
      totalRefunded: 0,
      netPaid: 0,
    };
  }
  
  try {
    const res = await fetch(`${BASE_URL}/api/v1/payments/summary/${encodeURIComponent(ippis)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch payment summary: ${res.statusText}`);
    }
    
    const json = await res.json();
    const data = json?.data || {};
    const totalPaid = Number(data.totalPaid || 0);
    const totalLandPaid = Number(data.totalLandPaid !== undefined ? data.totalLandPaid : totalPaid);
    const totalHousePaid = Number(data.totalHousePaid || 0);
    const totalRefunded = Number(data.totalRefunded || 0);
    const netPaid = Number(data.netPaid !== undefined ? data.netPaid : (totalLandPaid + totalHousePaid - totalRefunded));
    
    return {
      totalPaid,
      totalLandPaid,
      totalHousePaid,
      totalRefunded,
      netPaid,
    };
  } catch (error) {
    console.error("getCustomerSummary error:", error);
    throw error;
  }
}

/**
 * Fetch customer land payment deductions history
 * @param {string} ippis - Customer IPPIS number
 * @returns {Promise<Array>}
 */
export async function getCustomerPayments(ippis) {
  if (!ippis) return [];
  
  try {
    const res = await fetch(`${BASE_URL}/api/v1/payments/customer/${encodeURIComponent(ippis)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch payment history: ${res.statusText}`);
    }
    
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (error) {
    console.error("getCustomerPayments error:", error);
    throw error;
  }
}

/**
 * Fetch customer housing deduction records
 * @param {string} ippis - Customer IPPIS number
 * @returns {Promise<Array>}
 */
export async function getCustomerHousePayments(ippis) {
  if (!ippis) return [];

  try {
    const res = await fetch(`${BASE_URL}/api/v1/house-payments/customer/${encodeURIComponent(ippis)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch housing payment history: ${res.statusText}`);
    }

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (error) {
    console.error("getCustomerHousePayments error:", error);
    return [];
  }
}

/**
 * Fetch all housing payments with optional pagination & filters
 * @param {Object} params
 * @param {number} [params.page=1] - 1-based page number
 * @param {number} [params.limit=50] - Number of records per page
 * @param {string} [params.search=""] - IPPIS, Name, or Legacy ID
 * @param {string} [params.period=""] - Deduction period (e.g. 2024-05-01)
 * @returns {Promise<{status: boolean, data: Array, pagination: {total: number, totalAmount: number, page: number, limit: number, totalPages: number}}>}
 */
export async function getAllHousePayments({ page = 1, limit = 50, search = "", period = "" } = {}) {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (search && search.trim()) params.append("search", search.trim());
    if (period && period.trim()) params.append("period", period.trim());

    const queryString = params.toString();
    const url = `${BASE_URL}/api/v1/house-payments${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch housing payments: ${res.statusText}`);
    }

    const json = await res.json();
    return {
      status: Boolean(json.status),
      data: Array.isArray(json?.data) ? json.data : [],
      pagination: json.pagination || {
        total: json.data?.length || 0,
        totalAmount: 0,
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error("getAllHousePayments error:", error);
    return {
      status: false,
      data: [],
      pagination: { total: 0, totalAmount: 0, page: 1, limit: Number(limit) || 50, totalPages: 0 },
    };
  }
}

/**
 * Fetch customer housing deduction total sum
 * @param {string} ippis - Customer IPPIS number
 * @returns {Promise<number>}
 */
export async function getCustomerHouseTotal(ippis) {
  if (!ippis) return 0;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/house-payments/customer/total/${encodeURIComponent(ippis)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return 0;
    const json = await res.json();
    const sum = json?.data?.[0]?.sum;
    return Number(sum || 0);
  } catch (error) {
    console.error("getCustomerHouseTotal error:", error);
    return 0;
  }
}

/**
 * Fetch customer refund records
 * @param {string} ippis - Customer IPPIS number
 * @returns {Promise<Array>}
 */
export async function getCustomerRefunds(ippis) {
  if (!ippis) return [];
  
  try {
    const res = await fetch(`${BASE_URL}/api/v1/refunds/${encodeURIComponent(ippis)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch refund history: ${res.statusText}`);
    }
    
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (error) {
    console.error("getCustomerRefunds error:", error);
    throw error;
  }
}

/**
 * Fetch customer profile metadata from single customer payment endpoint
 * @param {string} ippis - Customer IPPIS number
 * @returns {Promise<Object|null>}
 */
export async function getCustomerProfile(ippis) {
  if (!ippis) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/payments/single/customer/${encodeURIComponent(ippis)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json?.data) && json.data.length > 0) {
      return json.data[0];
    }
    return json?.data || null;
  } catch (error) {
    console.error("getCustomerProfile error:", error);
    return null;
  }
}

/**
 * Fetch customer plots if any
 * @param {string} ippis - Customer IPPIS number
 * @returns {Promise<Array>}
 */
export async function getCustomerPlots(ippis) {
  if (!ippis) return [];

  try {
    const res = await fetch(`${BASE_URL}/api/v1/customers/plots/${encodeURIComponent(ippis)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (error) {
    console.error("getCustomerPlots error:", error);
    return [];
  }
}

/**
 * URL to download the Housing Payments Excel Template (.xlsx)
 */
export function getHousingTemplateUrl() {
  return `${BASE_URL}/api/v1/excel/template/housing`;
}

/**
 * Upload housing deductions Excel file (.xlsx)
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function uploadHousingPayments(file) {
  if (!file) throw new Error("No file provided");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/v1/excel/house-payments`, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Failed to upload housing payments file");
  }

  return json;
}
