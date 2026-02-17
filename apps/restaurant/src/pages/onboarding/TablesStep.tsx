import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

interface TablesStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function TablesStep({ restaurantId, data, updateData, onNext, onPrev }: TablesStepProps) {
  // Initialize tables from props or create default based on available data
  const [tables, setTables] = useState(() => {
    console.log('🔍 Initializing TablesStep with data:', {
      hasDataTables: !!data.tables,
      dataTablesLength: data.tables?.length,
      dataTableCount: data.tableCount
    });

    // PRIORITY 1: If data.tables exists and has items, use it (highest priority)
    if (data.tables && Array.isArray(data.tables) && data.tables.length > 0) {
      console.log('📋 Using existing tables from data:', data.tables.length);
      return data.tables;
    }
    
    // PRIORITY 2: Check localStorage for saved tables
    const stored = localStorage.getItem('drift_onboarding');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // First priority in localStorage: existing tables array
        if (parsed.tables && Array.isArray(parsed.tables) && parsed.tables.length > 0) {
          console.log('📋 Using tables from localStorage:', parsed.tables.length);
          return parsed.tables;
        }
        
        // Second priority in localStorage: tableCount
        if (parsed.tableCount && typeof parsed.tableCount === 'number' && parsed.tableCount > 0) {
          console.log('📋 Creating tables from localStorage tableCount:', parsed.tableCount);
          return Array.from({ length: parsed.tableCount }, (_, i) => ({
            id: `table-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            number: i + 1
          }));
        }
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }
    
    // PRIORITY 3: Use tableCount from props data if available
    if (data.tableCount && typeof data.tableCount === 'number' && data.tableCount > 0) {
      console.log('📋 Creating tables from data.tableCount:', data.tableCount);
      return Array.from({ length: data.tableCount }, (_, i) => ({
        id: `table-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number: i + 1
      }));
    }
    
    // LAST RESORT: Default to 5 tables for a complete demo experience
    console.log('📋 No existing data found, defaulting to 5 tables');
    return [
      { id: `table-1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, number: 1 },
      { id: `table-2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, number: 2 },
      { id: `table-3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, number: 3 },
      { id: `table-4-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, number: 4 },
      { id: `table-5-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, number: 5 }
    ];
  });

  // Save to localStorage whenever tables change
  useEffect(() => {
    try {
      const stored = localStorage.getItem('drift_onboarding');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem('drift_onboarding', JSON.stringify({
        ...parsed,
        tables: tables,
        tableCount: tables.length,
        tablesUpdatedAt: new Date().toISOString()
      }));
      console.log('💾 Saved tables to localStorage:', tables.length);
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, [tables]);

  // Update parent data when tables change
  useEffect(() => {
    updateData({ tables, tableCount: tables.length });
  }, [tables, updateData]);

  const addTable = () => {
    const newNumber = tables.length + 1;
    const newTable = { 
      id: `table-${newNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      number: newNumber 
    };
    setTables([...tables, newTable]);
  };

  const removeTable = (id: string) => {
    if (tables.length > 1) {
      const updatedTables = tables.filter(t => t.id !== id);
      // Renumber tables sequentially
      const renumbered = updatedTables.map((table, index) => ({
        ...table,
        number: index + 1,
        // Keep the original id
        id: table.id
      }));
      setTables(renumbered);
    }
  };

  const handleContinue = () => {
    // Final save to parent and localStorage
    updateData({ tables, tableCount: tables.length });
    
    // Save to localStorage with full context
    try {
      const stored = localStorage.getItem('drift_onboarding');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem('drift_onboarding', JSON.stringify({
        ...parsed,
        tables: tables,
        tableCount: tables.length,
        tablesUpdatedAt: new Date().toISOString(),
        tablesConfirmed: true
      }));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
    
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">Set up your tables</h2>
        <p className="text-gray-400">Add all the tables in your restaurant</p>
        {data.tableCount && data.tableCount !== tables.length && (
          <p className="text-sm text-blue-600 mt-2">
            Previously set up: {data.tableCount} tables · Currently: {tables.length} tables
          </p>
        )}
        {data.tableCount && data.tableCount === tables.length && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Continuing with {data.tableCount} tables
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="space-y-3 mb-4">
          {tables.map((table) => (
            <div key={table.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-light">
                {table.number}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Table {table.number}</p>
              </div>
              <button
                onClick={() => removeTable(table.id)}
                disabled={tables.length === 1}
                className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title={tables.length === 1 ? "Cannot remove last table" : "Remove table"}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addTable}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          Continue with {tables.length} {tables.length === 1 ? 'table' : 'tables'}
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}