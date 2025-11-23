
import { User, AdminConfig } from "../types";

const USERS_KEY = 'trends172_users';
const CURRENT_USER_KEY = 'trends172_current_user';
const ADMIN_CONFIG_KEY = 'trends172_admin_config';

const DEFAULT_ADMIN_EMAIL = 'trends.ve@gmail.com';

// Initialize Default Config
export const getAdminConfig = (): AdminConfig => {
  const stored = localStorage.getItem(ADMIN_CONFIG_KEY);
  if (stored) return JSON.parse(stored);
  return {
    whatsappNumber: '15558883245', // Updated Number
    pricePerCredit: 1
  };
};

export const saveAdminConfig = (config: AdminConfig) => {
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
};

// User Management
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = (email: string): User => {
  const users = getUsers();
  const existing = users.find(u => u.email === email);
  if (existing) throw new Error("El usuario ya existe.");

  const isAdmin = email === DEFAULT_ADMIN_EMAIL;
  
  const newUser: User = {
    id: `user-${Date.now()}`,
    email,
    role: isAdmin ? 'admin' : 'user',
    credits: isAdmin ? 99999 : 3, // 3 Free credits for normal users
    createdAt: Date.now()
  };

  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export const loginUser = (email: string): User => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  // Auto-register admin if trying to login first time
  if (!user && email === DEFAULT_ADMIN_EMAIL) {
      return registerUser(email);
  }

  if (!user) throw new Error("Usuario no encontrado.");
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  // Always fetch fresh data from DB
  const sessionUser = JSON.parse(stored);
  const users = getUsers();
  return users.find(u => u.id === sessionUser.id) || null;
};

export const deductCredit = (userId: string): User => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error("User not found");

  // CRITICAL: Admin always bypasses credit check
  // Returns user immediately without deducting anything
  if (users[userIndex].role === 'admin') {
      return users[userIndex];
  }

  // Normal user check
  if (users[userIndex].credits <= 0) throw new Error("Sin créditos suficientes.");
  users[userIndex].credits -= 1;

  saveUsers(users);
  const updatedUser = users[userIndex];
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};

export const addCredits = (userId: string, amount: number) => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return;

  users[userIndex].credits += amount;
  saveUsers(users);
  
  // Update session if it's the current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[userIndex]));
  }
};
