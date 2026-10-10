import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Show } from "@refinedev/antd";
import { useCustomMutation, useInvalidate, useShow } from "@refinedev/core";
import {
  App,
  Alert,
  Button,
  Col,
  Descriptions,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { DescriptionsProps, TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import {
  EditableAccessValue,
  type EditableAccessField,
} from "../components/editable-access-value";
import { UserReportsList } from "../components/user-reports-list";
import { crmApiUrl } from "../providers/api";
import {
  profileStatusLabels,
  subscriptionStatusLabels,
  type CrmProfileStatus,
  type CrmSubscriptionStatus,
  type CrmUserDetails,
  type CrmUserPayment,
} from "../types/crm-user";

function textOrDash(value: string | null | undefined): string {
  return value || "—";
}

function dateOrDash(value: string | null | undefined): string {
  return value ? dayjs(value).format("DD MMM YYYY, HH:mm") : "—";
}

function profileAnswer(value: string | null | undefined): string {
  if (!value) return "—";
  const readable = value.replace(/_/g, " ");
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function paymentAmount(payment: CrmUserPayment): string {
  return payment.currency === "RUB"
    ? `${(payment.amount / 100).toFixed(2)} RUB`
    : `${payment.amount} ${payment.currency}`;
}

const paymentColumns: TableColumnsType<CrmUserPayment> = [
  { title: "ID", dataIndex: "id" },
  { title: "Provider", dataIndex: "provider" },
  { title: "Amount", render: (_, payment) => paymentAmount(payment) },
  { title: "Status", dataIndex: "status" },
  { title: "Plan", dataIndex: "planId", render: textOrDash },
  { title: "Paid at", dataIndex: "paidAt", render: dateOrDash },
  { title: "Created at", dataIndex: "createdAt", render: dateOrDash },
  {
    title: "Telegram charge ID",
    dataIndex: "telegramPaymentChargeId",
    render: textOrDash,
  },
  {
    title: "Provider charge ID",
    dataIndex: "providerPaymentChargeId",
    render: textOrDash,
  },
];

const accessFieldPaths: Record<EditableAccessField, string> = {
  paidUntil: "paid-until",
  subscriptionCreditsResetAt: "subscription-credits-reset-at",
  freeAnalysisCredits: "free-analysis-credits",
  subscriptionAnalysisCredits: "subscription-analysis-credits",
};

const descriptionStyles: DescriptionsProps["styles"] = {
  label: {
    width: "min(190px, 35vw)",
    flexShrink: 0,
    minHeight: 32,
    alignItems: "center",
  },
  content: {
    minHeight: 32,
    alignItems: "center",
  },
};

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

export function UserShowPage() {
  const { message } = App.useApp();
  const invalidate = useInvalidate();
  const [updatedUser, setUpdatedUser] = useState<CrmUserDetails | null>(null);
  const { query, showId } = useShow<CrmUserDetails>({
    resource: "users",
    queryOptions: { retry: false },
  });
  const { mutateAsync, mutation } = useCustomMutation<CrmUserDetails>();
  const user =
    updatedUser && String(updatedUser.id) === String(showId)
      ? updatedUser
      : query.data?.data;

  async function changeLifetimeAccess(grant: boolean) {
    if (!user || mutation.isPending) return;

    try {
      const result = await mutateAsync({
        url: `${crmApiUrl}/users/${encodeURIComponent(String(user.id))}/lifetime-access`,
        method: grant ? "post" : "delete",
        values: {},
      });
      setUpdatedUser(result.data);
      await invalidate({ resource: "users", invalidates: ["list"] });
      message.success(grant ? "Lifetime access granted." : "Lifetime access revoked.");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        error.statusCode === 409
      ) {
        setUpdatedUser(null);
        await query.refetch();
      }
    }
  }

  async function saveAccessField(
    field: EditableAccessField,
    value: string | number | null,
  ): Promise<boolean> {
    if (!user || mutation.isPending) return false;

    try {
      const result = await mutateAsync({
        url: `${crmApiUrl}/users/${encodeURIComponent(String(user.id))}/${accessFieldPaths[field]}`,
        method: "put",
        values: { [field]: value },
      });
      setUpdatedUser(result.data);
      await invalidate({ resource: "users", invalidates: ["list"] });
      message.success("Access updated.");
      return true;
    } catch {
      return false;
    }
  }

  function isSavingField(field: EditableAccessField): boolean {
    return (
      mutation.isPending &&
      mutation.variables?.url.endsWith(`/${accessFieldPaths[field]}`) === true
    );
  }

  return (
    <Show
      title={user ? `User ${user.telegramUserId}` : "User details"}
      isLoading={query.isLoading}
      headerButtons={[]}
      breadcrumb={false}
    >
      {query.isError ? (
        <Alert
          type="error"
          showIcon
          message={
            query.error?.statusCode === 404
              ? "User not found"
              : "Unable to load user details"
          }
        />
      ) : user ? (
        <Space direction="vertical" size={32} style={{ width: "100%" }}>
          <section>
            <Typography.Title level={4}>User profile</Typography.Title>
            <Row gutter={[48, 24]}>
              <Col xs={24} lg={12}>
                <Descriptions
                  column={1}
                  size="small"
                  styles={descriptionStyles}
                  items={[
                    { key: "id", label: "Inner ID", children: user.id },
                    {
                      key: "telegramUserId",
                      label: "Telegram ID",
                      children: user.telegramUserId,
                    },
                    {
                      key: "username",
                      label: "Username",
                      children: user.username ? `@${user.username}` : "—",
                    },
                    {
                      key: "name",
                      label: "Full name",
                      children: textOrDash(
                        [user.firstName, user.lastName].filter(Boolean).join(" "),
                      ),
                    },
                    {
                      key: "createdAt",
                      label: "Created at",
                      children: dateOrDash(user.createdAt),
                    },
                  ]}
                />
              </Col>
              <Col xs={24} lg={12}>
                <Descriptions
                  column={1}
                  size="small"
                  styles={descriptionStyles}
                  items={[
                    {
                      key: "status",
                      label: "Profile status",
                      children: (
                        <Tag color={profileStatusColors[user.profileStatus]}>
                          {profileStatusLabels[user.profileStatus]}
                        </Tag>
                      ),
                    },
                    {
                      key: "scalpType",
                      label: "Scalp type",
                      children: profileAnswer(user.profile?.scalpType),
                    },
                    {
                      key: "dandruff",
                      label: "Dandruff",
                      children:
                        user.profile?.dandruff == null
                          ? "—"
                          : user.profile.dandruff
                            ? "Yes"
                            : "No",
                    },
                    {
                      key: "hairType",
                      label: "Hair type",
                      children: profileAnswer(user.profile?.hairType),
                    },
                    {
                      key: "damageLevel",
                      label: "Damage level",
                      children: profileAnswer(user.profile?.damageLevel),
                    },
                  ]}
                />
              </Col>
            </Row>
          </section>

          <section>
            <Typography.Title level={4}>Subscription and credits</Typography.Title>
            <Descriptions
              column={1}
              size="small"
              styles={descriptionStyles}
              items={[
                {
                  key: "status",
                  label: "Subscription",
                  children: (
                    <Tag color={subscriptionStatusColors[user.subscriptionStatus]}>
                      {subscriptionStatusLabels[user.subscriptionStatus]}
                    </Tag>
                  ),
                },
                {
                  key: "paidUntil",
                  label: "Paid until",
                  children: (
                    <EditableAccessValue
                      key={`${user.id}-paidUntil`}
                      field="paidUntil"
                      label="Paid until"
                      kind="date"
                      value={user.paidUntil}
                      displayValue={dateOrDash(user.paidUntil)}
                      busy={mutation.isPending}
                      saving={isSavingField("paidUntil")}
                      onSave={saveAccessField}
                    />
                  ),
                },
                {
                  key: "resetAt",
                  label: "Credits reset at",
                  children: (
                    <EditableAccessValue
                      key={`${user.id}-subscriptionCreditsResetAt`}
                      field="subscriptionCreditsResetAt"
                      label="Credits reset at"
                      kind="date"
                      value={user.subscriptionCreditsResetAt}
                      displayValue={dateOrDash(user.subscriptionCreditsResetAt)}
                      busy={mutation.isPending}
                      saving={isSavingField("subscriptionCreditsResetAt")}
                      onSave={saveAccessField}
                    />
                  ),
                },
                {
                  key: "free",
                  label: "Free credits",
                  children: (
                    <EditableAccessValue
                      key={`${user.id}-freeAnalysisCredits`}
                      field="freeAnalysisCredits"
                      label="Free credits"
                      kind="number"
                      value={user.freeAnalysisCredits}
                      displayValue={user.freeAnalysisCredits}
                      busy={mutation.isPending}
                      saving={isSavingField("freeAnalysisCredits")}
                      onSave={saveAccessField}
                    />
                  ),
                },
                {
                  key: "subscription",
                  label: "Subscription credits",
                  children: (
                    <EditableAccessValue
                      key={`${user.id}-subscriptionAnalysisCredits`}
                      field="subscriptionAnalysisCredits"
                      label="Subscription credits"
                      kind="number"
                      value={user.subscriptionAnalysisCredits}
                      displayValue={user.subscriptionAnalysisCredits}
                      busy={mutation.isPending}
                      saving={isSavingField("subscriptionAnalysisCredits")}
                      onSave={saveAccessField}
                    />
                  ),
                },
                {
                  key: "total",
                  label: "Total credits",
                  children: user.totalAnalysisCredits,
                },
                {
                  key: "lifetimeAccess",
                  label: "Lifetime access",
                  children: (
                    <Space size={4} align="center">
                      <span>{user.lifetimeAccess ? "Active" : "Not active"}</span>
                      <Tooltip
                        title={
                          user.lifetimeAccess
                            ? "Revoke lifetime access"
                            : "Grant lifetime access"
                        }
                      >
                        <Button
                          type="text"
                          size="middle"
                          shape="circle"
                          icon={
                            user.lifetimeAccess ? <LockOutlined /> : <UnlockOutlined />
                          }
                          aria-label={
                            user.lifetimeAccess
                              ? "Revoke lifetime access"
                              : "Grant lifetime access"
                          }
                          disabled={mutation.isPending}
                          loading={
                            mutation.isPending &&
                            mutation.variables?.url.endsWith("/lifetime-access")
                          }
                          onClick={() =>
                            void changeLifetimeAccess(!user.lifetimeAccess)
                          }
                        />
                      </Tooltip>
                    </Space>
                  ),
                },
              ]}
            />
          </section>

          <section>
            <UserReportsList key={user.id} userId={user.id} />
          </section>

          <section>
            <Typography.Title level={5}>Payments</Typography.Title>
            <Table<CrmUserPayment>
              rowKey="id"
              columns={paymentColumns}
              dataSource={user.payments}
              scroll={{ x: true }}
              pagination={false}
              locale={{ emptyText: "No payments" }}
            />
          </section>
        </Space>
      ) : null}
    </Show>
  );
}
