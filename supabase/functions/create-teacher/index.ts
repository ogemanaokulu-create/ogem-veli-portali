import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Yetkisiz" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Geçersiz oturum" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const managerId = userData.user.id;
    const { data: managerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", managerId)
      .single();

    if (!managerProfile || managerProfile.role !== "manager") {
      return new Response(JSON.stringify({ error: "Bu işlem için müdür yetkisi gerekli" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, fullName, phone, tempPassword, classId } = body;

    if (!email || !fullName || !tempPassword) {
      return new Response(JSON.stringify({ error: "Eksik bilgi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: "Kullanıcı oluşturulamadı: " + createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const teacherId = newUser.user.id;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: teacherId,
      full_name: fullName,
      phone: phone || null,
      role: "teacher",
      must_change_password: true,
    });

    if (profileError) {
      return new Response(JSON.stringify({ error: "Profil oluşturulamadı" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("teachers").upsert({
      profile_id: teacherId,
    });

    if (classId) {
      await supabase.from("classes").update({ teacher_id: teacherId }).eq("id", classId);
    }

    return new Response(JSON.stringify({ success: true, teacherId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
