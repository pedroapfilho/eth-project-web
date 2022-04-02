import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "react-query";
import { SiweMessage } from "siwe";
import { useConnect } from "wagmi";

type WalletConnectProviders = "WalletConnect" | "MetaMask";

const USER_QUERY = "user";

const useAuth = () => {
  const router = useRouter();
  const [{ data: connectData }, connect] = useConnect();
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery<{ address: string }>(
    USER_QUERY,
    async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      const data = await res.json();

      return data;
    },
    { retry: false }
  );

  const queryClient = useQueryClient();

  const login = useCallback(
    async (provider: WalletConnectProviders) => {
      let address, chainId;

      const connector = connectData.connectors.find((c) => c.name === provider);

      if (connectData.connected) {
        address = await connectData.connector.getAccount();
        chainId = await connectData.connector.getChainId();
      } else {
        const { data } = await connect(connector);

        address = data.account;
        chainId = data.chain.id;
      }

      const nonce = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nonce`);

      const message = new SiweMessage({
        address,
        chainId,
        domain: window.location.host,
        nonce: await nonce.text(),
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
      });

      const signer = await connector.getSigner();
      const signature = await signer.signMessage(message.prepareMessage());
      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/verify`,
        {
          body: JSON.stringify({ message, signature }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );
      const verify = await verifyRes.json();

      if (!verify) alert("Signature verification failed");

      await refetch({ cancelRefetch: true });
    },
    [
      connectData.connectors,
      connectData.connected,
      connectData.connector,
      refetch,
      connect,
    ]
  );

  const logout = useCallback(async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
      credentials: "include",
    });

    queryClient.setQueriesData(USER_QUERY, null);
    router.push("/");
  }, [router, queryClient]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async () => {
        await logout();
      });
    }
  }, [logout]);

  const isAuthenticated = useMemo(() => !!user, [user]);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    user,
  };
};

export default useAuth;
