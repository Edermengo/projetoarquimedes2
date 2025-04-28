import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BudgetEditor from './pages/BudgetEditor';
import PriceDatabase from './pages/PriceDatabase';
import Reports from './pages/Reports';
import Auth from './components/Auth';
import { useAuthStore } from './store/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/budget-editor"
            element={
              <PrivateRoute>
                <Layout>
                  <BudgetEditor />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/budget-editor/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <BudgetEditor />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/price-database"
            element={
              <PrivateRoute>
                <Layout>
                  <PriceDatabase />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Layout>
                  <Reports />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;