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
  PanelsTopLeft,
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
  const [selectedStyle, setSelectedStyle] = useState<'classic' | 'minimal' | 'sans'>('classic');
  const [selectedDensity, setSelectedDensity] = useState<'standard' | 'compact' | 'dense'>('standard');

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';
  const restaurantName = localStorage.getItem('drift-restaurant-name') || 'Your Business';

  const styles = [
    { id: 'classic', icon: Square, label: 'Classic', desc: 'with border' },
    { id: 'minimal', icon: Minus, label: 'Minimal', desc: 'clean edge' },
    { id: 'sans', icon: LayoutGrid, label: 'Sans', desc: 'borderless' }
  ];

  const densities = [
    { id: 'standard', label: 'Standard', perSheet: 8 },
    { id: 'compact', label: 'Compact', perSheet: 12 },
    { id: 'dense', label: 'Dense', perSheet: 16 }
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
    
    // Grid configuration based on density
    let cols, rows, cardWidth, cardHeight;
    const itemsPerPage = densities.find(d => d.id === selectedDensity)?.perSheet || 8;
    
    if (itemsPerPage === 8) {
      cols = 2; rows = 4;
      cardWidth = 85; cardHeight = 55;
    } else if (itemsPerPage === 12) {
      cols = 3; rows = 4;
      cardWidth = 60; cardHeight = 50;
    } else {
      cols = 4; rows = 4;
      cardWidth = 45; cardHeight = 45;
    }

    const margin = 12;
    const startX = (pageWidth - (cols * cardWidth)) / 2;
    const startY = 25;
    const spacing = 2;

    // Cover page - minimalist
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Drift mark
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(48);
    pdf.setTextColor(0, 0, 0);
    pdf.text('drift', pageWidth / 2, 70, { align: 'center' });

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text('qr series', pageWidth / 2, 90, { align: 'center' });

    // Restaurant name
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text(restaurantName, pageWidth / 2, 130, { align: 'center' });

    // Specs
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text(`${qrCodes.length} tables · ${itemsPerPage} per sheet · ${selectedStyle} style`, pageWidth / 2, 150, { align: 'center' });

    // Signature line - exactly like landing page
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text('made with ♡ on the great lakes', pageWidth / 2, pageHeight - 25, { align: 'center' });
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(6);
    pdf.text('drift technologies inc.', pageWidth / 2, pageHeight - 15, { align: 'center' });

    // QR Code pages
    for (let i = 0; i < qrCodes.length; i++) {
      if (i > 0 && i % itemsPerPage === 0) {
        pdf.addPage();
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      const posOnPage = i % itemsPerPage;
      const row = Math.floor(posOnPage / cols);
      const col = posOnPage % cols;

      const x = startX + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);

      // Style-specific borders
      if (selectedStyle === 'classic') {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 1, 1, 'S');
      } else if (selectedStyle === 'minimal') {
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);
        pdf.line(x, y + cardHeight - 2, x + cardWidth - 2, y + cardHeight - 2);
      }

      // QR Code
      const qrImage = qrCodes[i].qrCode.split(',')[1];
      const qrSize = Math.min(cardWidth - 16, cardHeight - 20);
      pdf.addImage(
        qrImage, 
        'PNG', 
        x + (cardWidth - qrSize) / 2, 
        y + 8, 
        qrSize, 
        qrSize
      );

      // Table number - minimal
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(7);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`#${qrCodes[i].tableNumber.toString().padStart(2, '0')}`, x + cardWidth - 18, y + cardHeight - 10);

      // Drift signature - subtle on each card
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(4);
      pdf.setTextColor(190, 190, 190);
      pdf.text('drift', x + 8, y + cardHeight - 8);
    }

    // Back cover
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('cut · fold · place', pageWidth / 2, pageHeight / 2, { align: 'center' });

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text('made with ♡ on the great lakes', pageWidth / 2, pageHeight - 25, { align: 'center' });
    pdf.text('drift technologies inc.', pageWidth / 2, pageHeight - 15, { align: 'center' });

    pdf.save(`${restaurantName.toLowerCase().replace(/\s+/g, '-')}-qr-kit.pdf`);
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header - minimalist */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-6"
        >
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-light text-gray-900 mb-2">{restaurantName}</h1>
        <p className="text-sm text-gray-300 tracking-wide">qr code kit · {qrCodes.length} tables</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {generating ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-2 border-black rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-sm text-gray-400">{progress}% · generating</p>
        </div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* Style selection - minimal grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {styles.map((style) => {
              const Icon = style.icon;
              const isActive = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id as any)}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive 
                      ? 'border-black' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 mx-auto mb-2 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <p className="text-xs font-medium text-center">{style.label}</p>
                  <p className="text-[10px] text-gray-300 text-center mt-1">{style.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Density selection */}
          <div className="flex justify-center gap-2 mb-8">
            {densities.map((density) => (
              <button
                key={density.id}
                onClick={() => setSelectedDensity(density.id as any)}
                className={`px-4 py-2 rounded-lg text-xs transition-all ${
                  selectedDensity === density.id
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {density.label} · {density.perSheet}
              </button>
            ))}
          </div>

          {/* Preview - minimal */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">preview</span>
              <span className="text-xs text-gray-300">{qrCodes.length} codes</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {qrCodes.slice(0, 4).map((qr, i) => (
                <motion.div
                  key={qr.tableId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-lg p-2 border border-gray-100"
                >
                  <img src={qr.qrCode} className="w-full aspect-square mb-1" />
                  <span className="text-[10px] text-gray-300 block text-center">#{qr.tableNumber}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={downloadKit}
            className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mb-8"
          >
            <FileDown className="w-4 h-4" />
            <span className="text-sm">download pdf kit</span>
          </button>

          {/* Signature - exactly like landing page */}
          <div className="text-center mb-8">
            <p className="text-xs text-gray-300 flex items-center justify-center gap-1">
              made with <Heart className="w-3 h-3 text-gray-300" /> on the great lakes
            </p>
            <p className="text-[10px] text-gray-200 mt-1">drift technologies inc.</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-100">
            <button onClick={onPrev} className="text-xs text-gray-300 hover:text-gray-600 transition-colors">
              ← back
            </button>
            <button
              onClick={onNext}
              className="text-xs bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
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