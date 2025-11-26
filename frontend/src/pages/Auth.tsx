import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Home, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import bs58 from 'bs58';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletLoadingStep, setWalletLoadingStep] = useState('');
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { signIn, signUp, signInWithWallet, user } = useAuth();
  const { connectWallet } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      toast({
        title: 'Referral Code Applied',
        description: `Using referral code: ${ref}`,
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateEmail = () => {
    try {
      emailSchema.parse(email);
      setEmailError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.issues[0].message);
      }
      return false;
    }
  };

  const validatePassword = () => {
    try {
      passwordSchema.parse(password);
      setPasswordError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPasswordError(error.issues[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) return;

    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) return;

    setLoading(true);
    const { error } = await signUp(email, password);
    
    if (!error && referralCode) {
      // Apply referral code after signup
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      if (newUser) {
        await supabase.rpc('handle_referral_signup', {
          p_referee_id: newUser.id,
          p_referral_code: referralCode,
        });
      }
    }
    
    setLoading(false);
  };

  const handleWalletAuth = async (type: 'metamask' | 'phantom') => {
    setWalletLoading(true);
    setWalletLoadingStep('Connecting wallet...');
    
    try {
      // Check if wallet is available
      if (type === 'metamask') {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
          throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
        }
      } else if (type === 'phantom') {
        if (!window.solana || !window.solana.isPhantom) {
          throw new Error('Phantom wallet is not installed. Please install Phantom to continue.');
        }
      }

      // Connect wallet
      await connectWallet(type);
      
      // Give it a moment for the wallet to connect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the connected address from the wallet
      let connectedAddress = '';
      if (type === 'metamask' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        connectedAddress = accounts[0];
      } else if (type === 'phantom' && window.solana?.isConnected) {
        connectedAddress = window.solana.publicKey.toString();
      }

      if (!connectedAddress) {
        throw new Error('Failed to connect wallet. Please try again.');
      }

      // Create message to sign
      setWalletLoadingStep('Waiting for signature...');
      const timestamp = Date.now();
      const message = `Sign this message to authenticate with NextBlock Re.\n\nWallet: ${connectedAddress}\nTimestamp: ${timestamp}`;

      let signature = '';
      const chain = type === 'metamask' ? 'base' : 'solana';

      // Request signature
      try {
        if (type === 'metamask' && window.ethereum) {
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, connectedAddress],
          });
        } else if (type === 'phantom' && window.solana) {
          const encodedMessage = new TextEncoder().encode(message);
          const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');
          signature = bs58.encode(signedMessage.signature);
        }
      } catch (signError: any) {
        if (signError.code === 4001 || signError.message?.includes('User rejected')) {
          throw new Error('Signature request rejected. Please approve the signature to continue.');
        }
        throw new Error('Failed to sign message. Please try again.');
      }

      // Authenticate with backend
      setWalletLoadingStep('Authenticating...');
      await signInWithWallet(connectedAddress, signature, message, chain);
      
    } catch (error: any) {
      console.error('Wallet auth error:', error);
      toast({
        title: 'Wallet Authentication Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setWalletLoading(false);
      setWalletLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            NextBlock Re
          </h1>
          <p className="text-muted-foreground">Sign in to access your account</p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    onBlur={validateEmail}
                    disabled={loading}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive mt-1">{emailError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    onBlur={validatePassword}
                    disabled={loading}
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive mt-1">{passwordError}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    onBlur={validateEmail}
                    disabled={loading}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive mt-1">{emailError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    onBlur={validatePassword}
                    disabled={loading}
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive mt-1">{passwordError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="referral-code">
                    Referral Code <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="referral-code"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    disabled={loading}
                  />
                  {referralCode && (
                    <p className="text-xs text-green-500 mt-1">
                      ✓ You'll receive 5% bonus points on your first deposit
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-sm text-muted-foreground">
              Or connect wallet
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowWalletSelect(true)}
            disabled={walletLoading || loading}
          >
            {walletLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {walletLoadingStep}
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </Card>

        <Dialog open={showWalletSelect} onOpenChange={setShowWalletSelect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Your Wallet</DialogTitle>
              <DialogDescription>
                Choose which wallet you want to connect to access NextBlock Re
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => {
                  setShowWalletSelect(false);
                  handleWalletAuth('metamask');
                }}
                disabled={walletLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">MetaMask</div>
                    <div className="text-sm text-muted-foreground">Connect with Base network</div>
                  </div>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => {
                  setShowWalletSelect(false);
                  handleWalletAuth('phantom');
                }}
                disabled={walletLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Phantom</div>
                    <div className="text-sm text-muted-foreground">Connect with Solana network</div>
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>


        <div className="text-center mt-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
