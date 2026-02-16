import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  QrCode, 
  Download, 
  Printer, 
  Plus, 
  Search,
  Circle,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Table {
  id: string;
  number: number;
  qrCode: string;
  status?: 'available' | 'occupied' | 'reserved';
}

export function TablesPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all');

  // Use environment variable for API URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';

  // Get auth token
  const getToken = () => {
    const token = localStorage.getItem('drift-token');
    if (!token) {
      // Redirect to landing login if no token
      window.location.href = 'https://drift-landing.onrender.com/login';
      return null;
    }
    return token;
  };

  useEffect(() => {
    fetchTables();
  }, [restaurantId]);

  const fetchTables = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}/tables`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('drift-token');
        localStorage.removeItem('drift-restaurant-id');
        window.location.href = 'https://drift-landing.onrender.com/login';
        return;
      }

      const data = await response.json();
      
      // Add mock status for now (you can replace with real status from API later)
      const tablesWithStatus = data.map((table: any, index: number) => ({
        ...table,
        status: index % 3 === 0 ? 'occupied' : index % 3 === 1 ? 'reserved' : 'available'
      }));
      
      setTables(tablesWithStatus);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (table: Table) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/table/${table.id}/qrcode`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('drift-token');
        localStorage.removeItem('drift-restaurant-id');
        window.location.href = 'https://drift-landing.onrender.com/login';
        return;
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSelectedTable(table);
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const downloadQRCode = async () => {
    if (!selectedTable) return;
    
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/table/${selectedTable.id}/qrcode/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('drift-token');
        localStorage.removeItem('drift-restaurant-id');
        window.location.href = 'https://drift-landing.onrender.com/login';
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table-${selectedTable.number}.png`;
      a.click();
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const printQRCode = () => {
    if (!selectedTable) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Table ${selectedTable.number} QR Code</title>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container { text-align: center; }
            img { width: 300px; height: 300px; }
            h2 { margin-bottom: 0; }
            p { color: #666; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Table ${selectedTable.number}</h2>
            <img src="${qrCode}" />
            <p>Scan to order with Drift</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusIcon = (status?: string) => {
    switch(status) {
      case 'occupied': return <Circle className="w-3 h-3 text-blue-500 fill-blue-500" />;
      case 'reserved': return <Circle className="w-3 h-3 text-purple-500 fill-purple-500" />;
      default: return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch(status) {
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      default: return 'Available';
    }
  };

  const filteredTables = tables.filter(table => {
    // Apply status filter
    if (statusFilter !== 'all' && table.status !== statusFilter) return false;
    
    // Apply search
    if (search) {
      return table.number.toString().includes(search);
    }
    return true;
  });

  const statusCounts = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  if (loading) {
    return (
      <Layout title="Tables">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tables...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tables">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border transition-colors ${
            statusFilter === 'all' 
              ? 'bg-black text-white border-black' 
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <p className="text-lg font-light">{tables.length}</p>
          <p className="text-xs">Total</p>
        </button>
        <button
          onClick={() => setStatusFilter('available')}
          className={`p-3 rounded-xl border transition-colors ${
            statusFilter === 'available' 
              ? 'bg-green-600 text-white border-green-600' 
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <p className="text-lg font-light">{statusCounts.available}</p>
          <p className="text-xs">Available</p>
        </button>
        <button
          onClick={() => setStatusFilter('occupied')}
          className={`p-3 rounded-xl border transition-colors ${
            statusFilter === 'occupied' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <p className="text-lg font-light">{statusCounts.occupied}</p>
          <p className="text-xs">Occupied</p>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search table number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Add Table Button */}
      <Button fullWidth size="lg" icon={<Plus className="w-4 h-4" />} className="mb-4">
        Add New Table
      </Button>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredTables.map((table) => (
          <Card
            key={table.id}
            padding="md"
            className="hover:border-black transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl font-light">{table.number}</span>
              <div className="flex items-center gap-1 text-xs">
                {getStatusIcon(table.status)}
                <span className="text-gray-500">{getStatusLabel(table.status)}</span>
              </div>
            </div>
            
            <button
              onClick={() => generateQRCode(table)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg hover:border-black transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span className="text-sm">Get QR</span>
            </button>
          </Card>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card padding="lg" className="max-w-sm w-full">
            <h3 className="text-xl font-light mb-1">Table {selectedTable.number}</h3>
            <p className="text-sm text-gray-400 mb-4">QR Code</p>
            
            <div className="bg-gray-50 p-6 rounded-xl flex justify-center mb-4">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={downloadQRCode}
                className="flex-1 bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-gray-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button 
                onClick={printQRCode}
                className="flex-1 bg-white border border-gray-200 py-3 rounded-lg flex items-center justify-center gap-2 text-sm hover:border-black transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full mt-3 text-gray-400 hover:text-gray-600 py-2 text-sm"
            >
              Close
            </button>
          </Card>
        </div>
      )}
    </Layout>
  );
}