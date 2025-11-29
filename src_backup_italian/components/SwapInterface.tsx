import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownUp, Settings2, Info, CircleDollarSign, Coins as CoinsIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface Token {
  symbol: string;
  name: string;
  balance: number;
}

const tokens: Token[] = [
  { symbol: "NXB", name: "NextBlock Token", balance: 1250.50 },
  { symbol: "USDC", name: "USD Coin", balance: 5000.00 },
  { symbol: "USDT", name: "Tether USD", balance: 3200.00 },
  { symbol: "DAI", name: "Dai Stablecoin", balance: 2100.00 },
];

const getTokenIcon = (symbol: string) => {
  switch (symbol) {
    case "NXB":
      return <CoinsIcon className="w-4 h-4" />;
    case "USDC":
    case "USDT":
    case "DAI":
      return <CircleDollarSign className="w-4 h-4" />;
    default:
      return <CoinsIcon className="w-4 h-4" />;
  }
};

// Simulated exchange rates (NXB base)
const exchangeRates: Record<string, number> = {
  "NXB-USDC": 2.45,
  "NXB-USDT": 2.44,
  "NXB-DAI": 2.46,
  "USDC-NXB": 0.408,
  "USDT-NXB": 0.410,
  "DAI-NXB": 0.407,
  "USDC-USDT": 1.00,
  "USDC-DAI": 0.999,
  "USDT-USDC": 1.00,
  "USDT-DAI": 0.999,
  "DAI-USDC": 1.001,
  "DAI-USDT": 1.001,
};

export default function SwapInterface() {
  const [fromToken, setFromToken] = useState<string>("USDC");
  const [toToken, setToToken] = useState<string>("NXB");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Calculate conversion
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const rate = exchangeRates[`${fromToken}-${toToken}`] || 1;
      const calculated = (parseFloat(fromAmount) * rate).toFixed(6);
      setToAmount(calculated);
    } else {
      setToAmount("");
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleMaxClick = () => {
    const token = tokens.find(t => t.symbol === fromToken);
    if (token) {
      setFromAmount(token.balance.toString());
    }
  };

  const getTokenBySymbol = (symbol: string) => {
    return tokens.find(t => t.symbol === symbol);
  };

  const rate = exchangeRates[`${fromToken}-${toToken}`] || 1;
  const fromTokenData = getTokenBySymbol(fromToken);
  const toTokenData = getTokenBySymbol(toToken);

  return (
    <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-border shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Converti</h3>
            <p className="text-sm text-muted-foreground">
              Scambia token istantaneamente
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-muted"
          >
            <Settings2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
            <Label className="text-sm font-medium mb-2 block">
              Slippage Tolerance
            </Label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSlippage(value)}
                  className="flex-1"
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* From Token */}
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Da</Label>
            {fromTokenData && (
              <span className="text-xs text-muted-foreground">
                Disponibile: {fromTokenData.balance.toFixed(2)} {fromToken}
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="pr-32 h-14 text-lg font-medium"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxClick}
                className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary/80"
              >
                MAX
              </Button>
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-28 h-9 border-0 bg-muted hover:bg-muted/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        {getTokenIcon(token.symbol)}
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapTokens}
            className="rounded-full bg-background border-2 border-border hover:bg-muted hover:rotate-180 transition-all duration-300"
          >
            <ArrowDownUp className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">A</Label>
            {toTokenData && (
              <span className="text-xs text-muted-foreground">
                Disponibile: {toTokenData.balance.toFixed(2)} {toToken}
              </span>
            )}
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="pr-32 h-14 text-lg font-medium bg-muted/30"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-28 h-9 border-0 bg-muted hover:bg-muted/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        {getTokenIcon(token.symbol)}
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        {fromAmount && toAmount && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasso di cambio</span>
                  <span className="font-medium">
                    1 {fromToken} = {rate.toFixed(4)} {toToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slippage</span>
                  <span className="font-medium">{slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee di rete</span>
                  <span className="font-medium text-secondary">~$0.15</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50"
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
        >
          {!fromAmount || parseFloat(fromAmount) <= 0
            ? "Inserisci un importo"
            : "Scambia Token"}
        </Button>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Powered by NextBlock Liquidity Protocol
          </p>
        </div>
      </div>
    </Card>
  );
}
