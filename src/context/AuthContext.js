import { createContext } from 'react';

export const AuthContext = createContext({
  userToken: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});
