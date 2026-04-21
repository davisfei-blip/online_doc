import React, { createContext, useContext, useEffect, useState } from 'react';

// 为了兼容原有的类型，使用一个简单的 mock User 接口
interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中是否有登录状态
    const savedUser = localStorage.getItem('local_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (password: string) => {
    if (password === '123321') {
      const mockUser = { id: 'local-user-id', email: 'admin@local' };
      setUser(mockUser);
      localStorage.setItem('local_user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('local_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
