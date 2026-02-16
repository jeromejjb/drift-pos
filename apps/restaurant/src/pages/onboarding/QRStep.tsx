import { useState, useEffect } from 'react';
import { QrCode, Download, Printer, CheckCircle } from 'lucide-react';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const APP_URL = import.meta.env.VITE_APP_URL || 'https://drift-restaurant.onrender.com';
  const getToken = () => {
    const token = localStorage.getItem('drift-token');
    if (!token) {
      console.error('No token found');
      window.location.href = `${APP_URL}/login`;
      return null;
    }
    return token;
  };

  const generateQRCodes = async () => {
    setGenerating(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) return;

      console.log('Generating QR codes with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables/generate-qrs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('drift-token');
        window.location.href = `${APP_URL}/login`;
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate QR codes');
      }

      const data = await response.json();
      console.log('QR codes generated:', data.tables.length);
      setQrCodes(data.tables);
      updateData({ qrCodes: data.tables });
    } catch (error) {
      console.error('Error generating QR codes:', error);
      setError('Failed to generate QR codes. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = (qrCode: string, tableNumber: number) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `table-${tableNumber}.png`;
    link.click();
  };

  const printAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Table QR Codes</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; margin: 0; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-weight: 300; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 20px; }
            .card { text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 12px; }
            .card h3 { font-weight: 400; margin-bottom: 10px; }
            img { width: 200px; height: 200px; margin: 10px auto; }
            p { color: #666; font-size: 14px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Your Table QR Codes</h1>
            <p>Place these on each table for customers to scan</p>
          </div>
          <div class="grid">
            ${qrCodes.map(qr => `
              <div class="card">
                <h3>Table ${qr.tableNumber}</h3>
                <img src="${qr.qrCode}" alt="QR Code for Table ${qr.tableNumber}" />
                <p>Scan to view menu and order</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {generating ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Generating QR codes...</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {qrCodes.map((qr) => (
              <div key={qr.tableId} className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-sm text-gray-400 mb-2">Table {qr.tableNumber}</div>
                <img src={qr.qrCode} alt={`Table ${qr.tableNumber} QR`} className="w-32 h-32 mx-auto mb-3" />
                <button
                  onClick={() => downloadQR(qr.qrCode, qr.tableNumber)}
                  className="text-sm text-black hover:text-gray-600 flex items-center justify-center gap-1 w-full"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={printAll}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:border-black transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print All
            </button>
            <button
              onClick={generateQRCodes}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:border-black transition-colors"
            >
              Regenerate
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={generateQRCodes}
          className="w-full py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-black transition-colors flex flex-col items-center gap-4"
        >
          <QrCode className="w-12 h-12 text-gray-400" />
          <span className="text-gray-600">Generate QR codes for your tables</span>
        </button>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={qrCodes.length === 0}
          className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          Complete Setup
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}