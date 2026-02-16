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
    pdf.setFontSize(28);
    pdf.setTextColor(0, 0, 0);
    pdf.text('YOUR QR CODES', pageWidth / 2, 35, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 80);
    pdf.text(restaurantName, pageWidth / 2, 55, { align: 'center' });

    // Simple steps
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('How to use:', 30, 90);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    
    pdf.text('1. Print this page on card stock', 30, 110);
    pdf.text('2. Cut out each QR code', 30, 125);
    pdf.text('3. Place on your tables', 30, 140);
    pdf.text('4. Customers scan to view menu & order', 30, 155);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('What you get:', 30, 185);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`• ${qrCodes.length} unique QR codes (one per table)`, 30, 205);
    pdf.text(`• ${perPage} codes per sheet · ${Math.ceil(qrCodes.length / perPage)} pages total`, 30, 220);
    pdf.text('• Each code links directly to your menu', 30, 235);

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
      pdf.text(`Table ${qrCodes[i].tableNumber}`, x + 8, y + 15);

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
    pdf.text('PRO TIPS', pageWidth / 2, 40, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    pdf.text('• Use 80-100lb card stock for durability', 30, 70);
    pdf.text('• Cut with scissors or a paper cutter', 30, 85);
    pdf.text('• Laminate to make them last longer', 30, 100);
    pdf.text('• Place at eye level for easy scanning', 30, 115);
    pdf.text('• Test each code with your phone first', 30, 130);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Need help?', 30, 165);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Visit dashboard.drift.com/support', 30, 185);
    pdf.text('or email help@drift.com', 30, 200);

    // Great Lakes
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text('made with love on the great lakes', pageWidth / 2, pageHeight - 25, { align: 'center' });
    pdf.text('drift technologies', pageWidth / 2, pageHeight - 12, { align: 'center' });

    pdf.save(`${restaurantName}-qr-codes.pdf`);
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Step indicator */}
      <div className="text-center mb-2">
        <span className="text-xs text-gray-300 bg-gray-100 px-3 py-1 rounded-full">
          Step 6 of 7 · QR Codes
        </span>
      </div>

      {/* Header with explanation */}
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-light text-gray-900 mb-1">Table QR codes</h1>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Each table gets its own unique QR code. Print, cut, and place them around your venue.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {generating ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-2 border-black rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm text-gray-600 mb-1">Generating your QR codes...</p>
          <p className="text-xs text-gray-400">{progress}% · This takes just a moment</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* What's happening */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              <span className="font-medium">✨ {qrCodes.length} unique codes ready</span> — one for each table. Choose your preferred size below.
            </p>
          </div>

          {/* Size selector with clear labels */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">CARD SIZE:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '6', label: 'Large', desc: '6 per sheet', best: 'easy to read' },
                { id: '9', label: 'Medium', desc: '9 per sheet', best: 'balanced', default: true },
                { id: '12', label: 'Small', desc: '12 per sheet', best: 'fits more' }
              ].map((size) => (
                <button
                  key={size.id}
                  onClick={() => setCardsPerSheet(size.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    cardsPerSheet === size.id 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-base font-medium">{size.label}</p>
                  <p className="text-[10px] text-gray-400">{size.desc}</p>
                  <p className="text-[8px] text-gray-300 mt-1">{size.best}</p>
                  {size.default && cardsPerSheet === size.id && (
                    <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded-full mt-1 inline-block">
                      recommended
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview with count */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500">PREVIEW</span>
              <span className="text-xs text-gray-400">{qrCodes.length} codes · {Math.ceil(qrCodes.length / parseInt(cardsPerSheet))} pages</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {qrCodes.slice(0, 4).map((qr) => (
                <div key={qr.tableId} className="bg-white p-2 rounded border border-gray-200">
                  <img src={qr.qrCode} className="w-full aspect-square" />
                  <p className="text-[8px] text-gray-400 text-center mt-1">Table {qr.tableNumber}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Download button with clear action */}
          <button
            onClick={downloadPDF}
            className="w-full bg-black text-white py-4 rounded-lg text-sm font-medium mb-4 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF Kit
          </button>

          {/* What's next */}
          <div className="text-center mb-4">
            <p className="text-[10px] text-gray-300">
              The PDF includes instructions, all {qrCodes.length} QR codes, and pro tips.
            </p>
          </div>

          {/* Great Lakes */}
          <div className="flex justify-center items-center gap-2 text-[10px] text-gray-300 mb-4">
            <span>made with</span>
            <Heart className="w-3 h-3" />
            <span>on the great lakes</span>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button onClick={onPrev} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back
            </button>
            <button 
              onClick={onNext} 
              className="text-xs bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Continue to next step
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={generateQRCodes}
          className="w-full py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-black transition-all text-center"
        >
          <QrCode className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">Generate QR codes</p>
          <p className="text-xs text-gray-400">Create unique codes for each table</p>
        </button>
      )}
    </div>
  );
}