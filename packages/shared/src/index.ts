export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type UserRoleType = 'OWNER' | 'ADMIN' | 'MEMBER' | 'AE';

export interface UserSession {
  userId: string;
  orgId: string;
  role: UserRoleType;
}
