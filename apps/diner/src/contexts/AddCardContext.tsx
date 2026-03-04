import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AddCardModal } from '../components/AddCardModal';

type AddCardContextValue = {
  openAddCard: () => void;
};

const AddCardContext = createContext<AddCardContextValue | null>(null);

export function AddCardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('card_saved') === '1') {
      setSearchParams({}, { replace: true });
      setShowDone(true);
      setIsOpen(true);
    }
  }, [searchParams, setSearchParams]);

  const openAddCard = useCallback(() => {
    setShowDone(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setShowDone(false);
  }, []);

  return (
    <AddCardContext.Provider value={{ openAddCard }}>
      {children}
      <AddCardModal isOpen={isOpen} onClose={close} showDone={showDone} />
    </AddCardContext.Provider>
  );
}

export function useAddCard() {
  const ctx = useContext(AddCardContext);
  return ctx ?? { openAddCard: () => {} };
}
