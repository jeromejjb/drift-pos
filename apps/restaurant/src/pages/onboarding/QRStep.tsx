import { useState, useEffect } from 'react';
import { QrCode, Download, Printer, CheckCircle, Loader2, Sparkles, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function QRStep({ restaurantId, data, updateData, onNext, onPrev }: QRStepProps) {
  const [generating, setGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<any[]>(data.qrCodes || []);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';

  const generateQRCodes = async () => {
    setGenerating(true);
    setError('');
    setProgress(0);
    
    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables/generate-qrs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR codes');
      }

      const data = await response.json();
      console.log('QR codes generated:', data.tables.length);
      
      // Complete progress
      setProgress(100);
      setTimeout(() => {
        setQrCodes(data.tables);
        updateData({ qrCodes: data.tables });
        setGenerating(false);
      }, 500);
      
    } catch (error) {
      console.error('Error generating QR codes:', error);
      setError('Failed to generate QR codes. Please try again.');
      setGenerating(false);
    } finally {
      clearInterval(interval);
    }
  };

  const downloadQR = (qrCode: string, tableNumber: number) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `drift-table-${tableNumber}.png`;
    link.click();
  };

  const printAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const restaurantName = localStorage.getItem('drift-restaurant-name') || 'Your Restaurant';
    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <html>
        <head>
          <title>Drift - Table QR Codes</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
              background: #f8fafc;
              padding: 40px 20px;
              color: #0f172a;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .header h1 {
              font-size: 32px;
              font-weight: 300;
              letter-spacing: -0.02em;
              margin-bottom: 8px;
              color: #0f172a;
            }
            
            .header h1 span {
              font-style: italic;
              font-weight: 400;
            }
            
            .header p {
              color: #64748b;
              font-size: 16px;
              font-weight: 300;
            }
            
            .restaurant-name {
              font-size: 20px;
              font-weight: 500;
              margin-top: 12px;
              color: #0f172a;
            }
            
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
              max-width: 1000px;
              margin: 0 auto;
            }
            
            .card {
              background: white;
              border-radius: 20px;
              padding: 30px 20px;
              text-align: center;
              box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
              page-break-inside: avoid;
            }
            
            .card h3 {
              font-size: 24px;
              font-weight: 400;
              margin-bottom: 20px;
              color: #0f172a;
            }
            
            .qr-container {
              background: #ffffff;
              padding: 20px;
              border-radius: 16px;
              display: inline-block;
              margin-bottom: 20px;
            }
            
            img {
              width: 200px;
              height: 200px;
              display: block;
              margin: 0 auto;
            }
            
            .instruction {
              color: #475569;
              font-size: 14px;
              margin-top: 12px;
              font-weight: 400;
            }
            
            .footer {
              margin-top: 60px;
              padding-top: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              color: #94a3b8;
              font-size: 12px;
            }
            
            .footer-logo {
              font-size: 18px;
              font-weight: 300;
              letter-spacing: -0.02em;
              margin-bottom: 8px;
            }
            
            .footer-logo span {
              font-style: italic;
              font-weight: 400;
            }
            
            .security-badge {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
              margin-top: 12px;
              font-size: 11px;
              color: #94a3b8;
            }
            
            .badge {
              display: flex;
              align-items: center;
              gap: 4px;
            }
            
            @media print {
              body {
                background: white;
                padding: 20px;
              }
              .card {
                box-shadow: none;
                border: 1px solid #e2e8f0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>drift <span>· table codes</span></h1>
            <p>Scan to view menu & order</p>
            <div class="restaurant-name">${restaurantName}</div>
          </div>
          
          <div class="grid">
            ${qrCodes.map(qr => `
              <div class="card">
                <h3>Table ${qr.tableNumber}</h3>
                <div class="qr-container">
                  <img src="${qr.qrCode}" alt="QR Code for Table ${qr.tableNumber}" />
                </div>
                <p class="instruction">Scan with phone camera to order</p>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <div class="footer-logo">drift <span>· technologies</span></div>
            <p>Generated on ${currentDate} · All rights reserved</p>
            <div class="security-badge">
              <span class="badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> SOC 2</span>
              <span class="badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> PCI DSS</span>
              <span class="badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> GDPR</span>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">QR Codes</h2>
        <p className="text-gray-400">Generate QR codes for each table</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
        >
          {error}
        </motion.div>
      )}

      {generating ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 border border-gray-200 text-center"
        >
          <div className="relative mb-8">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
            
            {/* Spinner with progress */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <motion.div 
                className="absolute inset-0 border-4 border-black rounded-full border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-light">{progress}%</span>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-light mb-3">Generating your QR codes</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Creating unique QR codes for each table. This will only take a moment.
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-black to-gray-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Fun facts */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-sm text-gray-400"
          >
            <Sparkles className="w-4 h-4 inline-block mr-2 text-yellow-500" />
            {progress < 30 && "Preparing table data..."}
            {progress >= 30 && progress < 60 && "Generating QR patterns..."}
            {progress >= 60 && progress < 90 && "Optimizing for printing..."}
            {progress >= 90 && "Almost done! Finalizing..."}
          </motion.div>
        </motion.div>
      ) : qrCodes.length > 0 ? (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4"
          >
            {qrCodes.map((qr, index) => (
              <motion.div
                key={qr.tableId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-lg transition-all group"
              >
                <div className="text-sm text-gray-400 mb-2">Table {qr.tableNumber}</div>
                <div className="relative mb-3">
                  <img src={qr.qrCode} alt={`Table ${qr.tableNumber} QR`} className="w-32 h-32 mx-auto group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors"></div>
                </div>
                <button
                  onClick={() => downloadQR(qr.qrCode, qr.tableNumber)}
                  className="text-sm text-black hover:text-gray-600 flex items-center justify-center gap-1 w-full py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </motion.div>
            ))}
          </motion.div>

          <div className="flex gap-4">
            <button
              onClick={printAll}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:border-black transition-all flex items-center justify-center gap-2 group"
            >
              <Printer className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
              <span className="text-gray-600 group-hover:text-black transition-colors">Print All</span>
            </button>
            <button
              onClick={generateQRCodes}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:border-black transition-all flex items-center justify-center gap-2 group"
            >
              <QrCode className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
              <span className="text-gray-600 group-hover:text-black transition-colors">Regenerate</span>
            </button>
          </div>

          {/* Drift branding note */}
          <div className="text-center text-xs text-gray-300 pt-4">
            <span className="inline-flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              Generated with Drift Technologies
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            </span>
          </div>
        </>
      ) : (
        <button
          onClick={generateQRCodes}
          className="w-full py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-black transition-all flex flex-col items-center gap-4 group"
        >
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-black transition-colors">
            <QrCode className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <span className="text-gray-600 group-hover:text-black transition-colors">Generate QR codes for your tables</span>
          <span className="text-xs text-gray-400">Creates unique codes for each table</span>
        </button>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={qrCodes.length === 0}
          className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
        >
          <span>Complete Setup</span>
          <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}