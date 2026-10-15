"use client";

import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";

export default function DownloadStatementButton({
  customer,
  payments = [],
  housePayments = [],
  refunds = [],
  summary = {},
  className = "",
  variant = "primary", // "primary" | "secondary"
}) {
  const [PDFModule, setPDFModule] = useState(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/StatementOfAccountPDF"),
    ])
      .then(([reactPdf, pdfDoc]) => {
        if (isMounted) {
          setPDFModule({
            PDFDownloadLink: reactPdf.PDFDownloadLink,
            StatementOfAccountPDF: pdfDoc.default,
          });
        }
      })
      .catch((err) => {
        console.error("Error loading PDF generator:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const defaultStyles =
    variant === "secondary"
      ? "inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
      : "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-blue-900 shadow-md hover:bg-blue-50 transition-all cursor-pointer active:scale-98";

  if (!PDFModule) {
    return (
      <span className={`${className || defaultStyles} opacity-80 cursor-wait`}>
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span>Preparing PDF...</span>
      </span>
    );
  }

  const { PDFDownloadLink, StatementOfAccountPDF } = PDFModule;
  const fileName = `statement_of_account_${customer?.ippis || "customer"}_${(customer?.name || "").replace(/\s+/g, "_")}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <StatementOfAccountPDF
          customer={customer}
          payments={payments}
          housePayments={housePayments}
          refunds={refunds}
          summary={summary}
        />
      }
      fileName={fileName}
      className={className || defaultStyles}
    >
      {({ loading }) => (
        <>
          <Download className="h-4 w-4 text-blue-700 flex-shrink-0" />
          <span>{loading ? "Generating PDF..." : "Download Statement (PDF)"}</span>
        </>
      )}
    </PDFDownloadLink>
  );
}
