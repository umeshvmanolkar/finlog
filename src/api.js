export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmXnoQvokcD_s_Cr6_FAEP6KkpUbNPkZQxbEWvIsyXF95kUVX6Pm8Tx-iorFbrVZGjkg/exec';

// Apps Script prefers simple POSTs to avoid CORS pre-flight, and relies on text/plain contents parsing if no standard headers are sent.
export async function apiCall(action, payload) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      // Important to use plain text content type for Google Apps Script to prevent strict CORS preflight rejections
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, payload })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

export async function fetchDashboard(userId) {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getDashboardData&userId=${userId}`);
    const result = await response.json();
    if(result.error) throw new Error(result.error);
    return result.data;
  } catch (err) {
      console.error("API Error fetch:", err);
      throw err;
  }
}
