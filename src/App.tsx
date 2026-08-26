import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { GuestRoute } from "@/routes/GuestRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { RoomListPage } from "@/features/rooms/RoomListPage";
import { ExplorerPage } from "@/features/explorer/ExplorerPage";
import { Spinner } from "@/components/ui/Spinner";

// The document viewer and the public share surface are separate worlds from
// the app shell — most sessions never open one, so they load on demand.
const ViewerPage = lazy(() =>
  import("@/features/viewer/ViewerPage").then((m) => ({
    default: m.ViewerPage,
  })),
);
const PublicSharePage = lazy(() =>
  import("@/features/public/PublicSharePage").then((m) => ({
    default: m.PublicSharePage,
  })),
);
const PublicViewerPage = lazy(() =>
  import("@/features/public/PublicViewerPage").then((m) => ({
    default: m.PublicViewerPage,
  })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-vault-50">
      <Spinner className="size-6 text-accent" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Public link surface — no authentication is mounted on these. */}
          <Route path="/share/:token" element={<PublicSharePage />} />
          <Route
            path="/share/:token/f/:folderId"
            element={<PublicSharePage />}
          />
          <Route
            path="/share/:token/file/:fileId"
            element={<PublicViewerPage />}
          />

          <Route element={<ProtectedRoute />}>
            {/* The viewer is full-bleed, so it sits outside the app shell. */}
            <Route
              path="/rooms/:roomId/file/:fileId"
              element={<ViewerPage />}
            />

            <Route element={<AppShell />}>
              <Route index element={<RoomListPage />} />
              <Route path="/rooms/:roomId" element={<ExplorerPage />} />
              <Route
                path="/rooms/:roomId/f/:folderId"
                element={<ExplorerPage />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
