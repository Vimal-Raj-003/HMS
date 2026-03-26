import axios from 'axios';

/**
 * Send OTP to an Indian mobile number.
 * Supports multiple providers: fast2sms, 2factor.
 * Falls back gracefully — logs OTP on failure so dev/testing still works.
 */
export async function sendOTP(mobile: string, otp: string): Promise<boolean> {
  // Clean to 10-digit Indian mobile number
  const cleanMobile = mobile.replace(/^\+?91/, '').replace(/\D/g, '');

  if (cleanMobile.length !== 10) {
    console.error(`[SMS] Invalid mobile number: ${mobile} → cleaned: ${cleanMobile}`);
    return false;
  }

  console.log(`[SMS] Sending OTP ${otp} to ${cleanMobile}`);

  const provider = process.env.SMS_PROVIDER || 'fast2sms';

  if (provider === 'fast2sms') {
    return sendViaFast2SMS(cleanMobile, otp);
  } else if (provider === '2factor') {
    return sendVia2Factor(cleanMobile, otp);
  } else {
    console.error(`[SMS] Unknown provider: ${provider}. OTP not sent.`);
    return false;
  }
}

// ─── Fast2SMS ────────────────────────────────────────────
async function sendViaFast2SMS(mobile: string, otp: string): Promise<boolean> {
  const apiKey = process.env.SMS_API_KEY;
  const baseUrl = process.env.SMS_BASE_URL || 'https://www.fast2sms.com/dev/bulkV2';
  const route = process.env.SMS_ROUTE || 'otp';

  if (!apiKey || apiKey.startsWith('your-')) {
    console.log('[SMS] Fast2SMS API key not configured — OTP logged but not sent');
    return false;
  }

  try {
    const params: Record<string, string> = {
      authorization: apiKey,
      flash: '0',
      numbers: mobile,
    };

    if (route === 'otp') {
      params.route = 'otp';
      params.variables_values = otp;
    } else {
      params.route = route;
      params.message = `Your HMS login OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
    }

    const response = await axios.get(baseUrl, {
      headers: { authorization: apiKey },
      params,
      timeout: 15000,
    });

    console.log('[SMS] Fast2SMS response:', JSON.stringify(response.data));

    if (response.data?.return === true) {
      console.log(`[SMS] ✓ OTP sent via Fast2SMS to ${mobile}`);
      return true;
    }

    console.error('[SMS] Fast2SMS failure:', response.data?.message);
    return false;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error(`[SMS] Fast2SMS error: ${msg}`);
    return false;
  }
}

// ─── 2Factor.in (free Indian OTP API) ───────────────────
async function sendVia2Factor(mobile: string, otp: string): Promise<boolean> {
  const apiKey = process.env.SMS_API_KEY;

  if (!apiKey || apiKey.startsWith('your-')) {
    console.log('[SMS] 2Factor API key not configured — OTP logged but not sent');
    return false;
  }

  try {
    // 2Factor OTP API: https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}/AUTOGEN
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/${otp}/AUTOGEN`;

    const response = await axios.get(url, { timeout: 15000 });

    console.log('[SMS] 2Factor response:', JSON.stringify(response.data));

    if (response.data?.Status === 'Success') {
      console.log(`[SMS] ✓ OTP sent via 2Factor to ${mobile}`);
      return true;
    }

    console.error('[SMS] 2Factor failure:', response.data?.Details);
    return false;
  } catch (error: any) {
    const msg = error.response?.data?.Details || error.message;
    console.error(`[SMS] 2Factor error: ${msg}`);
    return false;
  }
}
