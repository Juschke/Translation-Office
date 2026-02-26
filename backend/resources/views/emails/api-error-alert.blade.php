<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .alert {
            background: white;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .alert.critical {
            border-left-color: #dc3545;
        }
        .alert.warning {
            border-left-color: #ffc107;
        }
        .alert-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #dc3545;
        }
        .alert.warning .alert-title {
            color: #ff9800;
        }
        .alert-detail {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
        }
        .alert-count {
            font-size: 32px;
            font-weight: bold;
            color: #dc3545;
            margin: 10px 0;
        }
        .alert.warning .alert-count {
            color: #ff9800;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 12px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 15px;
            font-weight: bold;
        }
        .timestamp {
            color: #6c757d;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ API Error Alert</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Translation Office - System Monitoring</p>
    </div>

    <div class="content">
        <p>Hallo Administrator,</p>
        <p>Es wurden ungewöhnlich viele API-Fehler in den letzten 15 Minuten festgestellt:</p>

        @foreach($alerts as $alert)
            <div class="alert {{ $alert['severity'] }}">
                <div class="alert-title">
                    @if($alert['severity'] === 'critical')
                        🔴
                    @else
                        ⚠️
                    @endif
                    {{ $alert['type'] }}
                </div>
                <div class="alert-count">{{ $alert['count'] }} Fehler</div>
                <div class="alert-detail">
                    <strong>Schwellwert:</strong> {{ $alert['threshold'] }}<br>
                    <strong>Zeitraum:</strong> Letzte 15 Minuten<br>
                    <strong>Status:</strong>
                    @if($alert['severity'] === 'critical')
                        <span style="color: #dc3545;">KRITISCH</span>
                    @else
                        <span style="color: #ff9800;">WARNUNG</span>
                    @endif
                </div>
            </div>
        @endforeach

        <p style="margin-top: 20px;">
            <strong>Empfohlene Maßnahmen:</strong>
        </p>
        <ul style="color: #666; line-height: 1.8;">
            <li>Überprüfen Sie die API Logs im Admin-Panel</li>
            <li>Identifizieren Sie problematische Endpoints</li>
            <li>Prüfen Sie Server-Ressourcen (CPU, Memory, Disk)</li>
            <li>Überprüfen Sie externe Service-Abhängigkeiten</li>
        </ul>

        <div style="text-align: center;">
            <a href="{{ config('app.url') }}/admin/api-logs?errors_only=1" class="btn">
                API Logs ansehen
            </a>
        </div>

        <div class="timestamp">
            <strong>Zeitstempel:</strong> {{ now()->format('d.m.Y H:i:s') }}
        </div>
    </div>

    <div class="footer">
        <p>
            Diese automatische Benachrichtigung wurde von Ihrem Translation Office System generiert.<br>
            Sie erhalten maximal eine Benachrichtigung pro Stunde für jeden Alert-Typ.
        </p>
    </div>
</body>
</html>
