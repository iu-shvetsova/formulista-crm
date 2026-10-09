import { Card, Col, Empty, Flex, Row, Statistic, Typography } from "antd";

const metrics = ["Users", "Analyses", "Ingredients"];

export function DashboardPage() {
  return (
    <Flex vertical gap="large">
      <Typography.Title level={2}>Dashboard</Typography.Title>
      <Row gutter={[16, 16]}>
        {metrics.map((title) => (
          <Col xs={24} md={8} key={title}>
            <Card>
              <Statistic title={title} value="—" />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="Recent activity">
        <Empty description="No activity yet" />
      </Card>
    </Flex>
  );
}
