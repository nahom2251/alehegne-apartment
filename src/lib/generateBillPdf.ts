import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BillData {
  tenantName: string;
  unit: string;
  type: string;
  amount: number;
  month: string;
  paymentMethod: string;
  accountInfo: string;
  status: "PAID" | "PENDING";
}

export const generateBillPdf = (data: BillData) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(`${data.type} Invoice`, 14, 20);

  doc.setFontSize(12);
  doc.text(`Tenant: ${data.tenantName}`, 14, 35);
  doc.text(`Unit: ${data.unit}`, 14, 42);
  doc.text(`Month: ${data.month}`, 14, 49);
  doc.text(`Status: ${data.status}`, 14, 56);

  autoTable(doc, {
    startY: 65,
    head: [["Description", "Value"]],
    body: [
      ["Type", data.type],
      ["Amount", `${data.amount} ETB`],
      ["Payment Method", data.paymentMethod],
      ["Account", data.accountInfo],
    ],
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;

  doc.text("Powered by NUN tech", 14, finalY + 20);

  doc.save(`${data.type}-${data.status}-${Date.now()}.pdf`);
};