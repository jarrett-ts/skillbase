// Supabase Edge Function: skill-sync
// Fires when a skill is saved in Skillbase.
// Rebuilds the SKILL.md file (frontmatter + content) and pushes it to GitHub.
// Deploy to: https://zjruwkdmvpgfpyxpnffj.supabase.co/functions/v1/skill-sync

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GITHUB_OWNER = "jarrett-ts";
const GITHUB_REPO  = "skillbase";
const GITHUB_BRANCH = "main";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ error: "GITHUB_TOKEN secret not set in Supabase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { skill_id, name, description, icon, color, prompt, related_server_ids } = body;

    if (!skill_id || !name || !prompt) {
      return new Response(
        JSON.stringify({ error: "skill_id, name, and prompt are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the SKILL.md content
    // Preserve existing frontmatter fields, merge with updated values
    const servers = related_server_ids?.length
      ? related_server_ids.map((s: string) => `- ${s}`).join("\n")
      : "";

    const frontmatter = [
      "---",
      `name: ${skill_id}`,
      `description: "${(description || "").replace(/"/g, '\\"')}"`,
      `icon: ${icon || "ti-puzzle"}`,
      `color: ${color || "gray"}`,
      ...(servers ? [`related_server_ids:\n${servers}`] : []),
      "---",
    ].join("\n");

    const skillMdContent = `${frontmatter}\n\n${prompt.trimStart()}`;

    // GitHub file path: skills/skill-id/SKILL.md
    const filePath = `skills/${skill_id}/SKILL.md`;
    const githubUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    const githubHeaders = {
      "Authorization": `token ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    // Check if file already exists (need SHA to update)
    let existingSha: string | null = null;
    const checkRes = await fetch(`${githubUrl}?ref=${GITHUB_BRANCH}`, {
      headers: githubHeaders,
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      existingSha = existing.sha ?? null;
    }

    // Encode content as base64
    const encoded = btoa(unescape(encodeURIComponent(skillMdContent)));

    // Push to GitHub
    const pushBody: Record<string, unknown> = {
      message: `Sync: update ${name} skill from Skillbase`,
      content: encoded,
      branch: GITHUB_BRANCH,
    };
    if (existingSha) pushBody.sha = existingSha;

    const pushRes = await fetch(githubUrl, {
      method: "PUT",
      headers: githubHeaders,
      body: JSON.stringify(pushBody),
    });

    const pushData = await pushRes.json();

    if (!pushRes.ok) {
      return new Response(
        JSON.stringify({ error: "GitHub push failed", details: pushData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        skill_id,
        file_path: filePath,
        commit: pushData.commit?.sha?.slice(0, 8),
        message: `Pushed ${filePath} to GitHub`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
