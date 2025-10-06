import {
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Table,
  Paper,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

function TableHeader() {
  return (
    <Toolbar className="!flex-1 !justify-center">
      <Typography className="!font-semibold" component="h5" variant="h5">
        Mô tả đơn hàng
      </Typography>
    </Toolbar>
  );
}

type OrderItem = { name: string; quantity: number; price: number };
type OrderData =
  | {
      id?: string | number;
      status?: string;
      items?: OrderItem[];
      amount?: number;
    }
  | null
  | undefined;

interface OrderTableDemoProps {
  data: OrderData;
}

export default function OrderTableDemo({ data }: OrderTableDemoProps) {
  return (
    <Box component={"div"}>
      <CssBaseline />
      <Box sx={{ marginTop: "40px", marginBottom: "40px" }}>
        <Typography className="!text-center">
          Đơn hàng <b>{data?.id ? `#${data.id}` : "không tìm thấy"}</b>
          {data?.status
            ? data.status === "PAID"
              ? ` đã thanh toán thành công`
              : ` chưa được thanh toán`
            : ""}
        </Typography>
      </Box>
      <Box
        sx={{
          width: "100%",
          marginBottom: "40px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Paper>
          <TableHeader />
          <TableContainer>
            <Table size="small" className="md:min-w-[700px]">
              <TableBody>
                {data ? (
                  <>
                    <TableRow key={"id"}>
                      <TableCell align="left">
                        <Typography>Mã đơn hàng</Typography>
                      </TableCell>
                      <TableCell align="left">
                        <b>#{data["id"]}</b>
                      </TableCell>
                    </TableRow>
                    <TableRow key={"status"}>
                      <TableCell align="left">Trạng thái</TableCell>
                      <TableCell align="left">
                        {data["status"] === "PAID"
                          ? "Đã thanh toán"
                          : "Chưa thanh toán"}
                      </TableCell>
                    </TableRow>
                    <TableRow key={"items"}>
                      <TableCell align="left">Sản phẩm</TableCell>
                      <TableCell align="left">
                        {data.items && data.items.length > 0 ? (
                          <ul>
                            <li>{`Tên sản phẩm: ${data.items[0].name}`}</li>
                            <li>{`Số lượng: ${data.items[0].quantity}`}</li>
                            <li>{`Đơn giá: ${data.items[0].price} VNĐ`}</li>
                          </ul>
                        ) : (
                          <Typography>Không có sản phẩm</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow key={"amount"}>
                      <TableCell align="left">Tổng tiền</TableCell>
                      <TableCell align="left">{data["amount"]} VNĐ</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow
                    key={0}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell align="center" colSpan={12}>
                      Không có thông tin đơn hàng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
