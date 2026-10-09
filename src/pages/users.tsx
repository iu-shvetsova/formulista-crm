import { List, useTable } from "@refinedev/antd";
import { Input, Space, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";

type CrmUser = {
  id: number;
  telegramUserId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileStatus: "complete" | "in_progress" | "not_started";
  subscriptionStatus: "active" | "expired" | "none";
  paidUntil: string | null;
  freeAnalysisCredits: number;
  subscriptionAnalysisCredits: number;
  createdAt: string;
};

const profileStatusLabels: Record<CrmUser["profileStatus"], string> = {
  complete: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};

const subscriptionStatusLabels: Record<CrmUser["subscriptionStatus"], string> = {
  active: "Active",
  expired: "Expired",
  none: "None",
};

function formatDate(value: string | null): string {
  return value ? dayjs(value).format("DD MMM YYYY, HH:mm") : "—";
}

const columns: TableColumnsType<CrmUser> = [
  { title: "ID", dataIndex: "id", width: 90 },
  {
    title: "Name",
    render: (_, user) => [user.firstName, user.lastName].filter(Boolean).join(" ") || "—",
  },
  {
    title: "Username",
    dataIndex: "username",
    render: (username: string | null) => username ? `@${username}` : "—",
  },
  { title: "Telegram ID", dataIndex: "telegramUserId" },
  {
    title: "Profile",
    dataIndex: "profileStatus",
    render: (status: CrmUser["profileStatus"]) => profileStatusLabels[status],
  },
  {
    title: "Subscription",
    dataIndex: "subscriptionStatus",
    render: (status: CrmUser["subscriptionStatus"]) => subscriptionStatusLabels[status],
  },
  {
    title: "Paid until",
    dataIndex: "paidUntil",
    render: formatDate,
  },
  { title: "Free credits", dataIndex: "freeAnalysisCredits" },
  { title: "Subscription credits", dataIndex: "subscriptionAnalysisCredits" },
  {
    title: "Joined",
    dataIndex: "createdAt",
    render: formatDate,
  },
];

export function UsersPage() {
  const { tableProps, setFilters, setCurrentPage, tableQuery } = useTable<CrmUser>({
    resource: "users",
    pagination: { currentPage: 1, pageSize: 20 },
  });

  return (
    <List>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Input.Search
          aria-label="Search users"
          placeholder="Search by username or Telegram ID"
          allowClear
          maxLength={64}
          onSearch={(value) => {
            setCurrentPage(1);
            setFilters(value.trim() ? [{ field: "search", operator: "eq", value: value.trim() }] : [], "replace");
          }}
          style={{ maxWidth: 360 }}
        />
        {tableQuery.isError && <Typography.Text type="danger">Unable to load users.</Typography.Text>}
        <Table<CrmUser>
          {...tableProps}
          rowKey="id"
          columns={columns}
          loading={tableQuery.isFetching}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total) => `${total} users`,
          }}
        />
      </Space>
    </List>
  );
}
