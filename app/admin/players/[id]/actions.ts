"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";


type BanOption =
  | "1h"
  | "24h"
  | "3d"
  | "7d"
  | "30d"
  | "permanent";


const BAN_OPTIONS: Record<
  BanOption,
  {
    authDuration: string;
    milliseconds: number | null;
    label: string;
  }
> = {
  "1h": {
    authDuration: "1h",
    milliseconds: 60 * 60 * 1000,
    label: "1 Hour",
  },

  "24h": {
    authDuration: "24h",
    milliseconds: 24 * 60 * 60 * 1000,
    label: "24 Hours",
  },

  "3d": {
    authDuration: "72h",
    milliseconds: 3 * 24 * 60 * 60 * 1000,
    label: "3 Days",
  },

  "7d": {
    authDuration: "168h",
    milliseconds: 7 * 24 * 60 * 60 * 1000,
    label: "7 Days",
  },

  "30d": {
    authDuration: "720h",
    milliseconds: 30 * 24 * 60 * 60 * 1000,
    label: "30 Days",
  },

  permanent: {
    authDuration: "876000h",
    milliseconds: null,
    label: "Permanent",
  },
};


// ======================================================
// ADMIN CHECK
// ======================================================

async function requireAdmin() {
  const supabase =
    await createClient();


  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth.getUser();


  if (
    error ||
    !user
  ) {
    redirect("/login");
  }


  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();


  if (
    !profile ||
    profile.role !== "admin"
  ) {
    redirect("/");
  }


  return user;
}


// ======================================================
// BAN PLAYER
// ======================================================

