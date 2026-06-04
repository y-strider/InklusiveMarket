/* New-Item -ItemType File -Force -Path apps/web/src/server/session.ts add session helper for role/user retrieval */

import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin";
};

const sessionOptions = {
  password: process.env.SESSION_PASSWORD || "change_this_password_in_env",
  cookieName: "inklusive_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production"
  }
};

export async function getSessionUser(req: NextApiRequest, res: NextApiResponse): Promise<SessionUser | null> {
  try {
    // @ts-ignore
    const session = await getIronSession(req, res, sessionOptions);
    const u = session.user as SessionUser | undefined;
    if (!u) return null;
    return u;
  } catch {
    return null;
  }
}
