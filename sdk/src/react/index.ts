// Context & Provider
export { 
  DepositProvider, 
  useDepositContext,
  type DepositProviderProps,
  type DepositConfig,
  type DepositContextValue,
} from './context';

// Components
export { DepositWidget, type DepositWidgetProps } from './components/DepositWidget';
export { DepositModal, type DepositModalProps } from './components/DepositModal';
export { RecoveryWidget, type RecoveryWidgetProps } from './components/RecoveryWidget';
export { RecoveryModal, type RecoveryModalProps } from './components/RecoveryModal';

// Hooks
export { useDeposit, type UseDepositOptions, type UseDepositReturn } from './hooks/useDeposit';
export { useDepositClient, type UseDepositClientOptions, type UseDepositClientReturn } from './hooks/useDepositClient';

// Utils
export { cn } from './utils/cn';
