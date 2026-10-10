import { List, useTable } from "@refinedev/antd";
import { Select, Space, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import type { CrmIngredient, CrmIngredientStatus } from "../types/crm-ingredient";

const statusLabels: Record<CrmIngredientStatus, string> = {
  new: "New",
  added: "Added",
  ignored: "Ignored",
};

const statusColors: Record<CrmIngredientStatus, string> = {
  new: "blue",
  added: "green",
  ignored: "default",
};

const columns: TableColumnsType<CrmIngredient> = [
  {
    title: "Name",
    dataIndex: "name",
    width: "42%",
  },
  {
    title: "Suggested INCI",
    dataIndex: "suggestedInci",
    width: "42%",
    render: (value: string | null) => value || "—",
  },
  {
    title: "Status",
    dataIndex: "status",
    width: "16%",
    render: (status: CrmIngredientStatus) => (
      <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    ),
  },
];

export function IngredientsPage() {
  const [status, setStatus] = useState<CrmIngredientStatus | "all">("all");
  const { tableProps, setFilters, setCurrentPage, tableQuery } = useTable<CrmIngredient>({
    resource: "unknown-ingredients",
    pagination: { currentPage: 1, pageSize: 20 },
    queryOptions: { retry: false },
  });

  return (
    <List
      title="Ingredients"
      headerButtons={
        <Select<CrmIngredientStatus | "all">
          aria-label="Filter ingredients by status"
          size="large"
          value={status}
          options={[
            { value: "all", label: "All statuses" },
            ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          ]}
          onChange={(value) => {
            setStatus(value);
            setCurrentPage(1);
            setFilters(
              value === "all" ? [] : [{ field: "status", operator: "eq", value }],
              "replace",
            );
          }}
          style={{ width: 280, maxWidth: "100%" }}
        />
      }
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {tableQuery.isError && (
          <Typography.Text type="danger">Unable to load ingredients.</Typography.Text>
        )}
        <Table<CrmIngredient>
          {...tableProps}
          rowKey="name"
          columns={columns}
          loading={tableQuery.isFetching}
          tableLayout="fixed"
          scroll={{ x: true }}
          locale={{ emptyText: tableQuery.isError ? "Ingredients unavailable" : "No ingredients" }}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total) => `${total} ingredients`,
          }}
        />
      </Space>
    </List>
  );
}
