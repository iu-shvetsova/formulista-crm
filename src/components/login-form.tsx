import { useLogin } from "@refinedev/core";
import { Button, Form, Input } from "antd";
import type { LoginValues } from "../providers/auth-provider";

export function LoginForm() {
  const { mutate: login, isPending } = useLogin<LoginValues>();

  return (
    <Form<LoginValues> layout="vertical" onFinish={login} requiredMark={false}>
      <Form.Item
        name="login"
        rules={[{ required: true, message: "Login is required" }]}
      >
        <Input size="large" autoComplete="username" placeholder="Login" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Password is required" }]}
      >
        <Input
          size="large"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
        />
      </Form.Item>
      <div style={{ marginBottom: 24 }} />
      <Form.Item>
        <Button type="primary" size="large" htmlType="submit" loading={isPending} block>
          Sign in
        </Button>
      </Form.Item>
    </Form>
  );
}
