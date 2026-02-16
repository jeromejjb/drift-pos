import { useState, useEffect } from 'react';
import { QrCode, Download, Heart } from 'lucide-react';
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
      qrSize = 40;
    } else if (perPage === 9) {
      cols = 3; rows = 3;
      cardW = 60; cardH = 55;
      qrSize = 32;
    } else {
      cols = 3; rows = 4;
      cardW = 60; cardH = 48;
      qrSize = 28;
    }

    const startX = (pageWidth - (cols * cardW)) / 2;
    const startY = 20;
    const gap = 5;

    // ===== PAGE 1: INSTRUCTIONS =====
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text('HOW TO USE', pageWidth / 2, 40, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(60, 60, 60);
    
    pdf.text('1. PRINT on card stock', pageWidth / 2, 80, { align: 'center' });
    pdf.text('2. CUT out each square', pageWidth / 2, 105, { align: 'center' });
    pdf.text('3. PLACE on tables', pageWidth / 2, 130, { align: 'center' });
    pdf.text('4. CUSTOMERS SCAN to order', pageWidth / 2, 155, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(restaurantName, pageWidth / 2, 200, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${qrCodes.length} tables · ${perPage} per sheet`, pageWidth / 2, 230, { align: 'center' });

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

      // Simple border
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.rect(x, y, cardW - 1, cardH - 1);

      // QR Code
      try {
        const qrImage = qrCodes[i].qrCode.split(',')[1];
        pdf.addImage(
          qrImage, 
          'PNG', 
          x + (cardW - qrSize) / 2, 
          y + 8, 
          qrSize, 
          qrSize
        );
      } catch (err) {
        console.error('QR error:', err);
      }

      // Table number
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`#${qrCodes[i].tableNumber}`, x + cardW - 15, y + 12);

      // Drift
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text('drift', x + 8, y + cardH - 10);
    }

    // ===== LAST PAGE: TIPS =====
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 0);
    pdf.text('TIPS', pageWidth / 2, 50, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    pdf.text('• Use thick paper (card stock works best)', pageWidth / 2, 90, { align: 'center' });
    pdf.text('• Cut carefully along the lines', pageWidth / 2, 115, { align: 'center' });
    pdf.text('• Laminate to make them last longer', pageWidth / 2, 140, { align: 'center' });
    pdf.text('• Test each code before placing', pageWidth / 2, 165, { align: 'center' });

    // Great Lakes
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text('made with love on the great lakes', pageWidth / 2, pageHeight - 30, { align: 'center' });
    pdf.text('drift technologies', pageWidth / 2, pageHeight - 15, { align: 'center' });

    pdf.save(`${restaurantName}-qr-codes.pdf`);
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-2">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-light text-gray-900">qr codes</h1>
        <p className="text-xs text-gray-400 mt-0.5">{restaurantName}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {generating ? (
        <div className="bg-white rounded-lg p-8 text-center border border-gray-100">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-2 border-black rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-xs text-gray-400">{progress}%</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* Size - simple buttons */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { id: '6', label: '6', desc: 'large' },
              { id: '9', label: '9', desc: 'medium' },
              { id: '12', label: '12', desc: 'small' }
            ].map((size) => (
              <button
                key={size.id}
                onClick={() => setCardsPerSheet(size.id as any)}
                className={`py-2.5 rounded-lg border text-center ${
                  cardsPerSheet === size.id ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
              >
                <p className="text-base font-medium">{size.label}</p>
                <p className="text-[10px] text-gray-400">{size.desc}</p>
              </button>
            ))}
          </div>

          {/* Mini preview */}
          <div className="mb-5 p-3 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-400 mb-2">{qrCodes.length} tables</p>
            <div className="grid grid-cols-4 gap-1">
              {qrCodes.slice(0, 4).map((qr) => (
                <div key={qr.tableId} className="bg-white p-1 rounded border border-gray-100">
                  <img src={qr.qrCode} className="w-full aspect-square" />
                </div>
              ))}
            </div>
          </div>

          {/* Big download button */}
          <button
            onClick={downloadPDF}
            className="w-full bg-black text-white py-4 rounded-lg text-sm font-medium mb-5"
          >
            Download PDF
          </button>

          {/* Great Lakes */}
          <div className="flex justify-center items-center gap-2 text-[10px] text-gray-300 mb-5">
            <span>made with</span>
            <Heart className="w-3 h-3" />
            <span>on the great lakes</span>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button onClick={onPrev} className="text-xs text-gray-400">← back</button>
            <button onClick={onNext} className="text-xs bg-black text-white px-4 py-2 rounded">done</button>
          </div>
        </>
      ) : (
        <button
          onClick={generateQRCodes}
          className="w-full py-10 bg-gray-50 rounded-lg border border-gray-200 text-center"
        >
          <QrCode className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">generate qr codes</p>
        </button>
      )}
    </div>
  );
}