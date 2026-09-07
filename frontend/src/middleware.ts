import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

// Config matching rules for route interception
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
