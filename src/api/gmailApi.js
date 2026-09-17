import { base64UrlDecode } from "../logic/base64";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

function getHeader(headers, name) {
  const h = (headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : "";
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Walks the MIME payload tree and returns the best-effort plain text body. */
function extractBody(payload) {
  if (!payload) return "";

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return base64UrlDecode(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.parts) {
        const text = extractBody(part);
        if (text) return text;
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return stripHtml(base64UrlDecode(part.body.data));
      }
    }
    return "";
  }

  if (payload.body?.data) {
    const text = base64UrlDecode(payload.body.data);
    return payload.mimeType === "text/html" ? stripHtml(text) : text;
  }

  return "";
}

async function apiFetch(accessToken, path) {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API request failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function fetchMessageList(accessToken, { maxResults = 25, query = "newer_than:7d" } = {}) {
  const params = new URLSearchParams({ maxResults: String(maxResults), q: query });
  const data = await apiFetch(accessToken, `/messages?${params.toString()}`);
  return data.messages || [];
}

async function fetchMessageFull(accessToken, id) {
  const msg = await apiFetch(accessToken, `/messages/${id}?format=full`);
  const headers = msg.payload?.headers || [];
  return {
    id,
    sender: getHeader(headers, "From"),
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    body: extractBody(msg.payload),
  };
}

/**
 * Fetches recent emails (list + full content for each) directly from the
 * Gmail REST API. Runs entirely on-device — no backend.
 */
export async function fetchRecentEmails(accessToken, { maxResults = 25, days = 7 } = {}) {
  const refs = await fetchMessageList(accessToken, {
    maxResults,
    query: `newer_than:${days}d`,
  });
  // fetch full message content for each in parallel
  return Promise.all(refs.map((ref) => fetchMessageFull(accessToken, ref.id)));
}
