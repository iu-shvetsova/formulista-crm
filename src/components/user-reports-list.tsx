import { useList } from "@refinedev/core";
import { Alert, Collapse, Descriptions, Empty, Image, Pagination, Select, Space, Spin, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { crmApiUrl } from "../providers/api";
import type { CrmAnalysis, CrmAnalysisStatus } from "../types/crm-analysis";
import "./user-reports-list.css";

const statusLabels: Record<CrmAnalysisStatus, string> = {
  processing: "Processing",
  delivering: "Delivering",
  success: "Success",
  invalid_composition: "Invalid composition",
  no_composition_found: "No composition found",
  error: "Error",
};

const statusColors: Record<CrmAnalysisStatus, string> = {
  processing: "blue",
  delivering: "orange",
  success: "green",
  invalid_composition: "default",
  no_composition_found: "default",
  error: "red",
};

function readable(value: string | null): string {
  if (!value) return "—";
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function inputPreview(analysis: CrmAnalysis): string {
  const text = analysis.inputText?.trim().replace(/\s+/g, " ");
  if (text) return text.length > 100 ? `${text.slice(0, 100)}…` : text;
  if (analysis.photoCount > 0) {
    return `${analysis.photoCount} ${analysis.photoCount === 1 ? "photo" : "photos"}`;
  }
  return "No input text";
}

function profileDetails(profile: CrmAnalysis["profileSnapshot"]) {
  if (!profile) return "—";
  const dandruff = profile.dandruff == null ? "Unknown dandruff" : profile.dandruff ? "Dandruff" : "No dandruff";
  return `${readable(profile.scalpType)} scalp · ${dandruff} · ${readable(profile.hairType)} hair · ${readable(profile.damageLevel)} damage`;
}

function ReportDetails({ analysis, userId }: { analysis: CrmAnalysis; userId: number }) {
  const profile = analysis.profileSnapshot;
  const photoUrls = Array.from(
    { length: analysis.photoCount },
    (_, index) => `${crmApiUrl}/users/${userId}/analyses/${analysis.id}/photos/${index}`,
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Descriptions
        column={1}
        size="small"
        items={[
          { key: "type", label: "Input type", children: readable(analysis.inputType) },
          { key: "photos", label: "Photos", children: analysis.photoCount },
          { key: "credit", label: "Credit type", children: readable(analysis.creditType) },
          {
            key: "profile",
            label: "Profile",
            children: profileDetails(profile),
          },
        ]}
      />

      {photoUrls.length > 0 && (
        <section>
          <Typography.Title level={5}>Input photos</Typography.Title>
          <Image.PreviewGroup>
            <Space wrap size="middle">
              {photoUrls.map((url, index) => (
                <Image
                  key={url}
                  src={url}
                  alt={`Analysis photo ${index + 1}`}
                  width={160}
                  height={160}
                  style={{ objectFit: "cover" }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        </section>
      )}

      <section>
        <Typography.Title level={5}>Input text</Typography.Title>
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginBottom: 0 }}>
          {analysis.inputText || "No input text available."}
        </Typography.Paragraph>
      </section>

      <section>
        <Typography.Title level={5}>Output</Typography.Title>
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginBottom: 0 }}>
          {analysis.report || "No report available."}
        </Typography.Paragraph>
      </section>

      {analysis.error && (
        <Alert type="error" showIcon message="Error" description={analysis.error} />
      )}
    </Space>
  );
}

export function UserReportsList({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [status, setStatus] = useState<CrmAnalysisStatus | "all">("all");
  const { query, result } = useList<CrmAnalysis>({
    resource: "analyses",
    pagination: { currentPage: page, pageSize },
    filters: [
      { field: "userId", operator: "eq", value: userId },
      ...(status !== "all" ? [{ field: "status" as const, operator: "eq" as const, value: status }] : []),
    ],
    queryOptions: { retry: false },
  });

  const items = result.data.map((analysis) => ({
    key: analysis.id,
    styles: {
      header: { paddingInline: 0 },
      body: { paddingInline: 0 },
    },
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <Typography.Text style={{ flex: "none" }}>
          {dayjs(analysis.createdAt).format("DD MMM YYYY, HH:mm")}
        </Typography.Text>
        <Tag color={statusColors[analysis.status]} style={{ flex: "none", marginInlineEnd: 0 }}>
          {statusLabels[analysis.status]}
        </Tag>
        <Typography.Text type="secondary" style={{ flex: "none" }}>
          {readable(analysis.inputType)}
        </Typography.Text>
        <Typography.Text ellipsis style={{ flex: 1, minWidth: 0 }}>
          {inputPreview(analysis)}
        </Typography.Text>
      </div>
    ),
    children: <ReportDetails analysis={analysis} userId={userId} />,
  }));

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>Reports</Typography.Title>
        <Select<CrmAnalysisStatus | "all">
          aria-label="Filter reports by status"
          size="large"
          value={status}
          options={[
            { value: "all", label: "All statuses" },
            ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          ]}
          onChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          style={{ width: 280, maxWidth: "100%" }}
        />
      </div>

      {query.isError ? (
        <Alert type="error" showIcon message="Unable to load reports." />
      ) : (
        <Spin spinning={query.isFetching}>
          {items.length > 0 ? (
            <Collapse className="user-reports-collapse" key={`${status}-${page}-${pageSize}`} size="large" ghost items={items} />
          ) : (
            <Empty description="No reports" />
          )}
        </Spin>
      )}

      {!query.isError && (result.total ?? 0) > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={result.total}
            showSizeChanger
            pageSizeOptions={[5, 10, 20]}
            showTotal={(total) => `${total} reports`}
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPageSize === pageSize ? nextPage : 1);
              setPageSize(nextPageSize);
            }}
          />
        </div>
      )}
    </Space>
  );
}
