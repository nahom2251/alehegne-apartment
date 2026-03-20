export const getPaymentMethod = (type: string) => {
  if (type === "Electricity" || type === "Water") {
    return {
      method: "Telebirr",
      accountName: "Alehegne",
      account: "0911238816",
    };
  }

  if (type === "Rent") {
    return {
      method: "CBE Bank Transfer",
      accountName: "Bayush Kassa",
      account: "1000499143072",
    };
  }

  return {
    method: "-",
    accountName: "-",
    account: "-",
  };
};