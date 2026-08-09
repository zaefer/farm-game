"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";


function goToError(
  message: string
): never {
  redirect(
    `/admin/wipe?error=${encodeURIComponent(
      message
    )}`
  );
}


export async function startNewSeason(
  formData: FormData
) {
  const newSeasonName =
    String(
      formData.get(
        "newSeasonName"
      ) ?? ""
    ).trim();


  const confirmation =
    String(
      formData.get(
        "confirmation"
      ) ?? ""
    ).trim();


  // =====================================================
  // BASIC VALIDATION
  // =====================================================

  if (
    newSeasonName.length < 3 ||
    newSeasonName.length > 60
  ) {
    goToError(
      "Season name must be between 3 and 60 characters."
    );
  }


  const expectedConfirmation =
    `START ${newSeasonName.toUpperCase()}`;


  if (
    confirmation.toUpperCase() !==
    expectedConfirmation
  ) {
    goToError(
      `Please type: ${expectedConfirmation}`
    );
  }


  // =====================================================
  // CURRENT ADMIN SESSION
  // =====================================================

  const supabase =
    await createClient();


  const {
    data: {
      user,
    },

    error:
      userError,
  } =
    await supabase
      .auth
      .getUser();


  if (
    userError ||
    !user
  ) {
    redirect("/login");
  }


  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();


  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    redirect("/");
  }


  // =====================================================
  // MANUAL WIPE RPC
  // =====================================================

  const {
    error,
  } =
    await supabase.rpc(
      "start_new_season",
      {
        p_name:
          newSeasonName,
      }
    );


  if (error) {
    console.error(
      "Start new season error:",
      error
    );


    if (
      error.message.includes(
        "SEASON_NAME_ALREADY_EXISTS"
      )
    ) {
      goToError(
        "A season with this name already exists."
      );
    }


    if (
      error.message.includes(
        "NO_ACTIVE_SEASON_FOUND"
      )
    ) {
      goToError(
        "No active season could be found."
      );
    }


    if (
      error.message.includes(
        "MULTIPLE_ACTIVE_SEASONS_FOUND"
      )
    ) {
      goToError(
        "More than one active season was found. Wipe was cancelled."
      );
    }


    goToError(
      error.message
    );
  }


  // =====================================================
  // REFRESH PAGES
  // =====================================================

  revalidatePath("/");
  revalidatePath("/storage");
  revalidatePath("/market");

  revalidatePath("/admin");
  revalidatePath("/admin/players");
  revalidatePath("/admin/seasons");
  revalidatePath("/admin/wipe");
  revalidatePath("/admin/logs");


  redirect(
    `/admin/wipe?success=${encodeURIComponent(
      `${newSeasonName} started successfully.`
    )}`
  );
}