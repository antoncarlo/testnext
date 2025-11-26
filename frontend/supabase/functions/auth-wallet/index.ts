import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { ethers } from 'https://esm.sh/ethers@6.13.0';
import nacl from 'https://esm.sh/tweetnacl@1.0.3';
import bs58 from 'https://esm.sh/bs58@5.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
  chain: 'base' | 'solana';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { address, signature, message, chain }: WalletAuthRequest = await req.json();

    console.log(`Authenticating wallet: ${address} on ${chain}`);

    // Verify the signature
    let isValid = false;

    if (chain === 'base') {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
        console.log(`Base signature verification: ${isValid}`);
      } catch (error) {
        console.error('Base signature verification error:', error);
        isValid = false;
      }
    } else if (chain === 'solana') {
      try {
        // Decode the message and signature
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(address);

        // Verify the signature
        isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
        console.log(`Solana signature verification: ${isValid}`);
      } catch (error) {
        console.error('Solana signature verification error:', error);
        isValid = false;
      }
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create email from wallet address
    const email = `${address.toLowerCase()}@wallet.${chain}`;

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let user = existingUsers?.users.find((u) => u.email === email);

    if (!user) {
      // Create new user
      console.log(`Creating new user for ${email}`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          wallet_address: address,
          chain: chain,
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      user = newUser.user;
    } else {
      console.log(`User exists: ${email}`);
    }

    // Create session for the user using recovery token (longer expiration)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      throw sessionError;
    }

    console.log(`✓ Authentication successful for ${address}`);

    return new Response(
      JSON.stringify({
        user: user,
        session: sessionData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Fatal error in auth-wallet:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
