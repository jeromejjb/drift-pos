import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Link, Sparkles, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Props {
  restaurantId: string | null;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function MenuImportStep({ data, updateData, onNext, onPrev }: Props) {
  const [importMethod, setImportMethod] = useState<'photo' | 'pdf' | 'url' | 'template' | null>(data?.importMethod || null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const methods = [
    {
      id: 'photo',
      icon: Camera,
      title: 'Take a photo',
      description: 'Snap a picture of your menu',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'pdf',
      icon: FileText,
      title: 'Upload PDF',
      description: 'Drag & drop your digital menu',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'url',
      icon: Link,
      title: 'Website URL',
      description: 'Enter your restaurant website',
      color: 'bg-green-50 text-green-600',
    },
    {
      id: 'template',
      icon: Sparkles,
      title: 'Use template',
      description: 'Start with a cuisine template',
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  const handleImport = async () => {
    setImporting(true);
    
    // Simulate import progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Mock imported menu data
    const mockMenu = {
      categories: [
        {
          id: '1',
          name: 'Antipasti',
          items: [
            { id: '1', name: 'Arancini', description: 'Crispy rice balls with mozzarella', price: 12, isShared: true },
            { id: '2', name: 'Calamari', description: 'Fried squid with marinara', price: 14, isShared: true },
          ]
        },
        {
          id: '2',
          name: 'Pizza',
          items: [
            { id: '3', name: 'Margherita', description: 'Tomato, mozzarella, basil', price: 18, isShared: true },
            { id: '4', name: 'Diavola', description: 'Spicy salami', price: 20, isShared: true },
          ]
        }
      ]
    };
    
    updateData({ 
      importMethod, 
      menu: mockMenu,
      importedAt: new Date().toISOString() 
    });
    
    setImporting(false);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Import your menu</h2>
        <p className="text-gray-400">The fastest way to get started</p>
      </div>

      {!importMethod ? (
        // Method Selection
        <div className="grid grid-cols-2 gap-4">
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setImportMethod(method.id as any)}
                className="group relative"
              >
                <Card padding="lg" className="h-full hover:border-black transition-all text-left">
                  <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium mb-1">{method.title}</h3>
                  <p className="text-sm text-gray-400">{method.description}</p>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        // Import Progress
        <Card padding="xl" className="text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {importMethod === 'photo' && <Camera className="w-8 h-8 text-blue-600" />}
              {importMethod === 'pdf' && <FileText className="w-8 h-8 text-purple-600" />}
              {importMethod === 'url' && <Link className="w-8 h-8 text-green-600" />}
              {importMethod === 'template' && <Sparkles className="w-8 h-8 text-orange-600" />}
            </div>
            <h3 className="text-xl font-light mb-2">
              {importMethod === 'photo' && 'Taking photo...'}
              {importMethod === 'pdf' && 'Uploading PDF...'}
              {importMethod === 'url' && 'Fetching website...'}
              {importMethod === 'template' && 'Loading template...'}
            </h3>
            <p className="text-gray-400">Our AI is reading your menu</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
            <motion.div
              className="bg-black h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Preview */}
          {progress === 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-100 rounded-xl p-4 mb-8"
            >
              <p className="text-green-700">✨ Found 12 items across 3 categories!</p>
            </motion.div>
          )}

          <Button
            onClick={handleImport}
            disabled={importing && progress < 100}
            size="lg"
            fullWidth
          >
            {progress === 100 ? 'Continue to Review' : 'Processing...'}
          </Button>

          <button
            onClick={() => setImportMethod(null)}
            className="mt-4 text-sm text-gray-400 hover:text-black"
          >
            Choose a different method
          </button>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" onClick={onPrev} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {!importMethod && (
          <Button onClick={() => setImportMethod('template')} className="flex-1">
            Skip for now
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}