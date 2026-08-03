
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';

const Index: React.FC = () => {
  console.log('Index page rendering');
  
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default Index;
