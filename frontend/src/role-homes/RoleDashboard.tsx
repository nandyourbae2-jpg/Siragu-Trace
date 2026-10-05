import { useAuth } from '@/auth';
import { OwnerHome } from './OwnerHome';
import { OperatorHome } from './OperatorHome';
import { QaHome } from './QaHome';
import { BuyerPortal } from '@/buyer/BuyerPortal';
import { Navigate } from 'react-router';

export function RoleDashboard() {
  const { user } = useAuth();
  
  if (!user) return null;

  switch (user.role) {
    case 'owner': return <OwnerHome />;
    case 'operator': return <OperatorHome />;
    default: return <Navigate to="/403" replace />;
  }
}
