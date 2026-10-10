import { DashboardOutlined, ExperimentOutlined, UserOutlined } from "@ant-design/icons";
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
import { App as AntdApp, ConfigProvider } from "antd";
import { cloneElement, isValidElement } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { LoginForm } from "./components/login-form";
import { DashboardPage } from "./pages/dashboard";
import { IngredientsPage } from "./pages/ingredients";
import { UsersPage } from "./pages/users";
import { UserShowPage } from "./pages/user-show";
import { authProvider } from "./providers/auth-provider";
import { dataProvider } from "./providers/data-provider";

const antdTheme = { token: { fontSize: 16 } };

export function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={antdTheme}>
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
                show: "/users/:id",
                meta: { label: "Users", icon: <UserOutlined /> },
              },
              {
                name: "unknown-ingredients",
                list: "/ingredients",
                meta: { label: "Ingredients", icon: <ExperimentOutlined /> },
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
                <Route path="users/:id" element={<UserShowPage />} />
                <Route path="ingredients" element={<IngredientsPage />} />
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
      </ConfigProvider>
    </BrowserRouter>
  );
}
