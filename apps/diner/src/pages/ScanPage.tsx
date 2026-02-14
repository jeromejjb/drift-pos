import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Html5Qrcode } from 'html5-qrcode';

export function ScanPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTestOptions, setShowTestOptions] = useState(false);
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
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please make sure you have granted camera permissions.');
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

  const useTestTable = (tableNumber: number) => {
    // Map table numbers to actual table IDs
    const tableIds: Record<number, string> = {
      1: 'cmllhyepc0001zdv63vymrj0k',
      2: 'cmllhyepc0002zdv6ef8sxvxi',
      3: 'cmllhyepc0003zdv6rckof8zd'
    };
    
    navigate(`/table/${tableIds[tableNumber]}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-md mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-light tracking-tight mb-3">drift</h1>
          <p className="text-gray-400 text-lg">eat · drink · drift</p>
        </div>

        {!scanning ? (
          /* Initial State - Show Scan Button */
          <>
            <Card padding="xl" className="mb-6 animate-slide-up">
              <div className="flex flex-col items-center">
                {/* Animated QR icon */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center animate-pulse-slow">
                    <QrCode className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-medium text-center mb-3">
                  Scan to start
                </h2>
                <p className="text-gray-400 text-center mb-8 max-w-xs">
                  Point your camera at the QR code on your table
                </p>

                <Button 
                  onClick={startCamera} 
                  fullWidth
                  icon={<Camera className="w-5 h-5" />}
                  className="shadow-lg"
                >
                  Open Camera
                </Button>

                {/* Test Mode Toggle */}
                <button
                  onClick={() => setShowTestOptions(!showTestOptions)}
                  className="mt-4 text-xs text-gray-300 hover:text-gray-400 transition-colors"
                >
                  {showTestOptions ? 'Hide test options' : 'Test mode'}
                </button>
              </div>
            </Card>

            {/* Test Options */}
            {showTestOptions && (
              <Card padding="md" className="mb-6 animate-slide-up">
                <h3 className="font-medium mb-3">Test Tables</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(num => (
                    <button
                      key={num}
                      onClick={() => useTestTable(num)}
                      className="py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex flex-col items-center"
                    >
                      <span className="text-xl font-light">{num}</span>
                      <span className="text-xs text-gray-400">Table {num}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Use this for testing without QR codes
                </p>
              </Card>
            )}

            {/* Trust indicator */}
            <p className="text-center text-sm text-gray-300 animate-fade-in">
              Used by 50+ restaurants in NYC
            </p>
          </>
        ) : (
          /* Scanning State - Show Camera */
          <div className="relative rounded-2xl overflow-hidden mb-6 animate-slide-up">
            {/* QR Scanner Container */}
            <div id={scannerId} className="w-full h-[500px] bg-black" />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white rounded-2xl opacity-50"></div>
              </div>
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white px-4 py-2 rounded-full text-sm">
                Position QR code in the square
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="absolute top-20 left-4 right-4 bg-red-500 text-white p-4 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={stopCamera}
              className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-white p-3 rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}