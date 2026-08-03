import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";


export async function GET() {
  const supabase =
    await createClient();


  const {
    data: { user },
  } =
    await supabase.auth.getUser();


  if (!user) {
    return NextResponse.json({
      authenticated: false,
      banned: false,
    });
  }


  const admin =
    createAdminClient();


  const {
    data: ban,
    error,
  } =
    await admin
      .from("player_bans")
      .select(
        `
          id,
          reason,
          duration,
          expires_at
        `
      )
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "is_active",
        true
      )
      .or(
        `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
      )
      .order(
        "banned_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();


  if (error) {
    console.error(
      "Ban status error:",
      error
    );

    return NextResponse.json(
      {
        authenticated: true,
        banned: false,
      },
      {
        status: 500,
      }
    );
  }


  return NextResponse.json({
    authenticated: true,

    banned: Boolean(ban),

    ban: ban
      ? {
          reason:
            ban.reason,

          duration:
            ban.duration,

          expiresAt:
            ban.expires_at,
        }
      : null,
  });
}