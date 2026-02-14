import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Download, 
  Printer, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Check,
  Loader2,
  Palette,
  Smartphone
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Props {
  restaurantId: string | null;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function QRStep({ restaurantId, data, updateData, onNext, onPrev }: Props) {
  const [generating, setGenerating] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [qrStyle, setQrStyle] = useState<'drift' | 'minimal' | 'bold'>('drift');
  const [generated, setGenerated] = useState(false);

  // Mock tables data (in real app, this would come from API)
  const tables = data?.tables || Array.from({ length: 10 }, (_, i) => ({
    id: `table-${i + 1}`,
    number: i + 1
  }));

  const qrStyles = [
    {
      id: 'drift',
      name: 'Drift Signature',
      description: 'Our signature design with logo',
      preview: 'bg-gradient-to-br from-black to-gray-800',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean, simple black on white',
      preview: 'bg-white border-2 border-black',
    },
    {
      id: 'bold',
      name: 'Bold',
      description: 'High contrast with color accent',
      preview: 'bg-black',
    },
  ];

  const generateAllQRCodes = async () => {
    setGenerating(true);
    
    // Simulate generation
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setGenerated(true);
    setGenerating(false);
    
    // Mock QR code data
    const qrData = tables.map((table: any) => ({
      tableId: table.id,
      tableNumber: table.number,
      url: `https://drift.app/table/${table.id}`,
      downloadUrl: `/api/qrcodes/table-${table.number}.png`
    }));
    
    updateData({ 
      qrCodes: qrData,
      qrStyle,
      qrGenerated: true 
    });
  };

  const downloadAll = () => {
    // In production, this would download a ZIP file
    alert('In production, this would download all QR codes as a ZIP file');
  };

  const downloadSingle = (table: any) => {
    alert(`Downloading QR code for Table ${table.number}`);
  };

  const printAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const restaurantName = data?.restaurantInfo?.name || 'Your Restaurant';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Drift QR Codes - ${restaurantName}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              font-weight: 300;
              margin-bottom: 5px;
            }
            .header p {
              color: #666;
              margin: 0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            .qr-card {
              border: 1px solid #eee;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-placeholder {
              width: 150px;
              height: 150px;
              margin: 0 auto 15px;
              background: #f5f5f5;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
              font-size: 24px;
            }
            .qr-card h3 {
              margin: 0 0 5px;
              font-weight: 400;
            }
            .qr-card p {
              margin: 0;
              color: #666;
              font-size: 12px;
            }
            .drift-logo {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }
            @media print {
              body { padding: 0; }
              .qr-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>drift</h1>
            <p>${restaurantName}</p>
            <p style="margin-top: 5px;">Table QR Codes</p>
          </div>
          <div class="grid">
            ${tables.map((table: any) => `
              <div class="qr-card">
                <div class="qr-placeholder">
                  ${qrStyle === 'drift' ? '◼️' : '⬛'}
                </div>
                <h3>Table ${table.number}</h3>
                <p>Scan to order</p>
                <div class="drift-logo">drift</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Generate QR codes</h2>
        <p className="text-gray-400">Beautiful, branded QR codes for every table</p>
      </div>

      {!generated ? (
        <>
          {/* Style Selection */}
          <Card padding="lg" className="mb-6">
            <h3 className="font-medium mb-4">Choose your style</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {qrStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setQrStyle(style.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    qrStyle === style.id 
                      ? 'border-black' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-20 ${style.preview} rounded-lg mb-3 flex items-center justify-center`}>
                    <QrCode className={`w-8 h-8 ${style.id === 'minimal' ? 'text-black' : 'text-white'}`} />
                  </div>
                  <h4 className="font-medium text-sm">{style.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{style.description}</p>
                </button>
              ))}
            </div>

            {/* Preview Card */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <Palette className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Preview</span>
              </div>
              <div className="flex items-center gap-6">
                <div className={`w-32 h-32 ${qrStyle === 'drift' ? 'bg-gradient-to-br from-black to-gray-800' : qrStyle === 'bold' ? 'bg-black' : 'bg-white border-2 border-black'} rounded-xl flex items-center justify-center`}>
                  <QrCode className={`w-16 h-16 ${qrStyle === 'minimal' ? 'text-black' : 'text-white'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">Table 1</div>
                  <div className="text-xs text-gray-400 mb-2">Scan with phone camera to order</div>
                  <div className="inline-flex items-center gap-1 text-xs bg-black text-white px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    <span>drift</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={generateAllQRCodes}
            disabled={generating}
            size="lg"
            fullWidth
            className="mb-6"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating {tables.length} QR codes...
              </>
            ) : (
              <>
                Generate {tables.length} QR Codes
                <Sparkles className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </>
      ) : (
        // Success State
        <Card padding="xl" className="mb-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-light mb-2">QR Codes Generated!</h3>
          <p className="text-gray-400 mb-6">
            {tables.length} QR codes are ready for your tables
          </p>

          {/* Table Grid Preview */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {tables.slice(0, 10).map((table: any) => (
              <button
                key={table.id}
                onClick={() => downloadSingle(table)}
                className="aspect-square bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex flex-col items-center justify-center p-1 group relative"
              >
                <QrCode className="w-6 h-6 text-gray-400 group-hover:text-black mb-1" />
                <span className="text-xs">{table.number}</span>
                <Download className="w-3 h-3 text-gray-300 absolute bottom-1 right-1 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={downloadAll}
              className="py-3 bg-black text-white rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download All
            </button>
            <button
              onClick={printAll}
              className="py-3 border border-gray-200 rounded-xl hover:border-black flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print All
            </button>
          </div>

          {/* Tip */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-start gap-2">
            <Smartphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Print and laminate these QR codes. Place them on tables so customers can scan to order.</span>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onPrev} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!generated} 
          className="flex-1"
        >
          {generated ? 'Continue to Payments' : 'Skip for now'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}