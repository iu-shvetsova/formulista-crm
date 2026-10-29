import { useCustomMutation, useList } from "@refinedev/core";
import {
  Alert,
  App,
  Button,
  Descriptions,
  Pagination,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { DescriptionsProps, TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router";
import { crmApiUrl } from "../providers/api";
import type {
  CrmReferralFriend,
  CrmFirstAnalysisRewardResult,
  CrmReferralPerson,
  CrmSubscriptionRewardResult,
  CrmUserReferral,
} from "../types/crm-referral";

function dateOrDash(value: string | null | undefined): string {
  return value ? dayjs(value).format("DD MMM YYYY, HH:mm") : "—";
}

function PersonLink({ person }: { person: CrmReferralPerson }) {
  return (
    <Link to={`/users/${person.id}`}>
      {person.username ? `@${person.username}` : person.telegramUserId}
    </Link>
  );
}

function RewardCell({ rewardedAt, children }: { rewardedAt: string | null; children: string }) {
  if (!rewardedAt) return <Tag>Pending</Tag>;
  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>{children}</Typography.Text>
      <Typography.Text type="secondary">{dateOrDash(rewardedAt)}</Typography.Text>
    </Space>
  );
}

type RewardKind = "subscription" | "first-analysis";
type Issuing = { friendId: number; kind: RewardKind } | null;

const rewardTexts: Record<RewardKind, { confirm: string; description: string; button: string; success: string }> = {
  subscription: {
    confirm: "Issue one month of subscription?",
    description:
      "The friend has paid, but the reward did not arrive. The inviter will get a Telegram notification.",
    button: "Issue month",
    success: "Subscription month issued.",
  },
  "first-analysis": {
    confirm: "Issue bonus credits?",
    description:
      "The friend's report was delivered, but the credits did not arrive. The inviter will get a Telegram notification.",
    button: "Issue credits",
    success: "Bonus credits issued.",
  },
};

// Награда, которая должна была прийти автоматически, но не пришла: метка и кнопка ручной выдачи.
function MissingReward({
  friend,
  kind,
  issuing,
  onIssue,
}: {
  friend: CrmReferralFriend;
  kind: RewardKind;
  issuing: Issuing;
  onIssue: (friend: CrmReferralFriend, kind: RewardKind) => void;
}) {
  const texts = rewardTexts[kind];
  return (
    <Space size={8} wrap>
      <Tag color="red" style={{ marginInlineEnd: 0 }}>Not issued</Tag>
      <Popconfirm
        title={texts.confirm}
        description={texts.description}
        okText="Issue"
        disabled={issuing !== null}
        onConfirm={() => onIssue(friend, kind)}
      >
        <Button
          type="primary"
          loading={issuing?.friendId === friend.id && issuing.kind === kind}
          disabled={issuing !== null}
        >
          {texts.button}
        </Button>
      </Popconfirm>
    </Space>
  );
}

function buildColumns(
  issuing: Issuing,
  onIssue: (friend: CrmReferralFriend, kind: RewardKind) => void,
): TableColumnsType<CrmReferralFriend> {
  const columns: TableColumnsType<CrmReferralFriend> = [
    { title: "Friend", render: (_, friend) => <PersonLink person={friend} /> },
    { title: "Telegram ID", dataIndex: "telegramUserId" },
    { title: "Joined at", dataIndex: "joinedAt", render: dateOrDash },
    {
      title: "First report reward",
      render: (_, friend) =>
        friend.firstAnalysisRewardMissing ? (
          <MissingReward friend={friend} kind="first-analysis" issuing={issuing} onIssue={onIssue} />
        ) : (
          <RewardCell rewardedAt={friend.firstAnalysisRewardedAt}>
            {`+${friend.firstAnalysisRewardCredits ?? 0} credits`}
          </RewardCell>
        ),
    },
    {
      title: "Subscription reward",
      render: (_, friend) =>
        friend.subscriptionRewardMissing ? (
          <MissingReward friend={friend} kind="subscription" issuing={issuing} onIssue={onIssue} />
        ) : (
          <RewardCell rewardedAt={friend.subscriptionRewardedAt}>
            {friend.subscriptionRewardMonths
              ? `+${friend.subscriptionRewardMonths} month`
              : "None (lifetime access)"}
          </RewardCell>
        ),
    },
  ];
  // Все столбцы одной ширины: при fixed-раскладке явные доли не зависят от содержимого.
  return columns.map((column) => ({ ...column, width: `${100 / columns.length}%` }));
}

const descriptionStyles: DescriptionsProps["styles"] = {
  label: { width: "min(190px, 35vw)", flexShrink: 0 },
};

export function UserReferrals({
  userId,
  referral,
  onRewardIssued,
}: {
  userId: number;
  referral: CrmUserReferral;
  // Награда выдана пригласившей: у неё изменились подписка, разборы и статистика, карточку надо обновить.
  onRewardIssued: () => void | Promise<void>;
}) {
  const { message } = App.useApp();
  const [issuing, setIssuing] = useState<Issuing>(null);
  const { mutateAsync } = useCustomMutation<CrmSubscriptionRewardResult | CrmFirstAnalysisRewardResult>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { query, result } = useList<CrmReferralFriend>({
    resource: "referrals",
    pagination: { currentPage: page, pageSize },
    filters: [{ field: "userId", operator: "eq", value: userId }],
    queryOptions: { retry: false },
  });

  async function issueReward(friend: CrmReferralFriend, kind: RewardKind) {
    if (issuing !== null) return;
    setIssuing({ friendId: friend.id, kind });
    try {
      await mutateAsync({
        url: `${crmApiUrl}/users/${encodeURIComponent(String(userId))}/referrals/${encodeURIComponent(String(friend.id))}/${kind}-reward`,
        method: "post",
        values: {},
      });
      message.success(rewardTexts[kind].success);
      await onRewardIssued();
    } catch {
      // Ошибку показывает провайдер уведомлений. «Уже выдана» (409) значит, что список
      // устарел, — обновим его в любом случае.
    } finally {
      await query.refetch();
      setIssuing(null);
    }
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ margin: 0 }}>Referrals</Typography.Title>

      <Descriptions
        column={1}
        size="small"
        styles={descriptionStyles}
        items={[
          {
            key: "code",
            label: "Referral code",
            children: referral.code ?? "Not created yet",
          },
          {
            key: "referredBy",
            label: "Invited by",
            children: referral.referredBy ? (
              <Space size={8} wrap>
                <PersonLink person={referral.referredBy} />
                <Typography.Text type="secondary">
                  {dateOrDash(referral.referredBy.joinedAt)}
                </Typography.Text>
              </Space>
            ) : (
              "—"
            ),
          },
          { key: "friends", label: "Friends joined", children: referral.stats.friendsJoined },
          { key: "credits", label: "Credits earned", children: referral.stats.creditsEarned },
          { key: "months", label: "Months gifted", children: referral.stats.monthsGifted },
        ]}
      />

      {query.isError ? (
        <Alert type="error" showIcon message="Unable to load invited friends." />
      ) : (
        <Table<CrmReferralFriend>
          rowKey="id"
          columns={buildColumns(issuing, (friend, kind) => void issueReward(friend, kind))}
          dataSource={result.data}
          loading={query.isFetching}
          tableLayout="fixed"
          pagination={false}
          locale={{ emptyText: "No invited friends" }}
        />
      )}

      {!query.isError && (result.total ?? 0) > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={result.total}
            showSizeChanger
            pageSizeOptions={[5, 10, 20]}
            showTotal={(total) => `${total} friends`}
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
