import { useState, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  CheckCircle, 
  Heart,
  Sparkles,
  FileDown,
  ArrowRight,
  Palette,
  Layout,
  Maximize2,
  Minimize2,
  Layers,
  Star,
  Award,
  Gem,
  Leaf,
  Mountain,
  Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedCollection, setSelectedCollection] = useState<'signature' | 'heritage' | 'legacy'>('signature');
  const [selectedFinish, setSelectedFinish] = useState<'classic' | 'matte' | 'prestige'>('prestige');
  const [showUnboxing, setShowUnboxing] = useState(true);
  const [unboxed, setUnboxed] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';
  
  const restaurantName = 
    data?.restaurantInfo?.name || 
    localStorage.getItem('drift-restaurant-name') || 
    'Your Business';

  const collections = [
    { 
      id: 'signature', 
      name: 'Signature', 
      icon: Star, 
      desc: 'essential elegance',
      colors: ['#000000', '#333333', '#666666']
    },
    { 
      id: 'heritage', 
      name: 'Heritage', 
      icon: Leaf, 
      desc: 'inspired by the lakes',
      colors: ['#2C5530', '#4A7A4F', '#6B8E6B']
    },
    { 
      id: 'legacy', 
      name: 'Legacy', 
      icon: Gem, 
      desc: 'premium collection',
      colors: ['#1A2F4A', '#2C3E5A', '#4A5F7A']
    }
  ];

  const finishes = [
    { id: 'classic', name: 'Classic', icon: Layout, desc: 'clean lines' },
    { id: 'matte', name: 'Matte', icon: Palette, desc: 'soft finish' },
    { id: 'prestige', name: 'Prestige', icon: Gem, desc: 'double border' }
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
    }, 60);
    
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
        setShowUnboxing(true);
      }, 500);
      
    } catch (error) {
      console.error('Error generating QR codes:', error);
      setError('Failed to generate QR codes. Please try again.');
      setGenerating(false);
    } finally {
      clearInterval(interval);
    }
  };

  const createHeritagePattern = (pdf: any, x: number, y: number, width: number, height: number) => {
    // Create a subtle wave pattern representing the Great Lakes
    pdf.setDrawColor(200, 215, 220);
    pdf.setLineWidth(0.1);
    
    for (let i = 0; i < 3; i++) {
      const waveY = y + height - 15 + (i * 3);
      pdf.line(x + 5, waveY, x + 15, waveY - 2);
      pdf.line(x + 15, waveY - 2, x + 25, waveY + 1);
      pdf.line(x + 25, waveY + 1, x + 35, waveY - 1);
    }
  };

  const downloadCollection = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Premium layout
    const cols = 2;
    const rows = 3;
    const cardWidth = 85;
    const cardHeight = 60;
    const margin = 18;
    const startX = (pageWidth - (cols * cardWidth)) / 2;
    const startY = 35;

    // Collection colors
    const colors = collections.find(c => c.id === selectedCollection)?.colors || ['#000000', '#333333', '#666666'];

    // ===== COVER PAGE - UNBOXING EXPERIENCE =====
    pdf.setFillColor(250, 250, 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Heritage pattern
    pdf.setDrawColor(220, 225, 230);
    pdf.setLineWidth(0.2);
    
    // Lake-inspired wave pattern
    for (let i = 0; i < 5; i++) {
      const y = 40 + i * 30;
      pdf.line(30, y, pageWidth - 30, y - 10);
      pdf.line(30, y + 10, pageWidth - 30, y);
    }

    // Drift logo with elevation
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(52);
    pdf.setTextColor(parseInt(colors[0].slice(1,3), 16), parseInt(colors[0].slice(3,5), 16), parseInt(colors[0].slice(5,7), 16));
    pdf.text('drift', pageWidth / 2, 90, { align: 'center' });

    // Collection name
    pdf.setFont('helvetica', 'lightitalic');
    pdf.setFontSize(16);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${selectedCollection} collection`, pageWidth / 2, 115, { align: 'center' });

    // Restaurant name - elegantly centered
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(28);
    pdf.setTextColor(30, 30, 30);
    pdf.text(restaurantName, pageWidth / 2, 160, { align: 'center' });

    // Details with finish
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(140, 140, 140);
    pdf.text(`${qrCodes.length} tables · ${finishes.find(f => f.id === selectedFinish)?.name} finish · ${selectedCollection} series`, pageWidth / 2, 190, { align: 'center' });

    // Great Lakes signature - exactly like landing page
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Made with ♡ on the Great Lakes', pageWidth / 2, pageHeight - 35, { align: 'center' });
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.setTextColor(170, 170, 170);
    pdf.text('drift technologies inc. · established 2024', pageWidth / 2, pageHeight - 25, { align: 'center' });

    // ===== QR CODE PAGES =====
    for (let i = 0; i < qrCodes.length; i++) {
      if (i > 0 && i % (cols * rows) === 0) {
        pdf.addPage();
        pdf.setFillColor(250, 250, 252);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      const posOnPage = i % (cols * rows);
      const row = Math.floor(posOnPage / cols);
      const col = posOnPage % cols;

      const x = startX + col * cardWidth;
      const y = startY + row * (cardHeight + 8);

      // Collection-specific background
      if (selectedCollection === 'heritage') {
        createHeritagePattern(pdf, x, y, cardWidth, cardHeight);
      }

      // Card border with finish
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      
      if (selectedFinish === 'prestige') {
        // Double border for prestige
        pdf.roundedRect(x - 0.5, y - 0.5, cardWidth - 1, cardHeight - 1, 3, 3, 'S');
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 3, 3, 'S');
      } else if (selectedFinish === 'matte') {
        // Soft border for matte
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 4, 4, 'S');
      } else {
        // Clean border for classic
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 2, 2, 'S');
      }

      // QR Code - premium placement
      try {
        const qrImage = qrCodes[i].qrCode.split(',')[1];
        const qrSize = 38;
        
        pdf.addImage(
          qrImage, 
          'PNG', 
          x + (cardWidth - qrSize) / 2, 
          y + 12, 
          qrSize, 
          qrSize,
          undefined,
          'FAST'
        );
      } catch (err) {
        console.error('Error adding QR image:', err);
      }

      // Table number - refined
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${qrCodes[i].tableNumber.toString().padStart(2, '0')}`, x + cardWidth - 20, y + cardHeight - 14);

      // Drift signature
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(7);
      pdf.setTextColor(160, 160, 160);
      pdf.text('drift', x + 12, y + cardHeight - 14);

      // Great Lakes mark on each card
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(4);
      pdf.setTextColor(180, 180, 180);
      pdf.text('made with ♡ on the great lakes', x + 12, y + cardHeight - 8);
    }

    // ===== BACK COVER - INSTRUCTIONS =====
    pdf.addPage();
    pdf.setFillColor(250, 250, 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Heritage wave
    pdf.setDrawColor(200, 210, 220);
    pdf.setLineWidth(0.3);
    for (let i = 0; i < 3; i++) {
      const y = 80 + i * 30;
      pdf.line(40, y, pageWidth - 40, y - 15);
    }

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(22);
    pdf.setTextColor(40, 40, 40);
    pdf.text('setting up', pageWidth / 2, 130, { align: 'center' });

    const instructions = [
      'print on premium card stock (100lb recommended)',
      'cut with precision along the subtle guidelines',
      'fold gently for table tents',
      'place where guests can easily scan',
      '',
      'each scan connects directly to your menu'
    ];

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    
    instructions.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, 180 + index * 9, { align: 'center' });
    });

    // Security credentials
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('SOC 2 · PCI DSS · GDPR compliant', pageWidth / 2, pageHeight - 45, { align: 'center' });

    // Great Lakes signature
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text('Made with ♡ on the Great Lakes', pageWidth / 2, pageHeight - 30, { align: 'center' });
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text('drift technologies inc.', pageWidth / 2, pageHeight - 20, { align: 'center' });

    pdf.save(`${restaurantName.toLowerCase().replace(/\s+/g, '-')}-${selectedCollection}-collection.pdf`);
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  const handleUnbox = () => {
    setUnboxed(true);
    setShowUnboxing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Unboxing Experience */}
      <AnimatePresence>
        {showUnboxing && qrCodes.length > 0 && !unboxed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={handleUnbox}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="text-center max-w-md p-12"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 5, 0],
                  y: [0, -5, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="mb-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full blur-2xl opacity-50"></div>
                  <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Layers className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <h2 className="text-3xl font-light text-gray-900 mb-4">Your collection is ready</h2>
              <p className="text-gray-400 mb-8">Thoughtfully crafted for {restaurantName}</p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnbox}
                className="bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-all inline-flex items-center gap-3"
              >
                <span>unbox collection</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with elevation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ 
            y: [0, -5, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl flex items-center justify-center shadow-xl">
            <span className="text-white text-4xl font-light italic">d</span>
          </div>
        </motion.div>
        <h1 className="text-5xl font-light text-gray-900 mb-2 tracking-tight">drift</h1>
        <p className="text-gray-400 flex items-center justify-center gap-2">
          <Mountain className="w-4 h-4" />
          <span>qr collection · {restaurantName}</span>
          <Droplets className="w-4 h-4" />
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {generating ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-xl"
        >
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-4 border-black rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-0 border-4 border-gray-300 rounded-full border-b-transparent"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-light text-gray-700">{progress}%</span>
            </div>
          </div>
          
          <motion.h3 
            key={Math.floor(progress / 25)}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-light mb-3"
          >
            {progress < 25 && "curating your collection..."}
            {progress >= 25 && progress < 50 && "adding heritage details..."}
            {progress >= 50 && progress < 75 && "preparing for print..."}
            {progress >= 75 && "almost ready to unbox..."}
          </motion.h3>
          
          <div className="w-full max-w-md mx-auto h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-gray-900 to-gray-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* Collection Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {collections.map((collection) => {
              const Icon = collection.icon;
              const isActive = selectedCollection === collection.id;
              return (
                <motion.button
                  key={collection.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCollection(collection.id as any)}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    isActive 
                      ? 'border-black shadow-lg' 
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-3 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <p className="text-base font-light text-center">{collection.name}</p>
                  <p className="text-xs text-gray-400 text-center mt-1">{collection.desc}</p>
                  <div className="flex justify-center gap-1 mt-3">
                    {collection.colors.map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Finish Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center gap-3 mb-8"
          >
            {finishes.map((finish) => {
              const Icon = finish.icon;
              const isActive = selectedFinish === finish.id;
              return (
                <motion.button
                  key={finish.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFinish(finish.id as any)}
                  className={`px-6 py-3 rounded-xl border transition-all flex items-center gap-3 ${
                    isActive
                      ? 'border-black bg-gray-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <span className="text-sm font-light">{finish.name}</span>
                  <span className="text-xs text-gray-400">{finish.desc}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Preview Gallery */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-8 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-400 uppercase tracking-wider">collection preview</span>
              <span className="text-sm text-gray-400">{qrCodes.length} pieces</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {qrCodes.slice(0, 4).map((qr, i) => (
                <motion.div
                  key={qr.tableId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <img src={qr.qrCode} className="w-full aspect-square mb-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">#{qr.tableNumber}</span>
                    <span className="text-gray-300">drift</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Download Experience */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative mb-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl blur-xl opacity-20"
            />
            <button
              onClick={downloadCollection}
              className="relative w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6 rounded-2xl hover:from-gray-800 hover:to-gray-700 transition-all flex items-center justify-center gap-3 text-xl font-light shadow-xl"
            >
              <FileDown className="w-6 h-6" />
              <span>download {selectedCollection} collection</span>
              <Sparkles className="w-5 h-5 opacity-70" />
            </button>
          </motion.div>

          {/* Great Lakes Signature */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <span className="text-sm text-gray-400">made with</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart className="w-4 h-4 text-gray-400" />
            </motion.div>
            <span className="text-sm text-gray-400">on the</span>
            <span className="text-sm text-gray-400 font-light">Great Lakes</span>
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8"
          >
            <p className="text-xs text-gray-300">drift technologies · est. 2024</p>
            <p className="text-[10px] text-gray-200 mt-1">soc 2 · pci dss · gdpr certified</p>
          </motion.div>

          {/* Navigation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-between pt-6 border-t border-gray-100"
          >
            <button onClick={onPrev} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← back
            </button>
            <button
              onClick={onNext}
              className="text-sm bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              complete setup
            </button>
          </motion.div>
        </>
      ) : (
        <motion.button
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          onClick={generateQRCodes}
          className="w-full py-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-black transition-all flex flex-col items-center gap-4"
        >
          <QrCode className="w-12 h-12 text-gray-300" />
          <h3 className="text-xl font-light">create your collection</h3>
          <p className="text-sm text-gray-400">three signature series · premium finishes</p>
        </motion.button>
      )}
    </div>
  );
}