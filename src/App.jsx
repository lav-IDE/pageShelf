import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainArea } from './components/MainArea';
import { db } from './db';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initializing indexeddb
    db.open().then(() => {
      setLoading(false);
    }).catch(err => {
      console.error("Failed to open db", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading database...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">
      <Sidebar />
      <MainArea />
    </div>
  );
}

export default App;
