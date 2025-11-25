// src/components/Icons.tsx
import type { LucideIcon } from 'lucide-react';
import { LogIn, UserPlus, User, LogOut, Settings } from 'lucide-react';

export const Icons: Record<string, LucideIcon> = {
  login: LogIn,
  register: UserPlus,
  profile: User,
  logout: LogOut,
  settings: Settings,
};
