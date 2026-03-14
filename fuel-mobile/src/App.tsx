// src/App.tsx
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import AppRouter from './navigation/AppRouter.tsx';

function App() {
  useEffect(() => {
    useAuthStore.getState().rehydrate();
  }, []);

  return <AppRouter />;
}

export default App;