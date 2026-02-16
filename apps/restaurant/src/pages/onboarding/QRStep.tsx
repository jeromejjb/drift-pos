import { useState, useEffect } from 'react';
import { QrCode, Download, Printer, CheckCircle, Loader2, Sparkles, Shield, FileText, ArrowRight } from 'lucide-react';
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
  const [showSuccess, setShowSuccess] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';
  const restaurantName = localStorage.getItem('drift-restaurant-name') || 'Your Restaurant';

  const generateQRCodes = async () => {
    setGenerating(true);
    setError('');
    setProgress(0);
    setShowSuccess(false);
    
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
        setShowSuccess(true);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
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

  const generatePDF = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const qrSize = 60;
    const qrPerRow = 2;
    const qrSpacing = (pageWidth - (margin * 2) - (qrSize * qrPerRow)) / (qrPerRow - 1);

    // Add cover page
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Drift logo (text-based for now)
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(48);
    pdf.setTextColor(0, 0, 0);
    pdf.text('drift', pageWidth / 2, pageHeight / 3, { align: 'center' });
    
    pdf.setFont('helvetica', 'lightitalic');
    pdf.setFontSize(24);
    pdf.setTextColor(100, 100, 100);
    pdf.text('table codes', pageWidth / 2, pageHeight / 3 + 20, { align: 'center' });

    // Restaurant name
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(50, 50, 50);
    pdf.text(restaurantName, pageWidth / 2, pageHeight / 2, { align: 'center' });

    // Date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${currentDate}`, pageWidth / 2, pageHeight - margin, { align: 'center' });

    // Add each QR code on its own page
    qrCodes.forEach((qr, index) => {
      pdf.addPage();

      // Light background
      pdf.setFillColor(250, 250, 250);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Table number header
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(12);
      pdf.setTextColor(150, 150, 150);
      pdf.text('table', pageWidth / 2, 40, { align: 'center' });
      
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(48);
      pdf.setTextColor(0, 0, 0);
      pdf.text(qr.tableNumber.toString().padStart(2, '0'), pageWidth / 2, 70, { align: 'center' });

      // Add QR code image
      const qrImage = qr.qrCode.split(',')[1];
      pdf.addImage(
        qrImage, 
        'PNG', 
        (pageWidth - 80) / 2, 
        90, 
        80, 
        80
      );

      // Instructions
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('scan with your camera to view menu & order', pageWidth / 2, 190, { align: 'center' });

      // Restaurant name at bottom
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(restaurantName, pageWidth / 2, pageHeight - 30, { align: 'center' });
      
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(7);
      pdf.setTextColor(200, 200, 200);
      pdf.text('drift technologies', pageWidth / 2, pageHeight - 20, { align: 'center' });

      // Add page number
      pdf.setFont('helvetica', 'light');
      pdf.setFontSize(8);
      pdf.setTextColor(200, 200, 200);
      pdf.text(`${index + 1} / ${qrCodes.length}`, pageWidth - margin, pageHeight - margin, { align: 'right' });
    });

    // Add back cover
    pdf.addPage();
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('ready to serve', pageWidth / 2, pageHeight / 2, { align: 'center' });
    
    pdf.setFont('helvetica', 'light');
    pdf.setFontSize(24);
    pdf.setTextColor(200, 200, 200);
    pdf.text('drift', pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });

    // Save the PDF
    pdf.save(`drift-${restaurantName.replace(/\s+/g, '-').toLowerCase()}-table-codes.pdf`);
  };

  const printAll = async () => {
    // Generate and download PDF instead of printing directly
    await generatePDF();
  };

  useEffect(() => {
    if (qrCodes.length === 0 && data.tables) {
      generateQRCodes();
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">QR Codes Generated!</p>
                <p className="text-sm text-green-600">Ready to download and print</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-3xl font-light text-gray-900 mb-2">Your Table Codes</h2>
        <p className="text-gray-400">Generate beautiful QR codes for each table</p>
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
          className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-16 border border-gray-100 text-center shadow-xl"
        >
          <div className="relative mb-12">
            {/* Animated background rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-gray-100 rounded-full animate-ping opacity-20"></div>
              <div className="w-40 h-40 border-2 border-gray-200 rounded-full animate-pulse"></div>
            </div>
            
            {/* Main spinner */}
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <motion.div 
                className="absolute inset-0 border-4 border-black rounded-full border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-light text-gray-700">{progress}%</span>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-light mb-3">Crafting your table codes</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            We're creating beautiful, print-ready QR codes for each of your tables.
          </p>

          {/* Progress bar with gradient */}
          <div className="w-full max-w-md mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-gray-900 to-gray-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Elegant progress messages */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-sm text-gray-400 font-light"
          >
            {progress < 30 && "✨ Designing your portfolio..."}
            {progress >= 30 && progress < 60 && "📱 Generating QR patterns..."}
            {progress >= 60 && progress < 90 && "🎨 Adding finishing touches..."}
            {progress >= 90 && "🌟 Almost ready..."}
          </motion.div>
        </motion.div>
      ) : qrCodes.length > 0 ? (
        <>
          {/* Success state with PDF download */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-light mb-1">Your Table Code Portfolio</h3>
                <p className="text-gray-400 text-sm">{qrCodes.length} tables · Ready to print</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-8">
              {qrCodes.slice(0, 4).map((qr, index) => (
                <motion.div
                  key={qr.tableId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-3 border border-gray-100 text-center"
                >
                  <div className="text-xs text-gray-400 mb-2">Table {qr.tableNumber}</div>
                  <img src={qr.qrCode} alt={`Table ${qr.tableNumber}`} className="w-full aspect-square" />
                </motion.div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={generatePDF}
                className="flex-1 bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 group"
              >
                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Download PDF Portfolio</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
              <button
                onClick={generateQRCodes}
                className="px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-black transition-all flex items-center justify-center gap-2 group"
                title="Regenerate codes"
              >
                <QrCode className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-300">
              <span className="flex items-center gap-1">SOC 2</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="flex items-center gap-1">PCI DSS</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="flex items-center gap-1">GDPR</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="flex items-center gap-1">Print-ready PDF</span>
            </div>
          </motion.div>

          {/* Individual downloads (optional) */}
          <details className="group">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-2">
              <span>Download individual QR codes</span>
              <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {qrCodes.map((qr) => (
                <button
                  key={qr.tableId}
                  onClick={() => downloadQR(qr.qrCode, qr.tableNumber)}
                  className="flex items-center gap-2 p-2 text-xs text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Table {qr.tableNumber}
                </button>
              ))}
            </div>
          </details>
        </>
      ) : (
        <button
          onClick={generateQRCodes}
          className="w-full py-16 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-black transition-all flex flex-col items-center gap-6 group"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center group-hover:bg-black transition-colors">
            <QrCode className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-light text-gray-900 mb-2">Generate your table codes</h3>
            <p className="text-gray-400">We'll create a beautiful PDF portfolio for your restaurant</p>
          </div>
          <div className="flex gap-2 text-xs text-gray-300">
            <span>High resolution</span>
            <span>•</span>
            <span>Print ready</span>
            <span>•</span>
            <span>Branded</span>
          </div>
        </button>
      )}

      <div className="flex justify-between pt-6 border-t border-gray-100">
        <button
          onClick={onPrev}
          className="px-6 py-3 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={qrCodes.length === 0}
          className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 group"
        >
          <span>Complete Setup</span>
          <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}