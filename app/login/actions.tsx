"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBanToken } from "@/lib/ban-token";

// ======================================================
// LOGIN
// ======================================================

export async function login(
  formData: FormData
) {
  const email = String(
    formData.get("email") ?? ""
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? ""
  );

  if (!email || !password) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Please enter your email and password."
        )
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  // ====================================================
  // LOGIN FAILED
  // ====================================================

  if (error) {
    const errorCode = (
      error as {
        code?: string;
      }
    ).code;

    // --------------------------------------------------
    // BANNED
    // --------------------------------------------------

    if (errorCode === "user_banned") {
      const admin = createAdminClient();

      const {
        data: usersData,
        error: usersError,
      } =
        await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (!usersError) {
        const bannedUser =
          usersData.users.find(
            (user) =>
              user.email?.toLowerCase() ===
              email
          );

        if (bannedUser) {
          const token =
            createBanToken(
              bannedUser.id
            );

          redirect(
            `/banned?token=${encodeURIComponent(
              token
            )}`
          );
        }
      }

      redirect(
        "/login?error=" +
          encodeURIComponent(
            "Your account is currently suspended."
          )
      );
    }

    // --------------------------------------------------
    // WRONG LOGIN
    // --------------------------------------------------

    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Email or password is incorrect."
        )
    );
  }

  redirect("/");
}

// ======================================================
// SIGN UP
// ======================================================

export async function signup(
  formData: FormData
) {
  const username = String(
    formData.get("username") ?? ""
  )
    .trim()
    .toLowerCase();

  const email = String(
    formData.get("email") ?? ""
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? ""
  );

  // ====================================================
  // USERNAME VALIDATION
  // ====================================================

  if (
    username.length < 3 ||
    username.length > 20
  ) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Username must be between 3 and 20 characters."
        )
    );
  }

  if (
    !/^[a-z0-9_]+$/.test(username)
  ) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Username can only contain letters, numbers and underscores."
        )
    );
  }

  // ====================================================
  // EMAIL
  // ====================================================

  if (!email) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Please enter your email address."
        )
    );
  }

  // ====================================================
  // PASSWORD
  // ====================================================

  if (password.length < 8) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Password must be at least 8 characters."
        )
    );
  }

  // ====================================================
  // CREATE ACCOUNT
  // ====================================================

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  if (data.session) {
    redirect("/");
  }

  redirect(
    "/login?message=" +
      encodeURIComponent(
        "Account created. Check your email to confirm your account."
      )
  );
}