import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import AdvisoryIngestor from './pages/AdvisoryIngestor';
import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/ingestor" element={<AdminRoute><AdvisoryIngestor /></AdminRoute>} />
          <Route path="*" element={<Chat />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
