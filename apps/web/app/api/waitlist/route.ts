import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function confirmationHtml(name: string): string {
  const firstName = name.split(' ')[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the OptionsLab waitlist</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">
                    <!-- Activity / pulse icon -->
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
            <td style="background-color:#1e1e1e;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#f5f5f5;line-height:1.3;">
                You're on the list, ${firstName}.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#999999;line-height:1.6;">
                We've received your request for early access to OptionsLab.
              </p>

              <!-- Divider -->
              <div style="height:1px;background-color:rgba(255,255,255,0.08);margin-bottom:28px;"></div>

              <p style="margin:0 0 12px;font-size:14px;color:#cccccc;line-height:1.7;">
                We're reviewing access requests carefully to keep the beta small and focused.
                When a spot opens up, you'll be the first to know.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#cccccc;line-height:1.7;">
                In the meantime, if you have any questions feel free to reply to this email.
              </p>

              <!-- What's OptionsLab section -->
              <div style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:20px 24px;margin-bottom:0;">
                <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#888888;letter-spacing:0.06em;text-transform:uppercase;">What's OptionsLab?</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">
                      &#x2022;&nbsp;&nbsp;IV screening &amp; options chain analysis
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">
                      &#x2022;&nbsp;&nbsp;Greeks, Black-Scholes fair value pricing
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">
                      &#x2022;&nbsp;&nbsp;Strategy backtesting across S&amp;P 500
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#bbbbbb;line-height:1.5;">
                      &#x2022;&nbsp;&nbsp;AI-powered trade picks &amp; scoring
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
                You're receiving this because you requested beta access to OptionsLab.<br/>
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, reason } = body as { name?: string; email?: string; reason?: string };

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const entry = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    reason: reason?.trim() ?? '',
    submittedAt: new Date().toISOString(),
  };

  console.log('[waitlist]', JSON.stringify(entry));

  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (resendKey) {
    const resend = new Resend(resendKey);
    // Use a verified domain address when available; fall back to Resend's sandbox
    // sender which only delivers to your own account email (free-tier restriction).
    const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev';

    // Confirmation email to the submitter
    resend.emails.send({
      from,
      to: entry.email,
      subject: "You're on the OptionsLab waitlist",
      html: confirmationHtml(entry.name),
    }).catch((err: unknown) => console.error('[waitlist] confirmation email failed:', err));

    // Admin notification
    if (notifyEmail) {
      resend.emails.send({
        from,
        to: notifyEmail,
        subject: `[OptionsLab Beta] Access request from ${entry.name}`,
        text: [
          `Name:      ${entry.name}`,
          `Email:     ${entry.email}`,
          `Reason:    ${entry.reason || '(not provided)'}`,
          `Submitted: ${entry.submittedAt}`,
        ].join('\n'),
      }).catch((err: unknown) => console.error('[waitlist] admin notification failed:', err));
    }
  }

  return NextResponse.json({ ok: true });
}
