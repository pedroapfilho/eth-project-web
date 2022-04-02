import type { NextPage } from "next";
import useAuth from "../hooks/useAuth";

const Home: NextPage = () => {
  const { login, logout, isAuthenticated, isLoading, user } = useAuth();

  if (isAuthenticated) {
    return (
      <>
        <p>Welcome {user.address}</p>
        <button onClick={() => logout()} disabled={isLoading}>
          logout
        </button>
      </>
    );
  }

  return (
    <>
      <button onClick={() => login("MetaMask")} disabled={isLoading}>
        login with metamask
      </button>
      <button onClick={() => login("WalletConnect")} disabled={isLoading}>
        login with wallet connect
      </button>
    </>
  );
};

export default Home;
