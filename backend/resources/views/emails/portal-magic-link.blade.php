<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0; padding:32px 16px; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #d1d5db; padding:32px;">
    <h1 style="margin:0 0 20px; font-size:22px; font-weight:400; color:#0e5a67;">Serviceportal</h1>

    <p style="margin:0 0 16px; font-size:14px; line-height:1.7;">
      Guten Tag {{ $user->first_name ?? ($user->company_name ?? ($user->company ?? '')) }},
    </p>

    <p style="margin:0 0 14px; font-size:14px; line-height:1.7;">
      für Ihren Portalzugang wurde ein Sicherheitscode zum Zurücksetzen des Passworts angefordert.
    </p>

    <p style="margin:0 0 12px; font-size:14px; line-height:1.7;">
      Bitte geben Sie den folgenden Code im Serviceportal ein:
    </p>

    <div style="margin:0 0 24px; text-align:center;">
      <div style="display:inline-block; padding:12px 22px; border:1px solid #cbd5e1; background:#eef2f6; font-size:28px; font-weight:700; letter-spacing:0.22em; color:#0e5a67;">
        {{ $magicLink }}
      </div>
    </div>

    <p style="margin:0 0 10px; font-size:13px; line-height:1.7; color:#4b5563;">
      Der Code ist 24 Stunden gültig.
    </p>

    <p style="margin:0; font-size:13px; line-height:1.7; color:#4b5563;">
      Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail einfach ignorieren.
    </p>
  </div>
</body>
</html>
