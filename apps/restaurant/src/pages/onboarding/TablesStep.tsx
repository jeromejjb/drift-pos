import { useState } from 'react';
import { motion } from 'framer-motion';
import { Table2, Plus, Minus, Grid, Hash, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Props {
  restaurantId: string | null;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function TablesStep({ data, updateData, onNext, onPrev }: Props) {
  const [mode, setMode] = useState<'range' | 'list' | 'sections'>(data?.tableMode || 'range');
  const [tableCount, setTableCount] = useState(data?.tableCount || 10);
  const [customTables, setCustomTables] = useState(data?.customTables || '');
  const [tables, setTables] = useState<number[]>(data?.tables || []);

  const generateTables = () => {
    let newTables: number[] = [];
    
    if (mode === 'range') {
      newTables = Array.from({ length: tableCount }, (_, i) => i + 1);
    } else if (mode === 'list') {
      newTables = customTables
        .split(',')
        .map((n: string) => parseInt(n.trim()))
        .filter((n: number) => !isNaN(n))
        .sort((a: number, b: number) => a - b);
    }
    
    setTables(newTables);
    updateData({ tables: newTables, tableMode: mode, tableCount, customTables });
  };

  const handleContinue = () => {
    if (tables.length > 0) {
      updateData({ tables, tableMode: mode });
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Table2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Set up your tables</h2>
        <p className="text-gray-400">How many tables does your restaurant have?</p>
      </div>

      <Card padding="lg">
        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('range')}
            className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
              mode === 'range' 
                ? 'bg-black text-white border-black' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Number Range</span>
          </button>
          <button
            onClick={() => setMode('list')}
            className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
              mode === 'list' 
                ? 'bg-black text-white border-black' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Custom List</span>
          </button>
        </div>

        {/* Input Area */}
        {mode === 'range' && (
          <div className="mb-6">
            <label className="text-sm text-gray-500 mb-2 block">
              Number of tables
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:border-black"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={tableCount}
                onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
                className="flex-1 text-center py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                min="1"
                max="100"
              />
              <button
                onClick={() => setTableCount(Math.min(100, tableCount + 1))}
                className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:border-black"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {mode === 'list' && (
          <div className="mb-6">
            <label className="text-sm text-gray-500 mb-2 block">
              Enter table numbers (comma separated)
            </label>
            <input
              type="text"
              value={customTables}
              onChange={(e) => setCustomTables(e.target.value)}
              placeholder="1, 2, 3, 5, 8, 10, A1, B2"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
            />
            <p className="text-xs text-gray-400 mt-2">
              Include letters for sections (e.g., A1, B2, P1 for patio)
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateTables}
          className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors mb-6"
        >
          Generate Tables
        </button>

        {/* Table Preview */}
        {tables.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-medium mb-3">Preview ({tables.length} tables)</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {tables.slice(0, 10).map((num) => (
                <div
                  key={num}
                  className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-sm font-medium"
                >
                  {num}
                </div>
              ))}
              {tables.length > 10 && (
                <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-sm text-gray-400">
                  +{tables.length - 10}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onPrev} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={tables.length === 0}
            className="flex-1"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}