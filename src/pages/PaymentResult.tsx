import { useEffect, useRef, useState } from "react";
import {
  Box,
  LinearProgress,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Removed detailed tables per simplified UI requirement
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import api from "../utils/axiosInstance";
import type { GetOrderResponse } from "../types/checkout";

// Fetch order details by orderCode

async function getOrder(orderCode: string): Promise<GetOrderResponse> {
  const res = await api.get(`/payments/${orderCode}`);
  return res.data as GetOrderResponse;
}

export default function PaymentResult() {
  const [order, setOrder] = useState<GetOrderResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const location = useLocation();
  const activatedRef = useRef(false);

  // Adjust this ID to match your backend's Premium (monthly) subscription record
  const PREMIUM_SUBSCRIPTION_ID = 1;

  const search = new URLSearchParams(location.search);
  const qp = {
    code: search.get("code"),
    id: search.get("id"),
    cancel: search.get("cancel"),
    status: search.get("status"),
    orderCode: search.get("orderCode"),
  };
  const orderCode: string | null =
    qp.orderCode ??
    (location.state as { orderCode?: string } | null)?.orderCode ??
    null;

  // Determine outcome based on query parameters
  const isCanceled = qp.cancel?.toLowerCase() === "true";
  const isSuccess =
    !isCanceled && (qp.status?.toUpperCase() === "PAID" || qp.code === "00");
  const outcome: "success" | "cancel" | "failed" | "unknown" = isCanceled
    ? "cancel"
    : isSuccess
    ? "success"
    : qp.status
    ? "failed"
    : "unknown";

  const formatVnd = (val?: number) =>
    typeof val === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(val)
      : "—";

  const getOutcomeTitle = () =>
    outcome === "success"
      ? "Payment Successful"
      : outcome === "cancel"
      ? "You Cancelled the Payment"
      : outcome === "failed"
      ? "Payment Failed"
      : "Transaction Result";

  const IconCentered = () => {
    const size = 70;
    if (outcome === "success")
      return <CheckCircleIcon color="success" sx={{ fontSize: size }} />;
    if (outcome === "cancel")
      return <CancelIcon color="warning" sx={{ fontSize: size }} />;
    if (outcome === "failed")
      return <ErrorOutlineIcon color="error" sx={{ fontSize: size }} />;
    return <InfoOutlinedIcon color="info" sx={{ fontSize: size }} />;
  };

  useEffect(() => {
    if (orderCode !== null) {
      getOrder(orderCode)
        .then((data: GetOrderResponse) => {
          setOrder(data);
          setLoading(false);
        })
        .catch(() => {
          toast.error("An error occurred");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderCode]);

  // On success, confirm Premium activation with backend (run once)
  useEffect(() => {
    if (outcome !== "success" || !orderCode || activatedRef.current) return;

    const orderIdNum = Number(orderCode);
    if (!Number.isFinite(orderIdNum)) {
      // Invalid order id in query params
      return;
    }

    activatedRef.current = true;
    api
      .post("/payments/activate-premium", {
        orderId: orderIdNum,
        subscriptionId: PREMIUM_SUBSCRIPTION_ID,
      })
      .then(() => {
        toast.success("Premium activated successfully");
      })
      .catch(() => {
        // Could be already activated or a transient error
        toast.info(
          "Payment recorded. If Premium isn't active, please refresh."
        );
      });
  }, [outcome, orderCode]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 120px)",
        py: 6,
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ maxWidth: 700, mx: "auto" }}>
        <Card elevation={3}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <IconCentered />
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1.5 }}>
                {getOutcomeTitle()}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Order ID: <b>#{orderCode ?? "—"}</b>
              </Typography>
            </Box>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {outcome === "success"
                  ? "Paid"
                  : outcome === "cancel"
                  ? "Cancelled"
                  : qp.status ?? "—"}
              </Typography>

              {outcome === "success" && (
                <>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Total Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {formatVnd(
                      typeof (order as GetOrderResponse | null)?.amount ===
                        "number"
                        ? (order as GetOrderResponse)?.amount
                        : undefined
                    )}
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Transaction Time
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {order?.transactions[0]?.transactionDateTime
                      ? (() => {
                          const d = new Date(
                            order.transactions[0].transactionDateTime
                          );
                          const pad = (n: number) =>
                            n.toString().padStart(2, "0");
                          return `${d.getFullYear()}-${pad(
                            d.getMonth() + 1
                          )}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
                            d.getMinutes()
                          )}:${pad(d.getSeconds())}`;
                        })()
                      : "—"}
                  </Typography>
                </>
              )}
            </Box>

            {outcome === "success" && loading && (
              <LinearProgress sx={{ mt: 2 }} />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
