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
  console.log('📸 startCamera called');
  setError(null);
  
  // First set scanning to true (this triggers React to render the div)
  setScanning(true);
  
  // Wait for React to render the div
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Now check for the div
  const div = document.getElementById(scannerId);
  if (!div) {
    console.error('❌ Div with id', scannerId, 'not found after delay!');
    setError('Camera failed to initialize. Please try again.');
    setScanning(false);
    return;
  }
  
  console.log('✅ Div found, initializing camera...');
  
  try {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerId);
    }

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    await scannerRef.current.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      onScanError
    );
    console.log('✅ Camera started successfully');
    
  } catch (err: any) {
    console.error('❌ Camera error:', err);
    // ... error handling
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
    console.log('QR Code scanned:', decodedText);
    
    // Extract table ID from URL
    // Expected format: http://localhost:5173/table/cmllhyepc0001zdv63vymrj0k
    const match = decodedText.match(/\/table\/(.+)$/);
    
    if (match) {
      const tableId = match[1];
      
      // Stop camera before navigating
      stopCamera().then(() => {
        navigate(`/table/${tableId}`);
      });
    } else {
      // If the QR code doesn't contain a valid table URL, show error
      setError('Invalid QR code. Please scan a valid Drift table QR code.');
      
      // Restart scanning after 2 seconds
      setTimeout(() => {
        setError(null);
      }, 2000);
    }
  };

  const onScanError = (error: string) => {
    // Only log in development (simplified check)
    if (window.location.hostname === 'localhost') {
      console.warn('Scan error:', error);
    }
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
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] pb-20 safe-bottom">
      <div className="container max-w-md mx-auto px-5 py-8">
        {/* Header — same “drift” treatment as Pay / Money / Me */}
        <div className="text-center mb-10 animate-fade-in">
          <p className="text-[11px] uppercase tracking-widest text-[var(--drift-ink-subtle)] font-medium">drift</p>
          <h1 className="text-4xl font-bold tracking-tight mt-1 text-[var(--drift-ink)]">Dine</h1>
          <p className="text-[var(--drift-ink-muted)] text-[15px] mt-2">Scan to check out with Drift</p>
        </div>

        {!scanning ? (
          <>
            <Card padding="xl" className="mb-6 animate-slide-up">
              <div className="flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="w-28 h-28 bg-[var(--drift-accent-muted)] rounded-[var(--drift-radius-2xl)] flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-[var(--drift-accent)]" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[var(--drift-accent)] rounded-full flex items-center justify-center shadow-[var(--drift-shadow)]">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-[var(--drift-ink)] text-center mb-2">
                  Scan to start
                </h2>
                <p className="text-[var(--drift-ink-muted)] text-[15px] text-center mb-8 max-w-xs">
                  Point your camera at the QR code on your table
                </p>
                <Button
                  onClick={startCamera}
                  fullWidth
                  icon={<Camera className="w-5 h-5" />}
                  className="py-4"
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
              Check out with Drift — same app as Pay & Money
            </p>
            <button
              type="button"
              onClick={openAddCard}
              className="mt-6 w-full py-3 text-[15px] font-medium text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] transition-colors"
            >
              Add card for faster checkout
            </button>
          </>
        ) : (
          <div className="relative rounded-[var(--drift-radius-xl)] overflow-hidden mb-6 animate-slide-up">
            <div id={scannerId} className="w-full h-[500px] bg-[var(--drift-ink)]" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white rounded-[var(--drift-radius-lg)] opacity-50" />
              </div>
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white px-4 py-2 rounded-full text-sm">
                Position QR code in the square
              </div>
            </div>
            {error && (
              <div className="absolute top-20 left-4 right-4 bg-[var(--drift-error-text)] text-white p-4 rounded-[var(--drift-radius-lg)] text-sm text-center">
                {error}
              </div>
            )}
            <button
              onClick={stopCamera}
              className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}