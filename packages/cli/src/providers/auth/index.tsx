import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  loginWithBrowser,
  logout as logoutClient,
  type AuthenticatedUser,
} from "../../lib/auth-client";

export type AuthContextValue = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  login: () => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return value;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setUser(await getCurrentUser());
      } catch (error) {
        console.error("Unable to restore Nightcode session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (): Promise<AuthenticatedUser> => {
    setIsAuthenticating(true);

    try {
      const signedInUser = await loginWithBrowser();
      setUser(signedInUser);
      return signedInUser;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutClient();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticating,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}