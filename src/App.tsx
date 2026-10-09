import { DashboardOutlined, UserOutlined } from "@ant-design/icons";
import {
  AuthPage,
  ErrorComponent,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/antd";
import { Authenticated, Refine } from "@refinedev/core";
import routerProvider, {
  CatchAllNavigate,
  NavigateToResource,
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { cloneElement, isValidElement } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { LoginForm } from "./components/login-form";
import { DashboardPage } from "./pages/dashboard";
import { UsersPage } from "./pages/users";
import { authProvider } from "./providers/auth-provider";
import { dataProvider } from "./providers/data-provider";

export function App() {
  return (
    <BrowserRouter>
      <AntdApp>
        <Refine
          authProvider={authProvider}
          dataProvider={dataProvider}
          routerProvider={routerProvider}
          notificationProvider={useNotificationProvider}
          resources={[
            {
              name: "dashboard",
              list: "/dashboard",
              meta: { label: "Dashboard", icon: <DashboardOutlined /> },
            },
            {
              name: "users",
              list: "/users",
              meta: { label: "Users", icon: <UserOutlined /> },
            },
          ]}
          options={{
            disableTelemetry: true,
            title: { text: "Formulista CRM" },
          }}
        >
          <Routes>
            <Route
              element={
                <Authenticated
                  key="protected"
                  fallback={<CatchAllNavigate to="/login" />}
                >
                  <ThemedLayout>
                    <Outlet />
                  </ThemedLayout>
                </Authenticated>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="*" element={<ErrorComponent />} />
            </Route>
            <Route
              element={
                <Authenticated key="public" fallback={<Outlet />}>
                  <NavigateToResource resource="dashboard" />
                </Authenticated>
              }
            >
              <Route
                path="login"
                element={
                  <AuthPage
                    type="login"
                    registerLink={false}
                    forgotPasswordLink={false}
                    rememberMe={false}
                    hideForm
                    renderContent={(content, title) => (
                      <>
                        {title}
                        {isValidElement(content) ? cloneElement(content, undefined, <LoginForm />) : content}
                      </>
                    )}
                  />
                }
              />
            </Route>
          </Routes>
        </Refine>
      </AntdApp>
    </BrowserRouter>
  );
}
