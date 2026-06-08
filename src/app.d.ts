import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

type AuthUser = {
	id: string;
	email: string | null;
};

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{
				session: Session | null;
				user: User | null;
			}>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			authUser: AuthUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
