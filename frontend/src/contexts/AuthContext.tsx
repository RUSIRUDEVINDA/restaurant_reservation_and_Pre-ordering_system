
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "sonner";
import { User } from "../types";

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user on mount
    const savedUser = localStorage.getItem("aeroxUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("aeroxUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password,
      });
      const userData = response.data.user as User;
      const token = response.data.token as string;
      
      setUser(userData);
      localStorage.setItem("aeroxUser", JSON.stringify(userData));
      localStorage.setItem("aeroxToken", token);
      toast.success("Login successful");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(getErrorMessage(error, "An error occurred during login"));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async ({ name, email, phone, password }: SignupData): Promise<boolean> => {
    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/signup`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      return true;
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(getErrorMessage(error, "An error occurred while creating your account"));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aeroxUser");
    localStorage.removeItem("aeroxToken");
    toast.info("You have been logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
