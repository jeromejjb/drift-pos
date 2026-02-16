import { useState, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  CheckCircle, 
  Heart,
  Grid,
  Square,
  Minus,
  FileDown,
  LayoutGrid,
  Sparkles
} from 'lucide-react';
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
  const [selectedStyle, setSelectedStyle] = useState<'classic' | 'minimal' | 'prestige'>('prestige');
  const [selectedDensity, setSelectedDensity] = useState<'standard' | 'compact' | 'professional'>('professional');

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';
  
  // Get restaurant name
  const restaurantName = 
    data?.restaurantInfo?.name || 
    localStorage.getItem('drift-restaurant-name') || 
    'Your Business';

  const generateQRCodes = async () => {
    setGenerating(true);
    setError('');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 80);
    
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
      
      setProgress(100);
      setTimeout(() => {
        setQrCodes(data.tables);
        updateData({ qrCodes: data.tables });
        setGenerating(false);
      }, 400);
      
    } catch (error) {
      console.error('Error generating QR codes:', error);
      setError('Failed to generate QR codes. Please try again.');
      setGenerating(false);
    } finally {
      clearInterval(interval);
    }
  };

  const downloadKit = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate layout based on density
    let cols, rows, cardWidth, cardHeight;
    const itemsPerPage = selectedDensity === 'standard' ? 6 : selectedDensity === 'compact' ? 9 : 12;
    
    if (itemsPerPage === 6) {
      cols = 2; rows = 3;
      cardWidth = 85; cardHeight = 60;
    } else if (itemsPerPage === 9) {
      cols = 3; rows = 3;
      cardWidth = 60; cardHeight = 55;
    } else {
      cols = 3; rows = 4;
      cardWidth = 60; cardHeight = 48;
    }

    const margin = 15;
    const startX = (pageWidth - (cols * cardWidth)) / 2;
    const startY = 30;

    // ===== COVER PAGE =====
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Drift logo
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(48);
    pdf.setTextColor(0, 0, 0);
    pdf.text('drift', pageWidth / 2, 70, { align: 'center' });
    
    pdf.setFont('helvetica', 'lightitalic');
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('qr code portfolio', pageWidth / 2, 90, { align: 'center' });

    // Restaurant name
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(24);
    pdf.setTextColor(30, 30, 30);
    pdf.text(restaurantName, pageWidth / 2, 140, { align: 'center' });

    // Details
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${qrCodes.length} tables · ${itemsPerPage} per sheet · ${selectedStyle} series`, pageWidth / 2, 170, { align: 'center' });

    // Great Lakes branding
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text('Made with ♡ on the Great Lakes', pageWidth / 2, pageHeight - 30, { align: 'center' });
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text('drift technologies inc. · all rights reserved', pageWidth / 2, pageHeight - 20, { align: 'center' });

    // ===== QR CODE PAGES =====
    for (let i = 0; i < qrCodes.length; i++) {
      // Add new page if needed
      if (i > 0 && i % itemsPerPage === 0) {
        pdf.addPage();
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      const posOnPage = i % itemsPerPage;
      const row = Math.floor(posOnPage / cols);
      const col = posOnPage % cols;

      const x = startX + col * cardWidth;
      const y = startY + row * (cardHeight + 5);

      // Card border based on style
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.2);
      
      if (selectedStyle === 'classic') {
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 2, 2, 'S');
      } else if (selectedStyle === 'minimal') {
        pdf.line(x, y + cardHeight - 3, x + cardWidth - 2, y + cardHeight - 3);
      } else {
        // Prestige - double border
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 2, 2, 'S');
        pdf.setDrawColor(240, 240, 240);
        pdf.roundedRect(x - 0.5, y - 0.5, cardWidth - 1, cardHeight - 1, 2, 2, 'S');
      }

      // QR Code
      try {
        const qrImage = qrCodes[i].qrCode.split(',')[1];
        const qrSize = Math.min(cardWidth - 20, cardHeight - 25);
        
        pdf.addImage(
          qrImage, 
          'PNG', 
          x + (cardWidth - qrSize) / 2, 
          y + 8, 
          qrSize, 
          qrSize,
          undefined,
          'FAST'
        );
      } catch (err) {
        console.error('Error adding QR image:', err);
      }

      // Table number
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${qrCodes[i].tableNumber.toString().padStart(2, '0')}`, x + cardWidth - 18, y + cardHeight - 10);

      // Drift logo
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text('drift', x + 8, y + cardHeight - 10);
    }

    // ===== BACK COVER =====
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(20);
    pdf.setTextColor(30, 30, 30);
    pdf.text('professional use', pageWidth / 2, 100, { align: 'center' });

    const instructions = [
      'print on 80lb card stock',
      'cut along guidelines',
      'place on tables or counters',
      'customers scan with camera',
      '',
      'for replacement codes:',
      'dashboard.drift.com'
    ];

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    
    instructions.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, 150 + index * 10, { align: 'center' });
    });

    // Security badges
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text('SOC 2 · PCI DSS · GDPR', pageWidth / 2, pageHeight - 50, { align: 'center' });

    // Great Lakes branding
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text('Made with ♡ on the Great Lakes', pageWidth / 2, pageHeight - 30, { align: 'center' });
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text('drift technologies inc. · est. 2024', pageWidth / 2, pageHeight - 20, { align: 'center' });

    // Save the PDF
    pdf.save(`${restaurantName.toLowerCase().replace(/\s+/g, '-')}-qr-kit.pdf`);
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-6"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-light italic">d</span>
          </div>
        </motion.div>
        <h1 className="text-4xl font-light text-gray-900 mb-2 tracking-tight">drift</h1>
        <p className="text-sm text-gray-400 tracking-wide">qr code portfolio · {restaurantName}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {generating ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-2 border-black rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm text-gray-400">{progress}% · generating QR codes</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* Style Selection */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { id: 'classic', label: 'Classic', desc: 'traditional border' },
              { id: 'minimal', label: 'Minimal', desc: 'clean edge' },
              { id: 'prestige', label: 'Prestige', desc: 'signature series' }
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id as any)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedStyle === style.id 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <p className="text-sm font-medium text-center">{style.label}</p>
                <p className="text-xs text-gray-400 text-center mt-1">{style.desc}</p>
              </button>
            ))}
          </div>

          {/* Density Selection */}
          <div className="flex justify-center gap-3 mb-8">
            {[
              { id: 'standard', label: 'Standard', count: 6 },
              { id: 'compact', label: 'Compact', count: 9 },
              { id: 'professional', label: 'Professional', count: 12 }
            ].map((density) => (
              <button
                key={density.id}
                onClick={() => setSelectedDensity(density.id as any)}
                className={`px-5 py-3 rounded-xl text-sm transition-all ${
                  selectedDensity === density.id
                    ? 'bg-black text-white shadow-md'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>{density.label}</span>
                <span className="text-xs ml-2 opacity-70">{density.count}</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">preview</span>
              <span className="text-xs text-gray-400">{qrCodes.length} codes</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {qrCodes.slice(0, 4).map((qr, i) => (
                <div key={qr.tableId} className="bg-white rounded-lg p-3 border border-gray-100">
                  <img src={qr.qrCode} className="w-full aspect-square mb-2" />
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">#{qr.tableNumber}</span>
                    <span className="text-gray-300">drift</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadKit}
            className="w-full bg-black text-white py-5 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 mb-8 shadow-md"
          >
            <FileDown className="w-5 h-5" />
            <span className="text-base font-light">download pdf kit</span>
          </button>

          {/* Great Lakes Branding */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-sm text-gray-400">Made with</span>
            <span className="text-gray-400 text-lg">♡</span>
            <span className="text-sm text-gray-400">on the</span>
            <img 
              src="/greatlakes.png" 
              alt="Great Lakes" 
              className="h-8 w-auto inline-block opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Footer */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-300">drift technologies inc. · est. 2024</p>
            <p className="text-[10px] text-gray-200 mt-1">SOC 2 · PCI DSS · GDPR certified</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-100">
            <button onClick={onPrev} className="text-sm text-gray-400 hover:text-gray-600">
              ← back
            </button>
            <button
              onClick={onNext}
              className="text-sm bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              complete setup
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={generateQRCodes}
          className="w-full py-16 bg-gray-50 rounded-xl border border-gray-100 hover:border-black transition-all flex flex-col items-center gap-3"
        >
          <QrCode className="w-8 h-8 text-gray-300" />
          <span className="text-sm text-gray-400">generate qr codes</span>
        </button>
      )}
    </div>
  );
}