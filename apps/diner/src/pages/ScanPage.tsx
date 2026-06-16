import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddCard } from '../contexts/AddCardContext';
import { QrCode, Camera, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Html5Qrcode } from 'html5-qrcode';
import { API_URL } from '../lib/api';

/** Test mode only in development — never on production (driftpos.com, app.driftpos.com) */
const SHOW_TEST_MODE = import.meta.env.DEV;

type TestTable = { id: string; number: number; restaurantName: string };

export function ScanPage() {
  const navigate = useNavigate();
  const { openAddCard } = useAddCard();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTestOptions, setShowTestOptions] = useState(false);
  const [testTables, setTestTables] = useState<TestTable[]>([]);
  const [testTablesLoading, setTestTablesLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    await new Promise((r) => setTimeout(r, 100));
    const div = document.getElementById(scannerId);
    if (!div) {
      setError('Camera failed to initialize. Please try again.');
      setScanning(false);
      return;
    }
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };
      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanError
      );
    } catch {
      setError('Camera access denied or unavailable. Check permissions and try again.');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setScanning(false);
    }
  };

  const onScanSuccess = (decodedText: string) => {
    const match = decodedText.match(/\/table\/([a-z0-9]+)$/i);
    if (match) {
      const tableId = match[1];
      stopCamera().then(() => navigate(`/table/${tableId}`));
    } else {
      setError('Invalid QR code. Please scan a valid Drift table QR code.');
      setTimeout(() => setError(null), 2500);
    }
  };

  const onScanError = () => {
    /* Ignore repeated scan errors; onScanSuccess handles valid codes */
  };

  // Fetch test tables when user opens test options
  useEffect(() => {
    if (!showTestOptions || !API_URL) return;
    setTestTablesLoading(true);
    setTestTables([]);
    fetch(`${API_URL}/api/test-tables`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: TestTable[]) => setTestTables(Array.isArray(list) ? list : []))
      .catch(() => setTestTables([]))
      .finally(() => setTestTablesLoading(false));
  }, [showTestOptions]);

  const useTestTable = (tableId: string) => {
    navigate(`/table/${tableId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] pb-24 safe-bottom">
      <div className="container max-w-md mx-auto px-5 py-8">
        {/* Header — same “drift” treatment as Pay / Money / Me */}
        <header className="text-center mb-10 animate-fade-in">
          <p className="text-[11px] uppercase tracking-widest text-[var(--drift-ink-subtle)] font-semibold">drift</p>
          <h1 className="text-4xl font-bold tracking-tight mt-1 text-[var(--drift-ink)]">Dine</h1>
          <p className="text-[var(--drift-ink-muted)] text-[15px] mt-2 max-w-xs mx-auto">
            Scan the QR code at your table to order and pay
          </p>
        </header>

        {!scanning ? (
          <>
            <Card
              padding="xl"
              className="mb-6 animate-slide-up shadow-[var(--drift-shadow)] hover:shadow-[var(--drift-shadow-lg)] transition-shadow duration-[var(--drift-duration)]"
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-[var(--drift-accent-muted)] rounded-[var(--drift-radius-2xl)] flex items-center justify-center border border-[var(--drift-accent)]/10">
                    <QrCode className="w-16 h-16 text-[var(--drift-accent)]" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-[var(--drift-accent)] rounded-full flex items-center justify-center shadow-[var(--drift-shadow)] text-white">
                    <Camera className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-[var(--drift-ink)] text-center mb-2">
                  Ready to order?
                </h2>
                <p className="text-[var(--drift-ink-muted)] text-[15px] text-center mb-8 max-w-xs">
                  Open your camera and scan the QR code on your table to browse the menu and pay.
                </p>
                <Button
                  onClick={startCamera}
                  fullWidth
                  icon={<Camera className="w-5 h-5" />}
                  className="py-4 text-[16px]"
                >
                  Open camera
                </Button>
                {SHOW_TEST_MODE && (
                  <button
                    onClick={() => setShowTestOptions(!showTestOptions)}
                    className="mt-4 text-xs text-[var(--drift-ink-subtle)] hover:text-[var(--drift-ink-muted)] transition-colors"
                  >
                    {showTestOptions ? 'Hide test options' : 'Test mode'}
                  </button>
                )}
              </div>
            </Card>

            {SHOW_TEST_MODE && showTestOptions && (
              <Card padding="md" className="mb-6 animate-slide-up">
                <h3 className="font-medium text-[var(--drift-ink)] mb-3">Test tables</h3>
                {testTablesLoading ? (
                  <p className="text-sm text-[var(--drift-ink-muted)] py-4 text-center">Loading tables…</p>
                ) : testTables.length === 0 ? (
                  <p className="text-sm text-[var(--drift-ink-muted)] py-4 text-center">
                    No tables available. Start the API and add a restaurant with tables to test.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {testTables.slice(0, 9).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => useTestTable(t.id)}
                          className="py-4 bg-[var(--drift-surface-overlay)] rounded-[var(--drift-radius-xl)] hover:bg-[var(--drift-accent-muted)] hover:border-[var(--drift-accent)]/30 border border-transparent transition-all flex flex-col items-center"
                        >
                          <span className="text-xl font-medium text-[var(--drift-ink)]">{t.number}</span>
                          <span className="text-xs text-[var(--drift-ink-muted)]">Table {t.number}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--drift-ink-muted)] text-center mt-3">
                      Use for testing without QR codes
                    </p>
                  </>
                )}
              </Card>
            )}

            <p className="text-center text-sm text-[var(--drift-ink-subtle)] animate-fade-in">
              Order, tip, and pay — all in one place
            </p>
            <button
              type="button"
              onClick={() => openAddCard()}
              className="mt-6 w-full py-3 text-[15px] font-medium text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] transition-colors"
            >
              Add card for faster checkout
            </button>
          </>
        ) : (
          <div className="relative rounded-[var(--drift-radius-xl)] overflow-hidden mb-6 animate-slide-up shadow-[var(--drift-shadow-lg)]">
            <div id={scannerId} className="w-full aspect-[4/5] max-h-[520px] bg-[var(--drift-ink)]" />
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/60 rounded-2xl" />
            </div>
            <p className="absolute top-5 left-0 right-0 text-center text-white/90 text-sm font-medium px-4">
              Align QR code within the frame
            </p>
            {error && (
              <div className="absolute top-20 left-4 right-4 bg-[var(--drift-error-text)] text-white p-4 rounded-xl text-sm text-center shadow-lg">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={stopCamera}
              className="absolute bottom-5 right-5 bg-white/15 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/25 transition-colors z-10 border border-white/20"
              aria-label="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}