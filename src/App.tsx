import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import NotesList from './pages/NotesList';
import NoteEditor from './pages/NoteEditor';
import TagsManager from './pages/TagsManager';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/notes" 
          element={
            <ProtectedRoute>
              <NotesList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notes/new" 
          element={
            <ProtectedRoute>
              <NoteEditor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notes/:id" 
          element={
            <ProtectedRoute>
              <NoteEditor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tags" 
          element={
            <ProtectedRoute>
              <TagsManager />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/notes" />} />
      </Routes>
    </Router>
  );
}

export default App;
