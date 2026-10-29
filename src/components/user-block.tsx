import { StopOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Modal, Popconfirm, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

// Совпадает с лимитом backend на причину блокировки.
const REASON_MAX_LENGTH = 500;

type BlockButtonProps = {
  busy: boolean;
  saving: boolean;
  onBlock: (reason: string) => Promise<boolean>;
};

// Кнопка в шапке карточки: открывает окно с необязательной причиной.
export function BlockUserButton({ busy, saving, onBlock }: BlockButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function submit() {
    if (await onBlock(reason.trim())) {
      setOpen(false);
      setReason("");
    }
  }

  return (
    <>
      <Button
        danger
        icon={<StopOutlined />}
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Block user
      </Button>
      <Modal
        title="Block user"
        open={open}
        okText="Block"
        okButtonProps={{ danger: true, loading: saving }}
        cancelButtonProps={{ disabled: saving }}
        onOk={() => void submit()}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          The bot will answer any message from this user with a "you are blocked"
          notice. Subscription and credits stay unchanged.
        </Typography.Paragraph>
        <Input.TextArea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (optional, visible only in CRM)"
          maxLength={REASON_MAX_LENGTH}
          showCount
          autoSize={{ minRows: 3, maxRows: 6 }}
          // Счётчик символов висит под полем и без отступа наезжает на кнопки окна.
          style={{ marginBottom: 24 }}
        />
      </Modal>
    </>
  );
}

type BlockedAlertProps = {
  blockedAt: string;
  blockedReason: string | null;
  busy: boolean;
  saving: boolean;
  onUnblock: () => Promise<boolean>;
};

// Плашка вверху карточки заблокированного пользователя.
export function BlockedUserAlert({
  blockedAt,
  blockedReason,
  busy,
  saving,
  onUnblock,
}: BlockedAlertProps) {
  return (
    <Alert
      type="error"
      showIcon
      icon={<StopOutlined />}
      message={`Blocked since ${dayjs(blockedAt).format("DD MMM YYYY, HH:mm")}`}
      description={
        blockedReason ? (
          <span style={{ whiteSpace: "pre-wrap" }}>Reason: {blockedReason}</span>
        ) : (
          "No reason specified"
        )
      }
      action={
        <Popconfirm
          title="Unblock user?"
          description="The bot will work for this user again."
          okText="Unblock"
          onConfirm={() => onUnblock()}
          disabled={busy}
        >
          <Button disabled={busy} loading={saving}>
            Unblock
          </Button>
        </Popconfirm>
      }
    />
  );
}
