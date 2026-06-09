import type { User } from "@/types/user";

export const useCurrentUser = () => useState<User>('currentUser', () => {
  return {
    isLoggedIn: false,

  }
})
