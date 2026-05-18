import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AddCardModal } from '../components/AddCardModal';

type AddCardContextValue = {
  openAddCard: (onSuccess?: () => void) => void;
};

const AddCardContext = createContext<AddCardContextValue | null>(null);

export function AddCardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const onSuccessRef = useRef<(() => void) | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('card_saved') === '1') {
      setSearchParams({}, { replace: true });
      setShowDone(true);
      setIsOpen(true);
    }
  }, [searchParams, setSearchParams]);

  const openAddCard = useCallback((onSuccess?: () => void) => {
    onSuccessRef.current = onSuccess ?? null;
    setShowDone(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setShowDone(false);
    onSuccessRef.current = null;
  }, []);

  const handleCardSuccess = useCallback(() => {
    onSuccessRef.current?.();
    onSuccessRef.current = null;
  }, []);

  return (
    <AddCardContext.Provider value={{ openAddCard }}>
      {children}
      <AddCardModal isOpen={isOpen} onClose={close} onSuccess={handleCardSuccess} showDone={showDone} />
    </AddCardContext.Provider>
  );
}

export function useAddCard() {
  const ctx = useContext(AddCardContext);
  return ctx ?? { openAddCard: () => {} };
}
