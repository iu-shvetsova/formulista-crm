import { EditOutlined } from "@ant-design/icons";
import { Button, DatePicker, Flex, InputNumber, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";

export type EditableAccessField =
  | "paidUntil"
  | "subscriptionCreditsResetAt"
  | "freeAnalysisCredits"
  | "subscriptionAnalysisCredits";

type Props = {
  field: EditableAccessField;
  label: string;
  kind: "date" | "number";
  value: string | number | null;
  displayValue: string | number;
  busy: boolean;
  saving: boolean;
  onSave: (
    field: EditableAccessField,
    value: string | number | null,
  ) => Promise<boolean>;
};

export function EditableAccessValue({
  field,
  label,
  kind,
  value,
  displayValue,
  busy,
  saving,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Dayjs | number | null>(null);

  function startEditing() {
    setDraft(
      kind === "date"
        ? typeof value === "string"
          ? dayjs(value)
          : null
        : typeof value === "number"
          ? value
          : null,
    );
    setEditing(true);
  }

  const validNumber =
    typeof draft === "number" &&
    Number.isInteger(draft) &&
    draft >= 0 &&
    draft <= 100_000;
  const validDate =
    draft === null ||
    (dayjs.isDayjs(draft) &&
      draft.isValid() &&
      draft.valueOf() <= Date.parse("2100-01-01T00:00:00Z"));

  async function save() {
    if (busy) return;
    const nextValue =
      kind === "date"
        ? draft === null
          ? null
          : dayjs.isDayjs(draft) && validDate
            ? draft.toISOString()
            : undefined
        : validNumber
          ? draft
          : undefined;
    if (nextValue === undefined) return;
    if (await onSave(field, nextValue)) setEditing(false);
  }

  if (!editing) {
    return (
      <Space size={4} align="center">
        <span>{displayValue}</span>
        <Button
          type="text"
          size="middle"
          shape="circle"
          icon={<EditOutlined />}
          aria-label={`Edit ${label}`}
          disabled={busy}
          onClick={startEditing}
        />
      </Space>
    );
  }

  return (
    <Flex align="center" wrap gap={8}>
      {kind === "date" ? (
        <DatePicker
          aria-label={label}
          size="large"
          style={{ width: 220 }}
          value={dayjs.isDayjs(draft) ? draft : null}
          onChange={setDraft}
          showTime={{ format: "HH:mm" }}
          format="DD MMM YYYY, HH:mm"
          maxDate={dayjs("2100-01-01T00:00:00Z")}
          allowClear
        />
      ) : (
        <InputNumber
          aria-label={label}
          size="large"
          style={{ width: 160 }}
          value={typeof draft === "number" ? draft : null}
          onChange={setDraft}
          min={0}
          max={100_000}
          precision={0}
        />
      )}
      <Button
        type="primary"
        size="large"
        loading={saving}
        disabled={busy || (kind === "date" ? !validDate : !validNumber)}
        onClick={() => void save()}
      >
        Save
      </Button>
      <Button
        size="large"
        disabled={busy}
        onClick={() => setEditing(false)}
      >
        Cancel
      </Button>
    </Flex>
  );
}
