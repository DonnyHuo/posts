import type { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PostEditor from "./pages/PostEditor";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import PostFeed from "./pages/PostFeed";
import SearchResults from "./pages/SearchResults";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/dashboard/all" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 所有页面都使用 Layout（包含统一的 Header 和 Footer） */}
        <Route path="/" element={<Layout />}>
          {/* 默认跳转到公开首页 */}
          <Route index element={<Navigate to="/dashboard/all" replace />} />

          {/* Dashboard 路由 */}
          <Route path="dashboard">
            <Route index element={<Navigate to="all" replace />} />
            <Route path="all" element={<PostFeed mode="all" />} />
            <Route
              path="my"
              element={
                <ProtectedRoute>
                  <PostFeed mode="my" />
                </ProtectedRoute>
              }
            />
            <Route
              path="liked"
              element={
                <ProtectedRoute>
                  <PostFeed mode="liked" />
                </ProtectedRoute>
              }
            />
            <Route
              path="favorited"
              element={
                <ProtectedRoute>
                  <PostFeed mode="favorited" />
                </ProtectedRoute>
              }
            />
            <Route
              path="commented"
              element={
                <ProtectedRoute>
                  <PostFeed mode="commented" />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Search 页面 - 公开 */}
          <Route path="search" element={<SearchResults />} />

          {/* Profile 页面 - 需要登录 */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Post 详情页 - 公开 */}
          <Route path="posts/:id" element={<PostDetail />} />

          {/* Post 编辑器 - 需要登录 */}
          <Route
            path="posts/new"
            element={
              <ProtectedRoute>
                <PostEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="posts/edit/:id"
            element={
              <ProtectedRoute>
                <PostEditor />
              </ProtectedRoute>
            }
          />

          {/* 旧的登录注册链接重定向到首页 */}
          <Route
            path="login"
            element={<Navigate to="/dashboard/all" replace />}
          />
          <Route
            path="register"
            element={<Navigate to="/dashboard/all" replace />}
          />

          {/* 其他未匹配路由也跳转到首页 */}
          <Route path="*" element={<Navigate to="/dashboard/all" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
