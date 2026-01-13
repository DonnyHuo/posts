import type { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PostEditor from "./pages/PostEditor";
import Layout from "./components/Layout";
import PostFeed from "./pages/PostFeed";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="my" replace />} />
          <Route path="my" element={<PostFeed mode="my" />} />
          <Route path="all" element={<PostFeed mode="all" />} />
        </Route>

        <Route
          path="/posts/new"
          element={
            <ProtectedRoute>
              <PostEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/posts/edit/:id"
          element={
            <ProtectedRoute>
              <PostEditor />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard/my" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
