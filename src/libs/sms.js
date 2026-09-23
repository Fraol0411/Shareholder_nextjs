// libs/sms.js
const SMS_BASE_URL = process.env.SMS_API_BASE_URL || 'http://10.1.6.10:8000';

let cachedToken = null;
let tokenCachedUntil = 0;

async function getSmsAccessToken() {
  if (cachedToken && Date.now() < tokenCachedUntil) return cachedToken;

  console.log('[SMS] Attempting login to SMS Manager...');
  const res = await fetch(`${SMS_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.SMS_API_USERNAME,
      password: process.env.SMS_API_PASSWORD,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[SMS] Login failed (${res.status}):`, text);
    throw new Error(`SMS Login failed (${res.status}): ${text}`);
  }

  const data = JSON.parse(text);
  cachedToken = data.access_token;
  // Cache for 20 minutes (or based on expires_in from Swagger)
  tokenCachedUntil = Date.now() + (data.expires_in ? (data.expires_in - 60) * 1000 : 20 * 60 * 1000); 
  console.log('[SMS] Login successful. Token cached.');
  return cachedToken;
}

export function toInternationalPhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('0')) return `251${digits.slice(1)}`;
  if (digits.length === 9) return `251${digits}`; 
  return digits;
}

export async function sendOtpSms(phone, otp) {
  const token = await getSmsAccessToken();
  const message = `Awash Insurance: Your verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;
  
  const payload = {
    phone_number: toInternationalPhone(phone),
    message,
    sender_id: process.env.SMS_SENDER_ID || "AWASH",
  };

  console.log('[SMS] Sending payload:', payload);

  const res = await fetch(`${SMS_BASE_URL}/api/sms/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  console.log(`[SMS] Response Status: ${res.status}`);
  console.log(`[SMS] Response Body: ${responseText}`);

  if (!res.ok) {
    let errorMsg = `SMS gateway error (${res.status})`;
    try {
      const errorJson = JSON.parse(responseText);
      // FastAPI usually returns errors in a "detail" array or object
      if (Array.isArray(errorJson.detail)) {
         errorMsg = errorJson.detail.map(d => d.msg).join(', ');
      } else {
         errorMsg = errorJson.detail || errorJson.message || errorMsg;
      }
    } catch (e) {
      errorMsg = responseText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  
  return JSON.parse(responseText);
}