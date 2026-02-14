import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
export function BrandGuide() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-light">drift brand guide</h1>
        
        {/* Colors */}
        <Card title="Colors">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-20 bg-black rounded-xl"></div>
              <p className="text-sm">Black #000000</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-white border rounded-xl"></div>
              <p className="text-sm">White #FFFFFF</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-blue-500 rounded-xl"></div>
              <p className="text-sm">Blue #3B82F6</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-green-500 rounded-xl"></div>
              <p className="text-sm">Green #10B981</p>
            </div>
          </div>
        </Card>

        {/* Buttons */}
        <Card title="Buttons">
          <div className="space-y-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="text">Text Button</Button>
          </div>
        </Card>

        {/* Badges */}
        <Card title="Badges">
          <div className="flex gap-2">
            <Badge variant="pending">pending</Badge>
            <Badge variant="preparing">preparing</Badge>
            <Badge variant="ready">ready</Badge>
            <Badge variant="served">served</Badge>
          </div>
        </Card>

        {/* Typography */}
        <Card title="Typography">
          <div className="space-y-2">
            <p className="text-8xl font-light">60px Light</p>
            <p className="text-4xl font-medium">36px Medium</p>
            <p className="text-xl font-normal">24px Regular</p>
            <p className="text-base font-normal">16px Base</p>
            <p className="text-sm text-gray-400">14px Secondary</p>
          </div>
        </Card>
      </div>
    </div>
  );
}