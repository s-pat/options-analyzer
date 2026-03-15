import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Clerk Webhook Handler
// Handles: user.created  → sends "you're on the waitlist" email
//          user.updated  → sends "you've been approved" email (when approved)
// ---------------------------------------------------------------------------

interface ClerkUserEvent {
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    primary_email_address_id?: string;
    public_metadata?: Record<string, unknown>;
  };
  type: string;
}

function getPrimaryEmail(data: ClerkUserEvent['data']): string | null {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? null;
}

function getFirstName(data: ClerkUserEvent['data']): string {
  return data.first_name || 'there';
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function waitlistHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Welcome to OptionsLab</title>
  <style>
    :root { color-scheme: dark; }
    body { background-color: #111111 !important; }
    .email-wrapper { background-color: #111111 !important; }
    .email-card { background-color: #1e1e1e !important; }
    .email-inner { background-color: rgba(255,255,255,0.04) !important; }
    [data-ogsc] body { background-color: #111111 !important; }
    [data-ogsc] .email-wrapper { background-color: #111111 !important; }
    [data-ogsc] .email-card { background-color: #1e1e1e !important; }
    [data-ogsc] .email-inner { background-color: #1a1a1a !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#e8e8e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:20px;font-weight:600;color:#f5f5f5;letter-spacing:-0.02em;">OptionsLab</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top:10px;">
                <span style="display:inline-block;font-size:11px;font-weight:500;color:#e8e8e8;background-color:rgba(232,232,232,0.1);border:1px solid rgba(232,232,232,0.15);border-radius:99px;padding:3px 10px;letter-spacing:0.04em;">
                  PRIVATE BETA
                </span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background-color:#1e1e1e;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#f5f5f5;line-height:1.3;">
                Welcome, ${firstName}!
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#999999;line-height:1.6;">
                Your account has been created and you've been added to the OptionsLab private beta waitlist.
              </p>

              <div style="height:1px;background-color:rgba(255,255,255,0.08);margin-bottom:28px;"></div>

              <p style="margin:0 0 12px;font-size:14px;color:#cccccc;line-height:1.7;">
                We're reviewing access requests carefully to keep the beta small and focused.
                Once you're approved, we'll send you another email and you'll have full access to the platform.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#cccccc;line-height:1.7;">
                In the meantime, your account is ready &mdash; you can sign in anytime to check your status.
              </p>

              <div class="email-inner" style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:20px 24px;margin-bottom:0;">
                <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#888888;letter-spacing:0.06em;text-transform:uppercase;">What you'll get access to</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr><td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">&#x2022;&nbsp;&nbsp;IV screening &amp; options chain analysis</td></tr>
                  <tr><td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">&#x2022;&nbsp;&nbsp;Greeks, Black-Scholes fair value pricing</td></tr>
                  <tr><td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">&#x2022;&nbsp;&nbsp;Strategy backtesting across S&amp;P 500</td></tr>
                  <tr><td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">&#x2022;&nbsp;&nbsp;AI-powered trade picks &amp; scoring</td></tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                You're receiving this because you signed up for OptionsLab.<br/>
                If this wasn't you, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function approvalHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>You're approved for OptionsLab</title>
  <style>
    :root { color-scheme: dark; }
    body { background-color: #111111 !important; }
    .email-wrapper { background-color: #111111 !important; }
    .email-card { background-color: #1e1e1e !important; }
    [data-ogsc] body { background-color: #111111 !important; }
    [data-ogsc] .email-wrapper { background-color: #111111 !important; }
    [data-ogsc] .email-card { background-color: #1e1e1e !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#e8e8e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:20px;font-weight:600;color:#f5f5f5;letter-spacing:-0.02em;">OptionsLab</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background-color:#1e1e1e;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:40px 36px;">

              <!-- Checkmark icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);line-height:56px;text-align:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
                    <polyline points="20 6 9 17 4 12" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#f5f5f5;line-height:1.3;text-align:center;">
                You're in, ${firstName}!
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#999999;line-height:1.6;text-align:center;">
                Your access to the OptionsLab private beta has been approved.
              </p>

              <div style="height:1px;background-color:rgba(255,255,255,0.08);margin-bottom:28px;"></div>

              <p style="margin:0 0 24px;font-size:14px;color:#cccccc;line-height:1.7;">
                You now have full access to the platform. Sign in to start exploring options data, run backtests, and discover trade opportunities.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://optionlabs.app'}" style="display:inline-block;padding:12px 32px;background-color:#3B82F6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:-0.01em;">
                  Open OptionsLab
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                You're receiving this because you signed up for OptionsLab.<br/>
                If this wasn't you, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Webhook handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Verify the webhook signature
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await req.text();

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error('[clerk-webhook] Verification failed:', (err as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log('[clerk-webhook] RESEND_API_KEY not set — skipping email');
    return NextResponse.json({ received: true });
  }

  const resend = new Resend(resendKey);
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
  const email = getPrimaryEmail(event.data);
  const firstName = getFirstName(event.data);

  if (!email) {
    console.warn('[clerk-webhook] No email found for user', event.data.id);
    return NextResponse.json({ received: true });
  }

  // ---- user.created → waitlist email ----
  if (event.type === 'user.created') {
    console.log(`[clerk-webhook] user.created: ${email}`);
    resend.emails.send({
      from,
      to: email,
      subject: "Welcome to OptionsLab — You're on the waitlist",
      html: waitlistHtml(firstName),
    }).catch((err: unknown) => console.error('[clerk-webhook] waitlist email failed:', err));

    // Notify admin
    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (notifyEmail) {
      resend.emails.send({
        from,
        to: notifyEmail,
        subject: `[OptionsLab] New signup: ${firstName} (${email})`,
        text: [
          `New user signed up via Clerk SSO`,
          ``,
          `Name:  ${event.data.first_name ?? ''} ${event.data.last_name ?? ''}`.trim(),
          `Email: ${email}`,
          `ID:    ${event.data.id}`,
          `Time:  ${new Date().toISOString()}`,
          ``,
          `Approve in Clerk Dashboard → Users → set publicMetadata to { "approved": true }`,
        ].join('\n'),
      }).catch((err: unknown) => console.error('[clerk-webhook] admin notification failed:', err));
    }
  }

  // ---- user.updated → approval email (when approved changes to true) ----
  if (event.type === 'user.updated') {
    const approved = event.data.public_metadata?.approved === true;
    if (approved) {
      console.log(`[clerk-webhook] user.updated (approved): ${email}`);
      resend.emails.send({
        from,
        to: email,
        subject: "You're approved! Welcome to OptionsLab",
        html: approvalHtml(firstName),
      }).catch((err: unknown) => console.error('[clerk-webhook] approval email failed:', err));
    }
  }

  return NextResponse.json({ received: true });
}
