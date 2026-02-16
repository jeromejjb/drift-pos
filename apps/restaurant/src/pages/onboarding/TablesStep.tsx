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
  // Initialize tables from props or create default 5 ONLY if no data exists
  const [tables, setTables] = useState(() => {
    // If data.tables exists and has items, use it
    if (data.tables && Array.isArray(data.tables) && data.tables.length > 0) {
      return data.tables;
    }
    
    // If there's a tableCount in data (from previous selection), use that
    if (data.tableCount && typeof data.tableCount === 'number') {
      return Array.from({ length: data.tableCount }, (_, i) => ({
        id: `table-${i + 1}-${Date.now()}`,
        number: i + 1
      }));
    }
    
    // If there's a tables array in localStorage (from previous steps), check that
    const stored = localStorage.getItem('drift_onboarding');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.tables && Array.isArray(parsed.tables) && parsed.tables.length > 0) {
        return parsed.tables;
      }
      if (parsed.tableCount && typeof parsed.tableCount === 'number') {
        return Array.from({ length: parsed.tableCount }, (_, i) => ({
          id: `table-${i + 1}-${Date.now()}`,
          number: i + 1
        }));
      }
    }
    
    // Default to 5 tables ONLY if absolutely nothing exists
    return [
      { id: '1', number: 1 },
      { id: '2', number: 2 },
      { id: '3', number: 3 },
      { id: '4', number: 4 },
      { id: '5', number: 5 },
    ];
  });

  // Save to localStorage whenever tables change
  useEffect(() => {
    const stored = localStorage.getItem('drift_onboarding');
    const parsed = stored ? JSON.parse(stored) : {};
    localStorage.setItem('drift_onboarding', JSON.stringify({
      ...parsed,
      tables: tables
    }));
  }, [tables]);

  const addTable = () => {
    const newNumber = tables.length + 1;
    setTables([...tables, { id: Date.now().toString(), number: newNumber }]);
  };

  const removeTable = (id: string) => {
    if (tables.length > 1) {
      const updatedTables = tables.filter(t => t.id !== id);
      // Renumber tables
      const renumbered = updatedTables.map((table, index) => ({
        ...table,
        number: index + 1
      }));
      setTables(renumbered);
    }
  };

  const handleContinue = () => {
    // Save to parent and localStorage
    updateData({ tables });
    
    // Also save to localStorage with full context
    const stored = localStorage.getItem('drift_onboarding');
    const parsed = stored ? JSON.parse(stored) : {};
    localStorage.setItem('drift_onboarding', JSON.stringify({
      ...parsed,
      tables: tables,
      tableCount: tables.length
    }));
    
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">Set up your tables</h2>
        <p className="text-gray-400">Add all the tables in your restaurant</p>
        {data.tableCount && (
          <p className="text-sm text-blue-600 mt-2">
            You previously set up {data.tableCount} tables
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
                className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
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