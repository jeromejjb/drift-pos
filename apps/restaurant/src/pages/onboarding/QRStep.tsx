import { useState, useEffect } from 'react';
import { QrCode, Download, Heart, Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
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
  const [downloading, setDownloading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';
  const restaurantName = data?.restaurantInfo?.name || data?.name || localStorage.getItem('drift-restaurant-name') || 'Your Business';

  // Get the actual table count - handle both array and number formats
  const getTableCount = () => {
    if (data.tables && Array.isArray(data.tables) && data.tables.length > 0) {
      return data.tables.length;
    }
    if (data.tableCount && typeof data.tableCount === 'number') {
      return data.tableCount;
    }
    // Check localStorage as fallback
    const stored = localStorage.getItem('drift_onboarding');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.tables && Array.isArray(parsed.tables)) {
          return parsed.tables.length;
        }
        if (parsed.tableCount && typeof parsed.tableCount === 'number') {
          return parsed.tableCount;
        }
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }
    return 0;
  };

  const tableCount = getTableCount();

  const generateQRCodes = async () => {
    setGenerating(true);
    setError('');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 95));
    }, 100);
    
    try {
      console.log('🎯 Generating QR codes for tables:', tableCount);
      
      // Get tables array from data or create from count
      let tables = data.tables;
      if (!tables && tableCount > 0) {
        tables = Array.from({ length: tableCount }, (_, i) => ({
          id: `table-${i + 1}`,
          number: i + 1
        }));
      }
      
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables/generate-qrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables })
      });

      if (!response.ok) throw new Error('Failed to generate QR codes');

      const result = await response.json();
      console.log('✅ QR codes generated:', result.tables?.length || 0);
      
      setProgress(100);
      setTimeout(() => {
        setQrCodes(result.tables);
        updateData({ qrCodes: result.tables });
        setGenerating(false);
      }, 300);
      
    } catch (error) {
      console.error('❌ QR generation failed:', error);
      setError('Failed to generate QR codes. Please try again.');
      setGenerating(false);
    } finally {
      clearInterval(interval);
    }
  };

  const downloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);
    
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Helvetica, Arial, sans-serif';
      document.body.appendChild(container);

      const perPage = parseInt(cardsPerSheet);
      
      // Generate cover page
      const coverPage = document.createElement('div');
      coverPage.style.width = '210mm';
      coverPage.style.height = '297mm';
      coverPage.style.padding = '15mm';
      coverPage.style.backgroundColor = 'white';
      coverPage.style.position = 'relative';
      coverPage.innerHTML = `
        <div style="text-align: center; margin-top: 40mm;">
          <h1 style="font-size: 48px; font-weight: 300; letter-spacing: 4px; margin-bottom: 10px; color: #000;">DRIFT</h1>
          <p style="font-size: 18px; color: #666; margin-bottom: 30px;">${restaurantName}</p>
          <p style="font-size: 24px; color: #333; margin-bottom: 40px;">Table QR Code Kit</p>
          
          <div style="width: 80%; margin: 0 auto; text-align: left; border-top: 1px solid #eee; padding-top: 20px;">
            <h3 style="font-size: 16px; font-weight: 500; margin-bottom: 15px;">WHAT'S INSIDE</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px; color: #555;">✓ ${qrCodes.length} unique QR codes — one per table</li>
              <li style="margin-bottom: 10px; color: #555;">✓ ${perPage} codes per sheet · ${Math.ceil(qrCodes.length / perPage)} pages total</li>
              <li style="margin-bottom: 10px; color: #555;">✓ Each code links directly to your menu</li>
              <li style="margin-bottom: 10px; color: #555;">✓ No app required — works with any smartphone</li>
              <li style="margin-bottom: 10px; color: #555;">✓ Real-time orders in your dashboard</li>
            </ul>
          </div>

          <div style="position: absolute; bottom: 25mm; left: 0; right: 0; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; color: #999;">
              <span style="font-size: 12px;">Built with</span>
              <span style="font-size: 16px; color: #999;">♡</span>
              <span style="font-size: 12px;">on the</span>
              <img src="/greatlakes.png" style="height: 16px; width: auto; opacity: 0.8;" />
            </div>
            <p style="font-size: 10px; color: #ccc; margin-top: 8px;">DRIFT TECHNOLOGIES INC.</p>
          </div>
        </div>
      `;
      container.appendChild(coverPage);

      // Generate QR code pages
      const cardsPerPage = perPage;
      const totalPages = Math.ceil(qrCodes.length / cardsPerPage);
      
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const page = document.createElement('div');
        page.style.width = '210mm';
        page.style.height = '297mm';
        page.style.padding = '10mm';
        page.style.backgroundColor = 'white';
        page.style.position = 'relative';
        page.style.boxSizing = 'border-box';

        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.marginBottom = '10mm';
        header.style.color = '#999';
        header.style.fontSize = '10px';
        header.style.letterSpacing = '1px';
        header.innerText = `TABLE QR CODES · PAGE ${pageNum + 1} OF ${totalPages}`;
        page.appendChild(header);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gap = '5mm';
        grid.style.justifyContent = 'center';
        
        if (perPage === 6) {
          grid.style.gridTemplateColumns = 'repeat(2, 85mm)';
        } else if (perPage === 9) {
          grid.style.gridTemplateColumns = 'repeat(3, 60mm)';
        } else {
          grid.style.gridTemplateColumns = 'repeat(3, 45mm)';
        }

        const startIdx = pageNum * cardsPerPage;
        const endIdx = Math.min(startIdx + cardsPerPage, qrCodes.length);

        for (let i = startIdx; i < endIdx; i++) {
          const qr = qrCodes[i];
          
          const card = document.createElement('div');
          card.style.width = '100%';
          card.style.height = perPage === 6 ? '60mm' : perPage === 9 ? '55mm' : '45mm';
          card.style.backgroundColor = '#fcfcfc';
          card.style.border = '1px solid #eaeaea';
          card.style.borderRadius = '4px';
          card.style.padding = '5px';
          card.style.boxSizing = 'border-box';
          card.style.position = 'relative';

          const img = document.createElement('img');
          img.src = qr.qrCode;
          img.style.width = perPage === 6 ? '45mm' : perPage === 9 ? '38mm' : '30mm';
          img.style.height = 'auto';
          img.style.position = 'absolute';
          img.style.top = '50%';
          img.style.left = '50%';
          img.style.transform = 'translate(-50%, -50%)';
          card.appendChild(img);

          const tableNum = document.createElement('div');
          tableNum.style.position = 'absolute';
          tableNum.style.top = '8px';
          tableNum.style.right = '12px';
          tableNum.style.fontSize = perPage === 12 ? '14px' : '16px';
          tableNum.style.fontWeight = '300';
          tableNum.style.color = '#333';
          tableNum.innerText = qr.tableNumber.toString();
          card.appendChild(tableNum);

          const tableLabel = document.createElement('div');
          tableLabel.style.position = 'absolute';
          tableLabel.style.top = perPage === 12 ? '22px' : '26px';
          tableLabel.style.right = '14px';
          tableLabel.style.fontSize = perPage === 12 ? '7px' : '8px';
          tableLabel.style.color = '#999';
          tableLabel.innerText = 'table';
          card.appendChild(tableLabel);

          const drift = document.createElement('div');
          drift.style.position = 'absolute';
          drift.style.bottom = '8px';
          drift.style.left = '10px';
          drift.style.fontSize = perPage === 12 ? '7px' : '8px';
          drift.style.fontWeight = '300';
          drift.style.letterSpacing = '1px';
          drift.style.color = '#aaa';
          drift.innerText = 'DRIFT';
          card.appendChild(drift);

          const lakes = document.createElement('div');
          lakes.style.position = 'absolute';
          lakes.style.bottom = '8px';
          lakes.style.right = '10px';
          lakes.style.display = 'flex';
          lakes.style.alignItems = 'center';
          lakes.style.gap = '2px';
          lakes.style.fontSize = perPage === 12 ? '5px' : '6px';
          lakes.style.color = '#bbb';
          lakes.innerHTML = `
            <span>Built with</span>
            <span style="font-size: ${perPage === 12 ? '6px' : '8px'};">♡</span>
            <span>on the</span>
            <img src="/greatlakes.png" style="height: ${perPage === 12 ? '6px' : '8px'}; width: auto; opacity: 0.8; margin-left: 2px;" />
          `;
          card.appendChild(lakes);

          grid.appendChild(card);
        }

        page.appendChild(grid);
        container.appendChild(page);
      }

      // Generate pro tips page
      const tipsPage = document.createElement('div');
      tipsPage.style.width = '210mm';
      tipsPage.style.height = '297mm';
      tipsPage.style.padding = '15mm';
      tipsPage.style.backgroundColor = 'white';
      tipsPage.style.position = 'relative';
      tipsPage.innerHTML = `
        <div style="text-align: center; margin-top: 30mm;">
          <h1 style="font-size: 42px; font-weight: 300; letter-spacing: 4px; margin-bottom: 10px; color: #000;">DRIFT</h1>
          <p style="font-size: 16px; color: #666; margin-bottom: 30px;">pro tips</p>
          
          <div style="width: 80%; margin: 0 auto; text-align: left;">
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 18px; font-weight: 400; margin-bottom: 15px; color: #333;">📄 Paper</h3>
              <p style="color: #666; margin-bottom: 20px;">Use 80-100lb card stock for durability — it feels premium and lasts longer.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 18px; font-weight: 400; margin-bottom: 15px; color: #333;">✂️ Cutting</h3>
              <p style="color: #666; margin-bottom: 20px;">Cut carefully with scissors or a paper cutter for clean edges.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 18px; font-weight: 400; margin-bottom: 15px; color: #333;">🛡️ Protection</h3>
              <p style="color: #666; margin-bottom: 20px;">Laminate to make them last longer — especially in busy venues.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 18px; font-weight: 400; margin-bottom: 15px; color: #333;">👁️ Placement</h3>
              <p style="color: #666; margin-bottom: 20px;">Place at eye level on tables for easy scanning.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 18px; font-weight: 400; margin-bottom: 15px; color: #333;">📱 Testing</h3>
              <p style="color: #666; margin-bottom: 20px;">Test each code with your phone before placing.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 18px; font-weight: 400; margin-bottom: 15px; color: #333;">🔄 Spares</h3>
              <p style="color: #666; margin-bottom: 20px;">Keep spares for quick replacement if needed.</p>
            </div>
          </div>

          <div style="position: absolute; bottom: 25mm; left: 0; right: 0; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; color: #999;">
              <span style="font-size: 12px;">Built with</span>
              <span style="font-size: 16px; color: #999;">♡</span>
              <span style="font-size: 12px;">on the</span>
              <img src="/greatlakes.png" style="height: 16px; width: auto; opacity: 0.8;" />
            </div>
            <p style="font-size: 10px; color: #ccc; margin-top: 8px;">DRIFT TECHNOLOGIES INC.</p>
          </div>
        </div>
      `;
      container.appendChild(tipsPage);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Convert to PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pages = container.children;
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: false,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      document.body.removeChild(container);
      pdf.save(`${restaurantName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr-codes.pdf`);
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Auto-generate QR codes when tables are available
  useEffect(() => {
    console.log('📊 QRStep data:', {
      tableCount,
      hasQrCodes: qrCodes.length > 0,
      restaurantId
    });

    // Only generate if we have tables AND no QR codes yet
    if (tableCount > 0 && qrCodes.length === 0 && !generating) {
      console.log(`🎯 Auto-generating QR codes for ${tableCount} tables`);
      generateQRCodes();
    } else if (tableCount === 0) {
      console.log('⚠️ No tables found in data');
    }
  }, [tableCount, restaurantId]);

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
        {tableCount > 0 && (
          <p className="text-sm text-blue-600 mt-2">
            {qrCodes.length > 0 
              ? `${qrCodes.length} unique codes ready — one for each table`
              : `Generating codes for ${tableCount} ${tableCount === 1 ? 'table' : 'tables'}`
            }
          </p>
        )}
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
                  <img src={qr.qrCode} className="w-full aspect-square mb-2" alt={`Table ${qr.tableNumber} QR code`} />
                  <p className="text-xs text-gray-500 text-center">Table {qr.tableNumber}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Download button with loading state */}
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className={`w-full py-5 rounded-xl text-lg font-medium mb-6 flex items-center justify-center gap-3 transition-all ${
              downloading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-black hover:bg-gray-800 text-white'
            }`}
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PDF Kit
              </>
            )}
          </button>

          {/* Great Lakes branding */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-gray-400">Built with</span>
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
          disabled={tableCount === 0}
          className={`w-full py-16 rounded-xl border-2 border-dashed transition-all text-center ${
            tableCount === 0
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
              : 'bg-gray-50 border-gray-300 hover:border-black'
          }`}
        >
          <QrCode className={`w-12 h-12 mx-auto mb-3 ${
            tableCount === 0 ? 'text-gray-300' : 'text-gray-400'
          }`} />
          <p className={`text-lg mb-1 ${
            tableCount === 0 ? 'text-gray-400' : 'text-gray-700'
          }`}>
            Generate QR codes
          </p>
          <p className="text-sm text-gray-500">
            {tableCount === 0
              ? 'No tables configured yet'
              : `Create unique codes for ${tableCount} tables`
            }
          </p>
        </button>
      )}
    </div>
  );
}