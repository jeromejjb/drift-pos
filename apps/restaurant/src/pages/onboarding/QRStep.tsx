import { useState, useEffect } from 'react';
import { QrCode, Download, Heart, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

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
  const [cardsPerSheet, setCardsPerSheet] = useState<'6' | '9' | '12'>('9');

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';
  const restaurantName = data?.restaurantInfo?.name || localStorage.getItem('drift-restaurant-name') || 'Your Business';

  const generateQRCodes = async () => {
    setGenerating(true);
    setError('');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 95));
    }, 100);
    
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables/generate-qrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to generate QR codes');

      const data = await response.json();
      
      setProgress(100);
      setTimeout(() => {
        setQrCodes(data.tables);
        updateData({ qrCodes: data.tables });
        setGenerating(false);
      }, 300);
      
    } catch (error) {
      setError('Failed to generate QR codes. Please try again.');
      setGenerating(false);
    } finally {
      clearInterval(interval);
    }
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Layout based on cards per sheet
    let cols, rows, cardW, cardH, qrSize;
    const perPage = parseInt(cardsPerSheet);
    
    if (perPage === 6) {
      cols = 2; rows = 3;
      cardW = 85; cardH = 60;
      qrSize = 45; // Bigger QR codes
    } else if (perPage === 9) {
      cols = 3; rows = 3;
      cardW = 60; cardH = 55;
      qrSize = 38; // Bigger QR codes
    } else {
      cols = 3; rows = 4;
      cardW = 60; cardH = 48;
      qrSize = 32; // Bigger QR codes
    }

    const startX = (pageWidth - (cols * cardW)) / 2;
    const startY = 20;
    const gap = 5;

    // ===== PAGE 1: INSTRUCTIONS =====
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Drift in cool font
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(42);
    pdf.setTextColor(0, 0, 0);
    pdf.text('drift', pageWidth / 2, 35, { align: 'center' });

    pdf.setFont('helvetica', 'lightitalic');
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.text(restaurantName, pageWidth / 2, 55, { align: 'center' });

    // Simple steps
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('How to use:', 30, 90);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    pdf.text('1. Print on card stock', 30, 110);
    pdf.text('2. Cut out each QR code', 30, 125);
    pdf.text('3. Place on tables', 30, 140);
    pdf.text('4. Customers scan to order', 30, 155);

    // What you get
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('What you get:', 30, 185);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`• ${qrCodes.length} unique QR codes`, 30, 205);
    pdf.text(`• ${perPage} per sheet · ${Math.ceil(qrCodes.length / perPage)} pages`, 30, 220);

    // Great Lakes branding with image
    try {
      // This is a simplified version - in a real PDF you'd need to embed the image
      pdf.setFont('helvetica', 'lightitalic');
      pdf.setFontSize(10);
      pdf.setTextColor(140, 140, 140);
      pdf.text('Made with ♡ on the', pageWidth / 2 - 30, pageHeight - 25, { align: 'center' });
      pdf.text('Great Lakes', pageWidth / 2 + 15, pageHeight - 25, { align: 'center' });
    } catch (err) {
      // Fallback text
      pdf.setFont('helvetica', 'lightitalic');
      pdf.setFontSize(10);
      pdf.setTextColor(140, 140, 140);
      pdf.text('Made with love on the Great Lakes', pageWidth / 2, pageHeight - 25, { align: 'center' });
    }

    // ===== QR CODE PAGES =====
    for (let i = 0; i < qrCodes.length; i++) {
      if (i % perPage === 0) {
        if (i > 0) pdf.addPage();
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      const pos = i % perPage;
      const row = Math.floor(pos / cols);
      const col = pos % cols;
      const x = startX + col * cardW;
      const y = startY + row * (cardH + gap);

      // Light border
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.2);
      pdf.rect(x, y, cardW - 1, cardH - 1);

      // QR Code - centered with more space
      try {
        const qrImage = qrCodes[i].qrCode.split(',')[1];
        pdf.addImage(
          qrImage, 
          'PNG', 
          x + (cardW - qrSize) / 2, 
          y + 10, 
          qrSize, 
          qrSize
        );
      } catch (err) {
        console.error('QR error:', err);
      }

      // Table number - top right (small and out of the way)
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`#${qrCodes[i].tableNumber}`, x + cardW - 15, y + 12);

      // Drift Technologies - bottom left (cool font)
      pdf.setFont('helvetica', 'lightitalic');
      pdf.setFontSize(6);
      pdf.setTextColor(160, 160, 160);
      pdf.text('Drift Technologies', x + 8, y + cardH - 14);

      // Made with love + Great Lakes image representation
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(4);
      pdf.setTextColor(170, 170, 170);
      pdf.text('made with ♡ on the', x + 8, y + cardH - 8);
      pdf.text('Great Lakes', x + 25, y + cardH - 8);
    }

    // ===== LAST PAGE: TIPS =====
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Drift in cool font
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(36);
    pdf.setTextColor(0, 0, 0);
    pdf.text('drift', pageWidth / 2, 40, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(30, 30, 30);
    pdf.text('pro tips', pageWidth / 2, 70, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    
    const tips = [
      '• Use 80-100lb card stock for durability',
      '• Cut carefully along the borders',
      '• Laminate to make them last longer',
      '• Place at eye level for easy scanning',
      '• Test each code with your phone first'
    ];

    tips.forEach((tip, index) => {
      pdf.text(tip, 30, 100 + index * 12);
    });

    // Need help section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Need help?', 30, 180);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    pdf.text('dashboard.drift.com/support', 30, 200);
    pdf.text('help@drift.com', 30, 215);

    // Great Lakes branding on last page
    try {
      pdf.setFont('helvetica', 'lightitalic');
      pdf.setFontSize(10);
      pdf.setTextColor(140, 140, 140);
      pdf.text('Made with ♡ on the', pageWidth / 2 - 30, pageHeight - 25, { align: 'center' });
      pdf.text('Great Lakes', pageWidth / 2 + 15, pageHeight - 25, { align: 'center' });
    } catch (err) {
      pdf.setFont('helvetica', 'lightitalic');
      pdf.setFontSize(10);
      pdf.setTextColor(140, 140, 140);
      pdf.text('Made with love on the Great Lakes', pageWidth / 2, pageHeight - 25, { align: 'center' });
    }

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('drift technologies inc.', pageWidth / 2, pageHeight - 12, { align: 'center' });

    pdf.save(`${restaurantName}-qr-codes.pdf`);
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Step indicator */}
      <div className="text-center mb-6">
        <span className="text-sm text-gray-400 bg-gray-100 px-4 py-2 rounded-full">
          Step 5 of 7 · QR Codes
        </span>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-light text-gray-900 mb-3">Table QR codes</h1>
        <p className="text-base text-gray-500 max-w-md mx-auto">
          Each table gets its own unique QR code. Print, cut, and place them around your venue.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {generating ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-3 border-gray-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-3 border-black rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-lg text-gray-700 mb-2">Generating your QR codes...</p>
          <p className="text-sm text-gray-400">{progress}% · This takes just a moment</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* Status message */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-base text-blue-800">
              <span className="font-semibold">✨ {qrCodes.length} unique codes ready</span> — one for each table.
            </p>
          </div>

          {/* Size selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">CARD SIZE:</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: '6', label: 'Large', desc: '6 per sheet' },
                { id: '9', label: 'Medium', desc: '9 per sheet', default: true },
                { id: '12', label: 'Small', desc: '12 per sheet' }
              ].map((size) => (
                <button
                  key={size.id}
                  onClick={() => setCardsPerSheet(size.id as any)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    cardsPerSheet === size.id 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-xl font-medium mb-1">{size.label}</p>
                  <p className="text-sm text-gray-500">{size.desc}</p>
                  {size.default && (
                    <span className="inline-block mt-3 text-xs bg-black text-white px-3 py-1 rounded-full">
                      recommended
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-700">PREVIEW</span>
              <span className="text-sm text-gray-500">
                {qrCodes.length} codes · {Math.ceil(qrCodes.length / parseInt(cardsPerSheet))} pages
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {qrCodes.slice(0, 4).map((qr) => (
                <div key={qr.tableId} className="bg-white p-3 rounded-lg border border-gray-200">
                  <img src={qr.qrCode} className="w-full aspect-square mb-2" />
                  <p className="text-xs text-gray-500 text-center">Table {qr.tableNumber}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={downloadPDF}
            className="w-full bg-black text-white py-5 rounded-xl text-lg font-medium mb-6 hover:bg-gray-800 transition-colors flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            Download PDF Kit
          </button>

          {/* Great Lakes branding - matching footer exactly */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-gray-400">Made with</span>
            <span className="text-gray-400 text-lg">♡</span>
            <span className="text-sm text-gray-400">on the</span>
            <img 
              src="/greatlakes.png" 
              alt="Great Lakes" 
              className="h-8 w-auto inline-block opacity-80"
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button 
              onClick={onPrev} 
              className="text-base text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              ← Back
            </button>
            <button 
              onClick={onNext} 
              className="text-base bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              Continue
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={generateQRCodes}
          className="w-full py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-black transition-all text-center"
        >
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg text-gray-700 mb-1">Generate QR codes</p>
          <p className="text-sm text-gray-500">Create unique codes for each table</p>
        </button>
      )}
    </div>
  );
}