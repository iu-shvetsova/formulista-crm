import { List, useTable } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Input, Space, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import {
  profileStatusLabels,
  subscriptionStatusLabels,
  type CrmProfileStatus,
  type CrmSubscriptionStatus,
  type CrmUserListItem,
} from "../types/crm-user";

const subscriptionStatusColors: Record<CrmSubscriptionStatus, string> = {
  active: "green",
  expired: "red",
  none: "default",
};

const profileStatusColors: Record<CrmProfileStatus, string> = {
  complete: "blue",
  in_progress: "orange",
  not_started: "default",
};

function formatDate(value: string | null): string {
  return value ? dayjs(value).format("DD MMM YYYY, HH:mm") : "—";
}

const columns: TableColumnsType<CrmUserListItem> = [
  { title: "Telegram ID", dataIndex: "telegramUserId" },
  {
    title: "Username",
    dataIndex: "username",
    render: (username: string | null) => (username ? `@${username}` : "—"),
  },
  {
    title: "Profile",
    dataIndex: "profileStatus",
    render: (status: CrmUserListItem["profileStatus"]) => (
      <Tag color={profileStatusColors[status]}>{profileStatusLabels[status]}</Tag>
    ),
  },
  {
    title: "Subscription",
    dataIndex: "subscriptionStatus",
    render: (status: CrmUserListItem["subscriptionStatus"]) => (
      <Tag color={subscriptionStatusColors[status]}>
        {subscriptionStatusLabels[status]}
      </Tag>
    ),
  },
  {
    title: "Paid until",
    dataIndex: "paidUntil",
    render: formatDate,
  },
];

export function UsersPage() {
  const { show } = useNavigation();
  const { tableProps, setFilters, setCurrentPage, tableQuery } =
    useTable<CrmUserListItem>({
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
          size="large"
          maxLength={64}
          onSearch={(value) => {
            setCurrentPage(1);
            setFilters(
              value.trim()
                ? [{ field: "search", operator: "eq", value: value.trim() }]
                : [],
              "replace",
            );
          }}
          style={{ maxWidth: 400 }}
        />
        {tableQuery.isError && (
          <Typography.Text type="danger">Unable to load users.</Typography.Text>
        )}
        <Table<CrmUserListItem>
          {...tableProps}
          rowKey="id"
          columns={columns}
          onRow={(user) => ({
            onClick: () => show("users", user.id),
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                show("users", user.id);
              }
            },
            role: "link",
            tabIndex: 0,
            "aria-label": `View user ${user.telegramUserId}`,
            style: { cursor: "pointer" },
          })}
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
