export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import PDFParser from "pdf2json";

async function parsePdf(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", err => reject(err));

    pdfParser.on("pdfParser_dataReady", pdfData => {
      let text = "";

      pdfData.Pages.forEach(page => {
        page.Texts.forEach(t => {
          t.R.forEach(r => {
            try {
              text += decodeURIComponent(r.T) + " ";
            } catch {
              text += r.T + " ";
            }
          });
        });
        text += "\n";
      });

      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}
async function parseDocx(buffer) {
  const mammoth = await import("mammoth");
  const res = await mammoth.extractRawText({ buffer });
  return res?.value || "";
}

function isMostlyText(buffer) {
  const s = buffer.toString("utf8");

  const bad =
    (s.match(/[^\x09\x0A\x0D\x20-\x7E]/g)?.length || 0) /
    Math.max(s.length, 1);

  return bad < 0.02;
}

export async function POST(req) {
  try {
    const { url, filename } = await req.json();

    if (!url || !filename) {
      return new Response(JSON.stringify({ error: "Missing url or filename" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Could not fetch file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    let text = "";

    if (ext === "pdf") {
      text = await parsePdf(buffer);
    } else if (ext === "docx") {
      text = await parseDocx(buffer);
    } else {
      text = isMostlyText(buffer) ? buffer.toString("utf8") : "";
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Parse error:", e);

    return new Response(JSON.stringify({ error: "Parse failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}