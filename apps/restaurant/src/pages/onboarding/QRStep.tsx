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
  Droplets,
  HelpCircle,
  Info,
  Printer,
  Scissors,
  CreditCard,
  Smartphone,
  Users,
  Coffee,
  Beer,
  Utensils,
  X,
  Check,
  ChevronRight
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
  const [showGuide, setShowGuide] = useState(true);
  const [selectedDensity, setSelectedDensity] = useState<'6' | '9' | '12'>('9');
  const [activeTab, setActiveTab] = useState<'configure' | 'preview' | 'tips'>('configure');

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';
  
  const restaurantName = 
    data?.restaurantInfo?.name || 
    localStorage.getItem('drift-restaurant-name') || 
    'Your Business';

  const businessType = localStorage.getItem('drift-business-type') || 'restaurant';

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Educational content
  const getBusinessIcon = () => {
    switch(businessType) {
      case 'bar': return <Beer className="w-5 h-5" />;
      case 'cafe': return <Coffee className="w-5 h-5" />;
      case 'restaurant': return <Utensils className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getEducationalContent = () => {
    return {
      title: `QR codes for your ${businessType}`,
      valueProp: "Reduce wait times by 40% · Increase order value by 23%",
      steps: [
        {
          icon: <Printer className="w-5 h-5" />,
          title: "Print & place",
          description: "Print on card stock, cut, and place at each table.",
          time: "5 minutes"
        },
        {
          icon: <Smartphone className="w-5 h-5" />,
          title: "Customers scan",
          description: "No app needed — just point and tap.",
          time: "2 seconds"
        },
        {
          icon: <CreditCard className="w-5 h-5" />,
          title: "Order & pay",
          description: "Guests browse, order, and pay from their phone.",
          time: "90 seconds"
        },
        {
          icon: <Users className="w-5 h-5" />,
          title: "You receive",
          description: "Orders appear instantly in your dashboard.",
          time: "real-time"
        }
      ]
    };
  };

  const collections = [
    { 
      id: 'signature', 
      name: 'Signature', 
      icon: Star, 
      description: 'Clean, essential design',
      colors: ['#000000', '#333333', '#666666'],
      density: '9 per sheet',
      bestFor: 'All business types',
      popular: true
    },
    { 
      id: 'heritage', 
      name: 'Heritage', 
      icon: Leaf, 
      description: 'Inspired by the Great Lakes',
      colors: ['#2C5530', '#4A7A4F', '#6B8E6B'],
      density: '6 per sheet',
      bestFor: 'Bars, cafes, casual dining'
    },
    { 
      id: 'legacy', 
      name: 'Legacy', 
      icon: Gem, 
      description: 'Premium, sophisticated',
      colors: ['#1A2F4A', '#2C3E5A', '#4A5F7A'],
      density: '12 per sheet',
      bestFor: 'Fine dining, high-volume'
    }
  ];

  const finishes = [
    { 
      id: 'classic', 
      name: 'Classic', 
      icon: Layout, 
      description: 'Clean lines, standard border',
      preview: 'single-line'
    },
    { 
      id: 'matte', 
      name: 'Matte', 
      icon: Palette, 
      description: 'Soft finish, rounded corners',
      preview: 'soft-edge'
    },
    { 
      id: 'prestige', 
      name: 'Prestige', 
      icon: Gem, 
      description: 'Double border, premium feel',
      preview: 'double-line'
    }
  ];

  const densities = [
    { 
      id: '6', 
      name: 'Large', 
      size: '85 × 60mm', 
      qrSize: '42mm', 
      bestFor: 'Easy reading, bars',
      cardsPerSheet: 6
    },
    { 
      id: '9', 
      name: 'Medium', 
      size: '60 × 55mm', 
      qrSize: '35mm', 
      bestFor: 'Balanced, restaurants',
      cardsPerSheet: 9,
      default: true
    },
    { 
      id: '12', 
      name: 'Small', 
      size: '60 × 48mm', 
      qrSize: '30mm', 
      bestFor: 'High volume, cafes',
      cardsPerSheet: 12
    }
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
    
    const itemsPerPage = parseInt(selectedDensity);
    const density = densities.find(d => d.id === selectedDensity);
    
    // Layout calculations
    let cols, rows, cardWidth, cardHeight;
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

    const startX = (pageWidth - (cols * cardWidth)) / 2;
    const startY = 30;

    const collection = collections.find(c => c.id === selectedCollection);
    const colors = collection?.colors || ['#000000', '#333333', '#666666'];

    // ===== COVER PAGE =====
    pdf.setFillColor(250, 250, 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Logo
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(48);
    pdf.setTextColor(parseInt(colors[0].slice(1,3), 16), parseInt(colors[0].slice(3,5), 16), parseInt(colors[0].slice(5,7), 16));
    pdf.text('drift', pageWidth / 2, 60, { align: 'center' });

    // Collection
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${collection?.name} Collection · ${finishes.find(f => f.id === selectedFinish)?.name} Finish`, pageWidth / 2, 80, { align: 'center' });

    // Restaurant
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(24);
    pdf.setTextColor(30, 30, 30);
    pdf.text(restaurantName, pageWidth / 2, 120, { align: 'center' });

    // Specs
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${qrCodes.length} tables · ${itemsPerPage} per sheet · ${density?.size}`, pageWidth / 2, 150, { align: 'center' });

    // Instructions
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(9);
    pdf.setTextColor(140, 140, 140);
    pdf.text('Print · Cut · Place · Scan', pageWidth / 2, 200, { align: 'center' });

    // Great Lakes
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Made with love on the Great Lakes', pageWidth / 2, pageHeight - 30, { align: 'center' });
    pdf.text('drift technologies inc.', pageWidth / 2, pageHeight - 20, { align: 'center' });

    // ===== QR PAGES =====
    for (let i = 0; i < qrCodes.length; i++) {
      if (i > 0 && i % itemsPerPage === 0) {
        pdf.addPage();
        pdf.setFillColor(250, 250, 252);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      const posOnPage = i % itemsPerPage;
      const row = Math.floor(posOnPage / cols);
      const col = posOnPage % cols;
      const x = startX + col * cardWidth;
      const y = startY + row * (cardHeight + 5);

      // Heritage pattern
      if (selectedCollection === 'heritage') {
        createHeritagePattern(pdf, x, y, cardWidth, cardHeight);
      }

      // Border
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      
      if (selectedFinish === 'prestige') {
        pdf.roundedRect(x - 0.5, y - 0.5, cardWidth - 1, cardHeight - 1, 3, 3, 'S');
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 3, 3, 'S');
      } else {
        pdf.roundedRect(x, y, cardWidth - 2, cardHeight - 2, 2, 2, 'S');
      }

      // QR Code
      try {
        const qrImage = qrCodes[i].qrCode.split(',')[1];
        const qrSize = density?.qrSize ? parseInt(density.qrSize) : 35;
        
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

      // Table number
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`#${qrCodes[i].tableNumber.toString().padStart(2, '0')}`, x + cardWidth - 18, y + 15);

      // Drift
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(6);
      pdf.setTextColor(150, 150, 150);
      pdf.text('drift', x + 10, y + cardHeight - 12);

      // Great Lakes
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(4);
      pdf.setTextColor(170, 170, 170);
      pdf.text('made with love on the great lakes', x + 12, y + cardHeight - 6);
    }

    // ===== BACK COVER =====
    pdf.addPage();
    pdf.setFillColor(250, 250, 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('quick start', pageWidth / 2, 80, { align: 'center' });

    const tips = [
      '1. Print on 80-100lb card stock',
      '2. Cut along the borders',
      '3. Place at eye level on tables',
      '4. Test each code before use',
      '5. Laminate for durability'
    ];

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    
    tips.forEach((tip, index) => {
      pdf.text(tip, 30, 130 + index * 12);
    });

    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text('SOC 2 · PCI DSS · GDPR', pageWidth / 2, pageHeight - 40, { align: 'center' });
    pdf.text('Made with love on the Great Lakes', pageWidth / 2, pageHeight - 25, { align: 'center' });
    pdf.text('drift technologies inc.', pageWidth / 2, pageHeight - 15, { align: 'center' });

    pdf.save(`${restaurantName.toLowerCase().replace(/\s+/g, '-')}-qr-kit.pdf`);
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

  const educational = getEducationalContent();
  const totalPages = Math.ceil(qrCodes.length / parseInt(selectedDensity));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Unboxing Modal */}
      <AnimatePresence>
        {showUnboxing && qrCodes.length > 0 && !unboxed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleUnbox}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-light text-gray-900 mb-2">Your QR kit is ready</h2>
                <p className="text-gray-400 text-sm mb-4">{restaurantName}</p>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-light text-gray-700">{qrCodes.length}</div>
                      <div className="text-xs text-gray-400">tables</div>
                    </div>
                    <div>
                      <div className="text-lg font-light text-gray-700">{selectedDensity}</div>
                      <div className="text-xs text-gray-400">per sheet</div>
                    </div>
                    <div>
                      <div className="text-lg font-light text-gray-700">{totalPages}</div>
                      <div className="text-xs text-gray-400">pages</div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleUnbox}
                  className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>View collection</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 shadow-lg">
          <span className="text-white text-3xl font-light">d</span>
        </div>
        <h1 className="text-4xl font-light text-gray-900 mb-1">drift</h1>
        <p className="text-sm text-gray-400">qr code kit · {restaurantName}</p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generating State */}
      {generating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 text-center border border-gray-100"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-3 border-gray-100 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 border-3 border-black rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{progress}%</span>
            </div>
          </div>
          <h3 className="text-lg font-light text-gray-700 mb-2">Generating your QR codes</h3>
          <p className="text-sm text-gray-400">Creating unique codes for each table</p>
        </motion.div>
      )}

      {/* Main Interface */}
      {!generating && qrCodes.length > 0 && (
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="space-y-6"
        >
          {/* Value Proposition Banner */}
          <motion.div variants={fadeInUp} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">{educational.valueProp}</p>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-light text-gray-700">{qrCodes.length}</div>
              <div className="text-xs text-gray-400">tables</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-light text-gray-700">{selectedDensity}</div>
              <div className="text-xs text-gray-400">per sheet</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-light text-gray-700">{totalPages}</div>
              <div className="text-xs text-gray-400">pages</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-light text-gray-700">A4</div>
              <div className="text-xs text-gray-400">format</div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeInUp} className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {[
              { id: 'configure', label: 'Configure' },
              { id: 'preview', label: 'Preview' },
              { id: 'tips', label: 'Tips' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Configure Tab */}
            {activeTab === 'configure' && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Size Selection */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Card size</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {densities.map((density) => (
                      <button
                        key={density.id}
                        onClick={() => setSelectedDensity(density.id as any)}
                        className={`relative p-4 rounded-xl border transition-all text-left ${
                          selectedDensity === density.id
                            ? 'border-black bg-gray-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {density.default && (
                          <span className="absolute top-2 right-2 text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
                            recommended
                          </span>
                        )}
                        <p className="text-base font-medium">{density.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{density.size}</p>
                        <p className="text-[10px] text-gray-300 mt-2">{density.bestFor}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collection Selection */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Collection</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {collections.map((collection) => {
                      const Icon = collection.icon;
                      const isActive = selectedCollection === collection.id;
                      return (
                        <button
                          key={collection.id}
                          onClick={() => setSelectedCollection(collection.id as any)}
                          className={`relative p-4 rounded-xl border transition-all ${
                            isActive 
                              ? 'border-black bg-gray-50 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {collection.popular && (
                            <span className="absolute top-2 right-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              popular
                            </span>
                          )}
                          <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                          <p className="text-sm font-medium">{collection.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{collection.description}</p>
                          <div className="flex gap-1 mt-3">
                            {collection.colors.map((color, i) => (
                              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Finish Selection */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Finish</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {finishes.map((finish) => {
                      const Icon = finish.icon;
                      const isActive = selectedFinish === finish.id;
                      return (
                        <button
                          key={finish.id}
                          onClick={() => setSelectedFinish(finish.id as any)}
                          className={`p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'border-black bg-gray-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                          <p className="text-sm font-medium">{finish.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{finish.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Preview</h3>
                  <span className="text-xs text-gray-400">{selectedCollection} · {selectedFinish} finish</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {qrCodes.slice(0, 4).map((qr, i) => (
                    <motion.div
                      key={qr.tableId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                    >
                      <img src={qr.qrCode} className="w-full aspect-square mb-2" />
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">#{qr.tableNumber}</span>
                        <span className="text-gray-400">drift</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tips Tab */}
            {activeTab === 'tips' && (
              <motion.div
                key="tips"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-blue-50/30 rounded-xl p-6 border border-blue-100"
              >
                <h3 className="text-sm font-medium text-gray-700 mb-4">How QR codes work</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {educational.steps.map((step, i) => (
                    <div key={i} className="text-center">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                        {step.icon}
                      </div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">{step.title}</h4>
                      <p className="text-[10px] text-gray-400 mb-1">{step.description}</p>
                      <p className="text-[8px] text-gray-300">{step.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Download Button */}
          <motion.div variants={fadeInUp}>
            <button
              onClick={downloadCollection}
              className="w-full bg-black text-white py-5 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <FileDown className="w-5 h-5" />
              <span className="text-base font-light">Download QR Kit</span>
            </button>
          </motion.div>

          {/* Great Lakes Signature */}
          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">made with</span>
            <Heart className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">on the Great Lakes</span>
          </motion.div>

          {/* Navigation */}
          <motion.div variants={fadeInUp} className="flex justify-between pt-6 border-t border-gray-100">
            <button onClick={onPrev} className="text-sm text-gray-400 hover:text-gray-600">
              ← back
            </button>
            <button
              onClick={onNext}
              className="text-sm bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              complete setup
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Initial State */}
      {!generating && qrCodes.length === 0 && (
        <motion.button
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          onClick={generateQRCodes}
          className="w-full py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 hover:border-black transition-all flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <QrCode className="w-8 h-8 text-gray-400" />
          </div>
          <span className="text-base text-gray-600">Generate QR codes</span>
          <span className="text-xs text-gray-400">for {qrCodes.length || 'your'} tables</span>
        </motion.button>
      )}
    </div>
  );
}