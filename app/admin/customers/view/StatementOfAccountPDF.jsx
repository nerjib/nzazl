
const logo = 'data:image/png;base64,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';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateRange: {
    fontSize: 12,
    color: '#555',
  },
  customerInfo: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 10,
  },
});

const normalizeDate = (dateString) => {
  if (!dateString) return null;
  const normalized = dateString.replace(" ", "T").replace(" ", "");
  return new Date(normalized);
};

const StatementOfAccountPDF = ({ customer, payments, refunds }) => {
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRefunds = refunds.reduce((sum, refund) => sum + refund.amount, 0);

  const allDates = [
    ...payments.map(p => normalizeDate(p.period)),
    ...refunds.map(r => normalizeDate(r.payment_period)),
  ].filter(date => date && !isNaN(date.getTime())); // Filter out invalid dates

  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : null;
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={logo} />
          <View>
            <Text style={styles.title}>Statement of Account</Text>
            {minDate && maxDate && (
              <Text style={styles.dateRange}>
                From: {minDate.toLocaleDateString()} To: {maxDate.toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <Text>Name: {customer?.name}</Text>
            <Text>ID No: {customer?.ippis}</Text>
            {/* <Text>Email: {customer?.email}</Text>
            <Text>Phone: {customer?.phone}</Text> */}
            <Text>Command: {customer?.command}</Text>
          </View>
          
          <View>
            <Text style={styles.sectionTitle}>Summary of Payment</Text>
            <Text>Total Payments: NGN {totalPayments.toLocaleString()}</Text>
            {refunds.length > 0 && <Text>Total Refunds: NGN {totalRefunds.toLocaleString()}</Text>}
          </View>
        </View>
        

        <View>
          <Text style={styles.sectionTitle}>Payments</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Date</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Property</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Amount</Text>
              </View>
              <View style={styles.tableCol}>
                {/* <Text style={styles.tableCell}>Status</Text> */}
              </View>
            </View>
            {payments.map((payment, index) => (
              <View style={styles.tableRow} key={payment.id || `payment-${index}`}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{normalizeDate(payment.period)?.toLocaleDateString() || "N/A"}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{payment.element}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>NGN {Number(payment.amount || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.tableCol}>
                  {/* <Text style={styles.tableCell}>{payment.status}</Text> */}
                </View>
              </View>
            ))}
            <View style={styles.tableRow}>
              <View style={styles.tableCol}></View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Total</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>NGN {totalPayments.toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}></View>
            </View>
          </View>
        </View>

        {refunds.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Refunds</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Date</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Amount</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Reason</Text>
                </View>
                <View style={styles.tableCol}>
                  {/* <Text style={styles.tableCell}>Status</Text> */}
                </View>
              </View>
              {refunds.map((refund, index) => (
                <View style={styles.tableRow} key={refund.id || `refund-${index}`}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{normalizeDate(refund.payment_period)?.toLocaleDateString() || "N/A"}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>NGN {Number(refund.amount || 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{refund.reason}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    {/* <Text style={styles.tableCell}>{refund.status}</Text> */}
                  </View>
                </View>
              ))}
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Total</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>NGN {totalRefunds.toLocaleString()}</Text>
                </View>
                <View style={styles.tableCol}></View>
                <View style={styles.tableCol}></View>
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default StatementOfAccountPDF;
