interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  disposition?: 'attachment' | 'inline';
}

interface SendEmailOptions {
  to: string | string[] | EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  idempotencyKey?: string;
}

interface MailersendRecipient {
  email: string;
  name?: string;
}

interface MailersendRequest {
  from: {
    email: string;
    name: string;
  };
  to: MailersendRecipient[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: {
    email: string;
  };
  cc?: MailersendRecipient[];
  bcc?: MailersendRecipient[];
  attachments?: {
    filename: string;
    content: string;
    disposition?: string;
  }[];
}

const MAILERSEND_API_KEY = Deno.env.get("MAILERSEND_API_KEY");
const MAILERSEND_FROM = Deno.env.get("MAILERSEND_FROM") || "ale@zebibfood.de";
const MAILERSEND_FROM_NAME = Deno.env.get("MAILERSEND_FROM_NAME") || "Zebib Foods";
const MAILERSEND_ADMIN = Deno.env.get("MAILERSEND_ADMIN") || "ale@zebibfood.de";
const REQUEST_TIMEOUT = 10000; // 10 seconds

function normalizeRecipients(recipients: string | string[] | EmailRecipient | EmailRecipient[]): MailersendRecipient[] {
  if (typeof recipients === 'string') {
    return [{ email: recipients }];
  }
  if (Array.isArray(recipients)) {
    return recipients.map(r => 
      typeof r === 'string' ? { email: r } : { email: r.email, name: r.name }
    );
  }
  return [{ email: recipients.email, name: recipients.name }];
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!MAILERSEND_API_KEY) {
    const error = "MAILERSEND_API_KEY is not configured";
    console.error(error);
    return { success: false, error };
  }

  const isDevelopment = Deno.env.get("DENO_DEPLOYMENT_ID") === undefined;
  
  const toRecipients = normalizeRecipients(options.to);
  const ccRecipients = options.cc ? normalizeRecipients(options.cc) : [];
  const bccRecipients = options.bcc ? normalizeRecipients(options.bcc) : [];
  
  // Generate plain text fallback if not provided
  const text = options.text || stripHtml(options.html);
  
  const payload: MailersendRequest = {
    from: {
      email: MAILERSEND_FROM,
      name: MAILERSEND_FROM_NAME,
    },
    to: toRecipients,
    subject: options.subject,
    html: options.html,
    text,
  };
  
  if (options.replyTo) {
    payload.reply_to = { email: options.replyTo };
  }
  
  if (ccRecipients.length > 0) {
    payload.cc = ccRecipients;
  }
  
  if (bccRecipients.length > 0) {
    payload.bcc = bccRecipients;
  }
  
  if (options.attachments && options.attachments.length > 0) {
    payload.attachments = options.attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      disposition: att.disposition || 'attachment',
    }));
  }
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${MAILERSEND_API_KEY}`,
  };
  
  if (options.idempotencyKey) {
    headers["X-Idempotency-Key"] = options.idempotencyKey;
  }
  
  let lastError: string | undefined;
  
  // Try sending with one retry on failure
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (isDevelopment) {
        console.log(`[Email Send - Attempt ${attempt}] To: ${toRecipients.map(r => r.email).join(', ')}, Subject: ${options.subject}`);
      }
      
      const response = await sendWithTimeout(
        "https://api.mailersend.com/v1/email",
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        },
        REQUEST_TIMEOUT
      );
      
      const responseData = await response.json().catch(() => ({}));
      
      if (response.ok) {
        const messageId = responseData.message_id || responseData.id || 'unknown';
        
        console.log(JSON.stringify({
          event: 'email_sent',
          status: response.status,
          messageId,
          recipients: toRecipients.map(r => r.email),
          subject: options.subject,
          attempt,
        }));
        
        return { success: true, messageId };
      }
      
      // If 5xx error and first attempt, retry
      if (response.status >= 500 && response.status < 600 && attempt === 1) {
        lastError = `Mailersend API error ${response.status}: ${JSON.stringify(responseData)}`;
        console.warn(`[Email Send] Attempt ${attempt} failed with ${response.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        continue;
      }
      
      // 4xx or final attempt failure
      lastError = `Mailersend API error ${response.status}: ${JSON.stringify(responseData)}`;
      break;
      
    } catch (error: any) {
      lastError = `Network error: ${error.message}`;
      
      if (attempt === 1) {
        console.warn(`[Email Send] Attempt ${attempt} failed with network error, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      break;
    }
  }
  
  console.error(JSON.stringify({
    event: 'email_failed',
    error: lastError,
    recipients: toRecipients.map(r => r.email),
    subject: options.subject,
  }));
  
  return { success: false, error: lastError };
}
