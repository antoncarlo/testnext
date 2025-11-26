import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, walletAddress?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithWallet: (address: string, signature: string, message: string, chain: 'base' | 'solana') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to log activity
const logUserActivity = async (userId: string, activityType: string, description: string, metadata?: any) => {
  try {
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: activityType,
      description,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, walletAddress?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            wallet_address: walletAddress || 'pending',
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account Already Exists',
            description: 'This email is already registered. Please sign in instead.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign Up Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
        return { error };
      }

      toast({
        title: 'Success!',
        description: 'Account created successfully. Please check your email to confirm.',
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Sign In Failed',
            description: 'Invalid email or password.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign In Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
        return { error };
      }

      // Log login activity
      if (data.user) {
        await logUserActivity(data.user.id, 'login', 'User signed in with email/password', {
          method: 'email',
          email: email,
        });
      }

      toast({
        title: 'Welcome Back!',
        description: 'Successfully signed in.',
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithWallet = async (
    address: string,
    signature: string,
    message: string,
    chain: 'base' | 'solana'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-wallet', {
        body: { address, signature, message, chain },
      });

      if (error) {
        const errorMessage = error.message || 'Authentication service error';
        if (errorMessage.includes('Invalid signature')) {
          throw new Error('Signature verification failed. Please ensure you signed with the correct wallet.');
        }
        throw new Error(errorMessage);
      }

      // The edge function returns a recovery token (longer expiration)
      if (data?.session?.properties?.hashed_token) {
        const email = `${address.toLowerCase()}@wallet.${chain}`;
        const { data: sessionData, error: signInError } = await supabase.auth.verifyOtp({
          email,
          token: data.session.properties.hashed_token,
          type: 'recovery',
        });

        if (signInError) {
          if (signInError.message.includes('token has expired')) {
            throw new Error('Authentication token expired. Please try connecting your wallet again.');
          }
          throw new Error(signInError.message);
        }

        // Log wallet login activity
        if (sessionData.user) {
          await logUserActivity(sessionData.user.id, 'login', 'User signed in with wallet', {
            method: 'wallet',
            chain: chain,
            wallet_type: chain === 'base' ? 'metamask' : 'phantom',
            address: address,
          });
        }

        toast({
          title: 'Welcome!',
          description: 'Successfully authenticated with your wallet.',
        });
        return { error: null };
      }

      throw new Error('Invalid authentication response. Please try again.');
    } catch (error: any) {
      // Don't show toast here - let the calling function handle it
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const userId = user?.id;
      
      await supabase.auth.signOut();
      
      // Log logout activity
      if (userId) {
        await logUserActivity(userId, 'logout', 'User signed out');
      }

      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Sign Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signInWithWallet, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
