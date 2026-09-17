/**
 * Decodes Gmail API's base64url-encoded message bodies into proper UTF-8
 * strings (handles multi-byte characters like emoji). No external deps —
 * React Native's atob (when available) doesn't reliably handle UTF-8, so
 * this decodes bytes manually.
 */

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(base64) {
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const char of base64) {
    if (char === "=") break;
    const idx = B64_CHARS.indexOf(char);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

function bytesToUtf8(bytes) {
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else if (byte1 >= 0xc0 && byte1 < 0xe0) {
      const byte2 = bytes[i++] || 0;
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
      const byte2 = bytes[i++] || 0;
      const byte3 = bytes[i++] || 0;
      result += String.fromCharCode(
        ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)
      );
    } else if (byte1 >= 0xf0) {
      const byte2 = bytes[i++] || 0;
      const byte3 = bytes[i++] || 0;
      const byte4 = bytes[i++] || 0;
      let codepoint =
        ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
      codepoint -= 0x10000;
      result += String.fromCharCode(0xd800 + (codepoint >> 10), 0xdc00 + (codepoint & 0x3ff));
    }
  }
  return result;
}

function base64UrlDecode(str) {
  if (!str) return "";
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return bytesToUtf8(base64ToBytes(base64));
}

module.exports = { base64UrlDecode };

if (require.main === module) {
  // "Hello 🌍" base64url-encoded, to verify multi-byte emoji handling
  const encoded = Buffer.from("Hello 🌍 world — café", "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  console.log("decoded:", base64UrlDecode(encoded));
}
