// ანგარიშის სრული წაშლა — auth.users-იდანაც.
// App Store Guideline 5.1.1(v) ითხოვს, რომ აპიდან ანგარიში ნამდვილად იშლებოდეს.
//
// გამოძახება კლიენტიდან:  supabase.functions.invoke("delete-account")
// (Authorization ჰედერს supabase-js ავტომატურად ამატებს)

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return Response.json(
        { error: "Missing Authorization header" },
        { status: 401, headers: corsHeaders },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ვინ ითხოვს წაშლას
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(
      token,
    );

    if (userError || !userData?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }

    const userId = userData.user.id;

    // ავატარი
    await admin.storage.from("avatars").remove([`${userId}.jpg`]);

    // პროფილი (quiz_scores კასკადით წაიშლება)
    await admin.from("profiles").delete().eq("id", userId);

    // თავად ანგარიში
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return Response.json(
        { error: deleteError.message },
        { status: 500, headers: corsHeaders },
      );
    }

    return Response.json({ status: "deleted" }, { headers: corsHeaders });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    return Response.json(
      { error: String(err) },
      { status: 500, headers: corsHeaders },
    );
  }
});
