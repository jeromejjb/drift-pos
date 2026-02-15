import { useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

interface TablesStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function TablesStep({ restaurantId, data, updateData, onNext, onPrev }: TablesStepProps) {
  const [tables, setTables] = useState(data.tables || [
    { id: '1', number: 1 },
    { id: '2', number: 2 },
    { id: '3', number: 3 },
    { id: '4', number: 4 },
    { id: '5', number: 5 },
  ]);

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
    updateData({ tables });
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">Set up your tables</h2>
        <p className="text-gray-400">Add all the tables in your restaurant</p>
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
          Continue
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}