export async function banPlayer(
  formData: FormData
) {
  const currentAdmin =
    await requireAdmin();


  const targetUserId =
    String(
      formData.get(
        "targetUserId"
      ) ?? ""
    );


  const reason =
    String(
      formData.get(
        "reason"
      ) ?? ""
    ).trim();


  const adminNote =
    String(
      formData.get(
        "adminNote"
      ) ?? ""
    ).trim();


  const duration =
    String(
      formData.get(
        "duration"
      ) ?? ""
    ) as BanOption;


  // ====================================================
  // VALIDATION
  // ====================================================

  if (!targetUserId) {
    redirect(
      "/admin/players"
    );
  }


  if (
    currentAdmin.id ===
    targetUserId
  ) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        "You cannot ban yourself."
      )}`
    );
  }


  if (
    reason.length < 3 ||
    reason.length > 500
  ) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        "Ban reason must be between 3 and 500 characters."
      )}`
    );
  }


  if (
    adminNote.length > 1000
  ) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        "Admin note is too long."
      )}`
    );
  }


  const banConfig =
    BAN_OPTIONS[duration];


  if (!banConfig) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        "Invalid ban duration."
      )}`
    );
  }


  const admin =
    createAdminClient();


  // ====================================================
  // TARGET CHECK
  // ====================================================

  const {
    data: targetProfile,
    error: targetProfileError,
  } =
    await admin
      .from("profiles")
      .select(
        `
          role,
          username
        `
      )
      .eq(
        "id",
        targetUserId
      )
      .single();


  if (
    targetProfileError ||
    !targetProfile
  ) {
    redirect(
      `/admin/players?error=${encodeURIComponent(
        "Player could not be found."
      )}`
    );
  }


  if (
    targetProfile.role ===
    "admin"
  ) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        "Admin accounts cannot be banned from this panel."
      )}`
    );
  }


  // ====================================================
  // SUPABASE AUTH BAN
  // ====================================================

  const {
    error: banError,
  } =
    await admin.auth.admin.updateUserById(
      targetUserId,
      {
        ban_duration:
          banConfig.authDuration,
      }
    );


  if (banError) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        banError.message
      )}`
    );
  }


  // ====================================================
  // CLOSE OLD ACTIVE BAN RECORDS
  // ====================================================

  await admin
    .from("player_bans")
    .update({
      is_active: false,
    })
    .eq(
      "user_id",
      targetUserId
    )
    .eq(
      "is_active",
      true
    );


  // ====================================================
  // EXPIRATION
  // ====================================================

  const expiresAt =
    banConfig.milliseconds ===
    null
      ? null
      : new Date(
          Date.now() +
            banConfig.milliseconds
        ).toISOString();


  // ====================================================
  // BAN HISTORY
  // ====================================================

  const {
    data: createdBan,
    error: banHistoryError,
  } =
    await admin
      .from("player_bans")
      .insert({
        user_id:
          targetUserId,

        admin_id:
          currentAdmin.id,

        reason,

        admin_note:
          adminNote ||
          null,

        duration:
          banConfig.label,

        expires_at:
          expiresAt,

        is_active:
          true,
      })
      .select("id")
      .single();


  // Ban geçmişi oluşamadıysa
  // Auth banını geri al.
  if (banHistoryError) {
    await admin.auth.admin.updateUserById(
      targetUserId,
      {
        ban_duration:
          "none",
      }
    );


    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        "Ban history could not be saved. Ban was rolled back."
      )}`
    );
  }


  // ====================================================
  // ADMIN LOG
  // ====================================================

  const {
    error: adminLogError,
  } =
    await admin
      .from("admin_logs")
      .insert({
        admin_id:
          currentAdmin.id,

        action:
          "BAN_PLAYER",

        target_user_id:
          targetUserId,

        metadata: {
          username:
            targetProfile.username,

          reason,

          duration:
            banConfig.label,

          expires_at:
            expiresAt,

          ban_record_id:
            createdBan.id,

          admin_note:
            adminNote ||
            null,
        },
      });


  if (adminLogError) {
    console.error(
      "Ban admin log error:",
      adminLogError
    );
  }


  // ====================================================
  // REFRESH
  // ====================================================

  revalidatePath(
    `/admin/players/${targetUserId}`
  );

  revalidatePath(
    "/admin/players"
  );

  revalidatePath(
    "/admin/bans"
  );

  revalidatePath(
    "/admin/logs"
  );


  redirect(
    `/admin/players/${targetUserId}?success=${encodeURIComponent(
      `Player banned: ${banConfig.label}`
    )}`
  );
}


// ======================================================
// UNBAN PLAYER
// ======================================================

export async function unbanPlayer(
  formData: FormData
) {
  const currentAdmin =
    await requireAdmin();


  const targetUserId =
    String(
      formData.get(
        "targetUserId"
      ) ?? ""
    );


  if (!targetUserId) {
    redirect(
      "/admin/players"
    );
  }


  const admin =
    createAdminClient();


  // ====================================================
  // TARGET
  // ====================================================

  const {
    data: targetProfile,
    error: targetProfileError,
  } =
    await admin
      .from("profiles")
      .select(
        `
          role,
          username
        `
      )
      .eq(
        "id",
        targetUserId
      )
      .single();


  if (
    targetProfileError ||
    !targetProfile
  ) {
    redirect(
      `/admin/players?error=${encodeURIComponent(
        "Player could not be found."
      )}`
    );
  }


  if (
    targetProfile.role ===
    "admin"
  ) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        "Admin accounts are protected."
      )}`
    );
  }


  // ====================================================
  // FIND CURRENT BAN
  // ====================================================

  const {
    data: activeBan,
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
        targetUserId
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "banned_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();


  // ====================================================
  // AUTH UNBAN
  // ====================================================

  const {
    error: unbanError,
  } =
    await admin.auth.admin.updateUserById(
      targetUserId,
      {
        ban_duration:
          "none",
      }
    );


  if (unbanError) {
    redirect(
      `/admin/players/${targetUserId}?error=${encodeURIComponent(
        unbanError.message
      )}`
    );
  }


  const unbannedAt =
    new Date()
      .toISOString();


  // ====================================================
  // UPDATE BAN HISTORY
  // ====================================================

  const {
    error: historyError,
  } =
    await admin
      .from("player_bans")
      .update({
        is_active:
          false,

        unbanned_at:
          unbannedAt,

        unbanned_by:
          currentAdmin.id,
      })
      .eq(
        "user_id",
        targetUserId
      )
      .eq(
        "is_active",
        true
      );


  if (historyError) {
    console.error(
      "Unban history error:",
      historyError
    );
  }


  // ====================================================
  // ADMIN LOG
  // ====================================================

  const {
    error: adminLogError,
  } =
    await admin
      .from("admin_logs")
      .insert({
        admin_id:
          currentAdmin.id,

        action:
          "UNBAN_PLAYER",

        target_user_id:
          targetUserId,

        metadata: {
          username:
            targetProfile.username,

          previous_ban_id:
            activeBan?.id ??
            null,

          previous_reason:
            activeBan?.reason ??
            null,

          previous_duration:
            activeBan?.duration ??
            null,

          previous_expires_at:
            activeBan?.expires_at ??
            null,

          unbanned_at:
            unbannedAt,
        },
      });


  if (adminLogError) {
    console.error(
      "Unban admin log error:",
      adminLogError
    );
  }


  // ====================================================
  // REFRESH
  // ====================================================

  revalidatePath(
    `/admin/players/${targetUserId}`
  );

  revalidatePath(
    "/admin/players"
  );

  revalidatePath(
    "/admin/bans"
  );

  revalidatePath(
    "/admin/logs"
  );


  redirect(
    `/admin/players/${targetUserId}?success=${encodeURIComponent(
      "Player unbanned successfully."
    )}`
  );
}