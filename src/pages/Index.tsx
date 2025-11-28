import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Ship, Coins, Map, Shield, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SwapInterface from "@/components/SwapInterface";
import { useWalletVenetian } from "@/contexts/WalletContext";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const [isVisible, setIsVisible] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { isConnected, connectWallet } = useWalletVenetian();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  // Navigate to dashboard when wallet connects
  useEffect(() => {
    if (isConnecting && isConnected) {
      navigate("/dashboard");
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, navigate]);

  useEffect(() => {
    setIsVisible(true);

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-animate').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-accent" />
              <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                NEXTBLOCK
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#product" className="text-sm font-medium hover:text-primary transition-colors">
                Prodotto
              </a>
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Caratteristiche
              </a>
              <a href="#heritage" className="text-sm font-medium hover:text-primary transition-colors">
                Storia
              </a>
              <Button variant="default" className="bg-primary hover:bg-primary/90" onClick={handleGetStarted}>
                Inizia Ora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Inspired by Perena */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{
          background: 'linear-gradient(135deg, oklch(0.98 0.005 60) 0%, oklch(0.95 0.02 180) 100%)'
        }}
      >
        {/* Background decorative pattern */}
        <div className="absolute inset-0 venetian-pattern opacity-30"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-block px-4 py-2 bg-secondary/10 rounded-full border border-secondary/20">
                <span className="text-sm font-medium text-secondary">
                  Dalle origini veneziane dell'assicurazione
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-tight text-foreground">
                Tokenizza il Futuro dell'Assicurazione
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Una piattaforma programmabile e utility-driven per la tokenizzazione di portafogli assicurativi, 
                progettata per l'accumulo nativo di valore e l'integrazione seamless nel DeFi.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground group"
                  onClick={handleGetStarted}
                >
                  {isConnected ? (
                    <>
                      Vai alla Dashboard
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 w-4 h-4" />
                      Connetti Wallet
                    </>
                  )}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  Scopri di Più
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  Supportato dalle migliori istituzioni
                </p>
                <div className="flex items-center gap-6 opacity-60">
                  <span className="text-xs font-semibold tracking-wider">ETHEREUM</span>
                  <span className="text-xs font-semibold tracking-wider">BASE</span>
                  <span className="text-xs font-semibold tracking-wider">ARBITRUM</span>
                  <span className="text-xs font-semibold tracking-wider">OPTIMISM</span>
                </div>
              </div>
            </div>

            {/* Right: 3D Coin Hero Image */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="relative">
                <img 
                  src="/venetian-coin-hero.png" 
                  alt="Venetian Gold Ducat" 
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
                {/* Floating accent elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Swap Section - Interactive */}
      <section id="product" className="py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, oklch(0.45 0.08 180 / 0.05) 0%, oklch(0.35 0.08 240 / 0.08) 100%)'
          }}
        ></div>
        <div className="absolute inset-0 venetian-pattern opacity-20 z-0"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Swap Interface */}
            <div className="scroll-animate order-2 lg:order-1">
              <SwapInterface />
            </div>

            {/* Right: Description */}
            <div className="scroll-animate order-1 lg:order-2">
              <div className="inline-block px-4 py-2 bg-secondary/10 rounded-full border border-secondary/20 mb-6">
                <span className="text-sm font-medium text-secondary">
                  Numéraire Protocol
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                AMM Ottimizzato per Token Assicurativi
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Sperimenta integrazione seamless, tassi migliori e liquidità più profonda. 
                Alimentato dal valore aggregato dei portafogli assicurativi tokenizzati.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Liquidità Profonda</h4>
                    <p className="text-muted-foreground text-sm">
                      Pool aggregati da protocolli multipli per garantire sempre il miglior prezzo
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Slippage Minimale</h4>
                    <p className="text-muted-foreground text-sm">
                      Algoritmo ottimizzato per ridurre lo slippage anche su volumi elevati
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Fee Competitive</h4>
                    <p className="text-muted-foreground text-sm">
                      Commissioni ridotte grazie all'efficienza del protocollo NextBlock
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Card Grid */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Integrazione Seamless, Rendimenti Migliori
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              e liquidità più profonda per i portafogli assicurativi tokenizzati
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <Card className="scroll-animate p-8 bg-card hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Ship className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Accumulo Utility-Driven</h3>
                <p className="text-muted-foreground leading-relaxed">
                  I token NXB catturano valore dall'attività del protocollo. I possessori beneficiano 
                  di integrazioni native e partecipazione alla rete.
                </p>
              </div>
              {/* Decorative engraving pattern */}
              <img 
                src="/merchant-ship-3d.png" 
                alt="Merchant Ship" 
                className="absolute bottom-0 right-0 w-32 h-32 opacity-10 object-cover"
              />
            </Card>

            {/* Feature Card 2 */}
            <Card className="scroll-animate p-8 bg-card hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Composabilità & Integrazione</h3>
                <p className="text-muted-foreground leading-relaxed">
                  I token sono nativamente accettati in pool di liquidità, vault e strategie DeFi. 
                  Benefici potenziati quando utilizzi NXB attraverso piattaforme integrate.
                </p>
              </div>
              <img 
                src="/treasure-chest-gold.png" 
                alt="Treasure Chest" 
                className="absolute bottom-0 right-0 w-32 h-32 opacity-10 object-cover"
              />
            </Card>

            {/* Feature Card 3 */}
            <Card className="scroll-animate p-8 bg-card hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Map className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Loop di Valore Community-Driven</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Più protocolli utilizzano NXB, più ricompense la rete può distribuire. 
                  Un ecosistema che cresce con la partecipazione.
                </p>
              </div>
              <img 
                src="/antique-map-compass.png" 
                alt="Navigation Map" 
                className="absolute bottom-0 right-0 w-32 h-32 opacity-10 object-cover"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Heritage Section - Venetian Merchants */}
      <section id="heritage" className="py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(to bottom, oklch(0.98 0.005 60), oklch(0.25 0.04 240))'
          }}
        ></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="scroll-animate">
              <img 
                src="/venetian-merchant-abstract.png" 
                alt="Venetian Merchants Heritage" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>

            <div className="scroll-animate text-white">
              <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                <span className="text-sm font-medium">
                  Dalle origini a Venezia
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                L'Eredità dei Mercanti Veneziani
              </h2>
              
              <p className="text-lg text-white/80 leading-relaxed mb-6">
                Nel XV secolo, i mercanti veneziani inventarono le prime forme di assicurazione marittima 
                per proteggere le loro navi cariche di spezie, seta e oro. Oggi, NextBlock porta questa 
                tradizione nell'era blockchain, tokenizzando portafogli assicurativi con la stessa 
                innovazione che rese Venezia la capitale finanziaria del mondo.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Sicurezza Istituzionale</h4>
                    <p className="text-white/70 text-sm">
                      Backed by diversified baskets of battle-tested stablecoins and RWA
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Liquidità Aggregata</h4>
                    <p className="text-white/70 text-sm">
                      Unified liquidity layer across protocols for deep, stable markets
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Casi d'Uso Reali</h4>
                    <p className="text-white/70 text-sm">
                      Beyond trades—powering value storage, yield, and liquidity across DeFi
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="mt-8 bg-white text-primary hover:bg-white/90"
              >
                Scopri la Storia Completa
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center scroll-animate">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto a Tokenizzare il Futuro?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Unisciti alla rivoluzione della tokenizzazione assicurativa. 
            Inizia oggi con NextBlock.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90"
              onClick={handleGetStarted}
            >
              Inizia Ora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Contatta il Team
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-6 h-6 text-accent" />
                <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  NEXTBLOCK
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tokenizzazione assicurativa per l'era blockchain.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Piattaforma</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Token NXB</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentazione</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Risorse</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Whitepaper</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Telegram</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 NextBlock. Dall'eredità veneziana alla blockchain del futuro.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
