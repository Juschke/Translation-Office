<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background:#f8fafc; padding: 40px 20px;">
  <div style="max-width:520px; margin:0 auto; background:white; border-radius:8px; border:1px solid #e2e8f0; padding:40px;">
    <div style="background:#1B4D4F; color:white; padding:16px 24px; border-radius:6px 6px 0 0; margin:-40px -40px 32px -40px;">
      <h2 style="margin:0; font-size:18px;">{{ $companyName }}</h2>
      <p style="margin:4px 0 0; opacity:0.7; font-size:13px;">Kundenportal</p>
    </div>
    <p style="color:#334155; font-size:15px;">Guten Tag, {{ $customer->first_name ?? $customer->company_name }},</p>
    <p style="color:#475569; font-size:14px; line-height:1.6;">
      Sie haben einen Anmeldelink für das Kundenportal angefordert. Klicken Sie auf den Button, um sich anzumelden.
    </p>
    <div style="text-align:center; margin:32px 0;">
      <a href="{{ $magicLink }}" style="background:#1B4D4F; color:white; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:600; font-size:15px; display:inline-block;">
        Jetzt anmelden
      </a>
    </div>
    <p style="color:#94a3b8; font-size:12px; text-align:center; margin-top:24px;">
      Dieser Link ist 24 Stunden gültig. Falls Sie keinen Anmeldelink angefordert haben, können Sie diese E-Mail ignorieren.
    </p>
  </div>
</body>
</html>
