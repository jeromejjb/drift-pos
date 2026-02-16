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
  Sparkles,
  ExternalLink
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
  const restaurantName = localStorage.getItem('drift-restaurant-name') || 'Your Business';

  const styles = [
    { id: 'classic', icon: Square, label: 'Classic', desc: 'traditional border' },
    { id: 'minimal', icon: Minus, label: 'Minimal', desc: 'clean edge' },
    { id: 'prestige', icon: Sparkles, label: 'Prestige', desc: 'signature series' }
  ];

  const densities = [
    { id: 'standard', label: 'Standard', perSheet: 6, size: 'business card' },
    { id: 'compact', label: 'Compact', perSheet: 9, size: 'credit card' },
    { id: 'professional', label: 'Professional', perSheet: 12, size: 'premium' }
  ];

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

  const downloadKit = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Professional grid layout
    let cols, rows, cardWidth, cardHeight;
    const density = densities.find(d => d.id === selectedDensity);
    
    if (density?.perSheet === 6) {
      cols = 2; rows = 3;
      cardWidth = 85; cardHeight = 60;
    } else if (density?.perSheet === 9) {
      cols = 3; rows = 3;
      cardWidth = 60; cardHeight = 55;
    } else {
      cols = 3; rows = 4;
      cardWidth = 60; cardHeight = 48;
    }

    const margin = 15;
    const startX = (pageWidth - (cols * cardWidth)) / 2;
    const startY = 25;

    // Cover page - elegant
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Drift logo in cool font (using Helvetica with styling to mimic a more elegant font)
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(52);
    pdf.setTextColor(0, 0, 0);
    pdf.text('drift', pageWidth / 2, 80, { align: 'center' });
    
    pdf.setFont('helvetica', 'lightitalic');
    pdf.setFontSize(14);
    pdf.setTextColor(120, 120, 120);
    pdf.text('qr code portfolio', pageWidth / 2, 105, { align: 'center' });

    // Restaurant name
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(22);
    pdf.setTextColor(30, 30, 30);
    pdf.text(restaurantName, pageWidth / 2, 150, { align: 'center' });

    // Specs
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text(`${qrCodes.length} tables · ${density?.perSheet} per sheet · ${selectedStyle} series`, pageWidth / 2, 175, { align: 'center' });

    // Great Lakes branding - exactly like landing page
    const greatLakesX = pageWidth / 2 - 30;
    const greatLakesY = pageHeight - 45;
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text('made with', greatLakesX, greatLakesY);
    pdf.text('♡', greatLakesX + 22, greatLakesY);
    pdf.text('on the', greatLakesX + 32, greatLakesY);
    
    // Add a simple line as placeholder for Great Lakes image (in PDF)
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(greatLakesX + 52, greatLakesY - 2, greatLakesX + 72, greatLakesY - 2);
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.text('great lakes', greatLakesX + 52, greatLakesY - 5);

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.setTextColor(170, 170, 170);
    pdf.text('drift technologies inc. · all rights reserved', pageWidth / 2, pageHeight - 20, { align: 'center' });

    // QR Code pages
    for (let i = 0; i < qrCodes.length; i++) {
      if (i > 0 && i % density!.perSheet === 0) {
        pdf.addPage();
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      const posOnPage = i % density!.perSheet;
      const row = Math.floor(posOnPage / cols);
      const col = posOnPage % cols;

      const x = startX + col * cardWidth;
      const y = startY + row * (cardHeight + 2);

      // Style-specific card design
      if (selectedStyle === 'classic') {
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 2, 2, 'S');
      } else if (selectedStyle === 'minimal') {
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.1);
        pdf.line(x, y + cardHeight - 3, x + cardWidth - 2, y + cardHeight - 3);
      } else {
        // Prestige - subtle embossed effect
        pdf.setDrawColor(240, 240, 240);
        pdf.setLineWidth(0.1);
        for (let e = 0; e < 2; e++) {
          pdf.roundedRect(x - e, y - e, cardWidth - 2 + e*2, cardHeight - 2 + e*2, 1, 1, 'S');
        }
      }

      // QR Code
      const qrImage = qrCodes[i].qrCode.split(',')[1];
      const qrSize = Math.min(cardWidth - 20, cardHeight - 30);
      pdf.addImage(
        qrImage, 
        'PNG', 
        x + (cardWidth - qrSize) / 2, 
        y + 8, 
        qrSize, 
        qrSize
      );

      // Table number - elegant
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`${qrCodes[i].tableNumber.toString().padStart(2, '0')}`, x + cardWidth - 18, y + cardHeight - 10);

      // Drift logo on each card (cool font styling)
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(6);
      pdf.setTextColor(160, 160, 160);
      pdf.text('drift', x + 8, y + cardHeight - 10);

      // Made with love on the Great Lakes on each card
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(4);
      pdf.setTextColor(180, 180, 180);
      
      const loveX = x + 8;
      const loveY = y + cardHeight - 5;
      pdf.text('made with', loveX, loveY);
      pdf.text('♡', loveX + 15, loveY);
      pdf.text('on great lakes', loveX + 22, loveY);
    }

    // Back cover with instructions
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(16);
    pdf.setTextColor(30, 30, 30);
    pdf.text('professional use', pageWidth / 2, 100, { align: 'center' });

    const instructions = [
      'print on 80lb card stock for best results',
      'cut with precision along guidelines',
      'place on tables or counters',
      'customers scan with any smartphone camera',
      '',
      'for replacement codes · visit dashboard'
    ];

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    
    instructions.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, 150 + index * 8, { align: 'center' });
    });

    // Security badges
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text('SOC 2 · PCI DSS · GDPR', pageWidth / 2, pageHeight - 50, { align: 'center' });

    // Great Lakes branding on back cover
    const backLoveX = pageWidth / 2 - 30;
    const backLoveY = pageHeight - 30;
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text('made with', backLoveX, backLoveY);
    pdf.text('♡', backLoveX + 22, backLoveY);
    pdf.text('on the', backLoveX + 32, backLoveY);
    
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(backLoveX + 52, backLoveY - 2, backLoveX + 72, backLoveY - 2);
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.text('great lakes', backLoveX + 52, backLoveY - 5);

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.setTextColor(170, 170, 170);
    pdf.text('drift technologies inc. · est. 2024', pageWidth / 2, pageHeight - 15, { align: 'center' });

    pdf.save(`${restaurantName.toLowerCase().replace(/\s+/g, '-')}-prestige-qr-kit.pdf`);
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header with cool font styling */}
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
          <p className="text-sm text-gray-400">{progress}% · crafting your prestige kit</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* Style selection - elegant */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {styles.map((style) => {
              const Icon = style.icon;
              const isActive = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id as any)}
                  className={`p-5 rounded-xl border transition-all ${
                    isActive 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <p className="text-sm font-light text-center">{style.label}</p>
                  <p className="text-xs text-gray-400 text-center mt-1">{style.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Density selection - professional */}
          <div className="flex justify-center gap-3 mb-8">
            {densities.map((density) => (
              <button
                key={density.id}
                onClick={() => setSelectedDensity(density.id as any)}
                className={`px-5 py-3 rounded-xl text-sm transition-all ${
                  selectedDensity === density.id
                    ? 'bg-black text-white shadow-md'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="font-light">{density.label}</span>
                <span className="text-xs ml-2 opacity-70">{density.perSheet}</span>
              </button>
            ))}
          </div>

          {/* Preview - elegant */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">preview · {selectedStyle} series</span>
              <span className="text-xs text-gray-400">{qrCodes.length} codes</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {qrCodes.slice(0, 4).map((qr, i) => (
                <motion.div
                  key={qr.tableId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm"
                >
                  <img src={qr.qrCode} className="w-full aspect-square mb-2" />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">#{qr.tableNumber}</span>
                    <span className="text-gray-300">drift</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Download button - prominent */}
          <button
            onClick={downloadKit}
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-5 rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all flex items-center justify-center gap-3 mb-8 shadow-md"
          >
            <FileDown className="w-5 h-5" />
            <span className="text-base font-light">download prestige pdf kit</span>
          </button>

          {/* Great Lakes branding - exactly like landing page */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-sm text-gray-400">made with</span>
            <span className="text-gray-400 text-lg">♡</span>
            <span className="text-sm text-gray-400">on the</span>
            <img 
              src="/greatlakes.png" 
              alt="Great Lakes" 
              className="h-6 w-auto inline-block opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Footer with company info */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-300">drift technologies inc. · est. 2024</p>
            <p className="text-[10px] text-gray-200 mt-1">SOC 2 · PCI DSS · GDPR certified</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-100">
            <button onClick={onPrev} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← back
            </button>
            <button
              onClick={onNext}
              className="text-sm bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
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
          <span className="text-sm text-gray-400">generate prestige qr codes</span>
        </button>
      )}
    </div>
  );
}