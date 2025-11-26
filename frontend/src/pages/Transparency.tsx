import { useNavigate } from 'react-router-dom';
import { usePageView } from '@/hooks/useActivityLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Transparency() {
  usePageView('Transparency');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                AUM: <span className="font-semibold text-foreground">$40.1M</span>
              </span>
              <Button>Select Wallet</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Transparency Hub</h1>
          <p className="text-muted-foreground">
            Real-time on-chain data and performance metrics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AUM</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">←</Button>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon">→</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg flex items-end p-4">
                  <div className="w-full border-l-2 border-b-2 border-yellow-500 h-48 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                      <polyline
                        points="0,180 50,160 100,140 150,130 200,120 250,100 300,80 350,60 400,40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-yellow-500"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                <span>June</span>
                <span>July</span>
                <span>August</span>
                <span>September</span>
                <span>October</span>
                <span>November</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Price</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">←</Button>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon">→</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg flex items-end p-4">
                  <div className="w-full border-l-2 border-b-2 border-yellow-500 h-48 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                      <polyline
                        points="0,100 50,98 100,95 150,94 200,96 250,97 300,99 350,102 400,105"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-yellow-500"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                <span>June</span>
                <span>July</span>
                <span>August</span>
                <span>September</span>
                <span>October</span>
                <span>November</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Collateral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="40" className="text-muted opacity-20" />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="40"
                      strokeDasharray="502"
                      strokeDashoffset="125"
                      className="text-yellow-500"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="40"
                      strokeDasharray="502"
                      strokeDashoffset="377"
                      className="text-orange-500"
                      transform="rotate(0 100 100)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-lg font-bold">100%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">USDC 39.07%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm">USD 25.76%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-600" />
                  <span className="text-sm">USDC 6.92%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gross Return Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg flex items-end p-4">
                  <div className="w-full border-l-2 border-b-2 border-yellow-500 h-48 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                      <path
                        d="M0,180 Q100,170 200,20 T400,150"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-yellow-500"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                P(x) distribution showing return probability
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
