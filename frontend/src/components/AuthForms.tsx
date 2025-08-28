import { Button, Form, Input } from "antd";

interface AuthFormProps {
  onFinish: (values: { username: string; password: string }) => void;
  loading: boolean;
}

export default function AuthForm({ onFinish, loading }: AuthFormProps) {
  return (
    <Form
      name="basic"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
    >
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}