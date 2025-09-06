import { http } from "../lib/http";
import { routes } from "../config/routes";

export const PaymentsService = {
  getDues: () => http({ path: routes.payments.dues }),
  makePayment: (payload) =>
    http({ path: routes.payments.pay, method: "POST", body: payload }),
};
