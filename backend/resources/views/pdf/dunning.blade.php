<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 11pt; color: #1a1a1a; margin: 0; padding: 0; }
  .page { padding: 20mm 20mm 20mm 25mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12mm; }
  .company-name { font-size: 14pt; font-weight: bold; color: #1B4D4F; }
  .company-sub { font-size: 9pt; color: #666; margin-top: 2px; }
  .badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 3px 10px; border-radius: 4px; font-size: 9pt; font-weight: bold; letter-spacing: 0.5px; }
  .recipient { margin: 8mm 0 8mm 0; font-size: 10pt; line-height: 1.5; }
  .subject { font-size: 13pt; font-weight: bold; margin: 6mm 0 4mm 0; }
  .body-text { font-size: 10.5pt; line-height: 1.7; white-space: pre-line; }
  .details-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 5mm 6mm; margin: 7mm 0; background: #f8fafc; }
  .details-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10pt; }
  .details-row.total { font-weight: bold; border-top: 1px solid #cbd5e1; margin-top: 4px; padding-top: 4px; font-size: 11pt; }
  .details-label { color: #64748b; }
  .details-value { font-weight: 600; }
  .footer { margin-top: 15mm; font-size: 8.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4mm; }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">{{ $invoice->snapshot_seller_name ?? config('app.name') }}</div>
      <div class="company-sub">{{ $invoice->snapshot_seller_address ?? '' }}</div>
    </div>
    <div class="badge">{{ strtoupper($level_label) }}</div>
  </div>

  <!-- Empfänger -->
  <div class="recipient">
    <strong>{{ $invoice->snapshot_customer_name }}</strong><br>
    @if($invoice->snapshot_customer_address)
      {{ $invoice->snapshot_customer_address }}<br>
    @endif
    @if($invoice->snapshot_customer_zip || $invoice->snapshot_customer_city)
      {{ $invoice->snapshot_customer_zip }} {{ $invoice->snapshot_customer_city }}<br>
    @endif
    @if($invoice->snapshot_customer_country)
      {{ $invoice->snapshot_customer_country }}
    @endif
  </div>

  <!-- Datum -->
  <div style="text-align: right; font-size: 9.5pt; color: #64748b; margin-bottom: 4mm;">
    {{ now()->format('d.m.Y') }}
  </div>

  <!-- Betreff -->
  <div class="subject">{{ $level_label }} – Rechnung {{ $invoice->invoice_number }}</div>

  <!-- Mahntext -->
  <div class="body-text">{{ $body }}</div>

  <!-- Übersichtskasten -->
  <div class="details-box">
    <div class="details-row">
      <span class="details-label">Rechnungsnummer</span>
      <span class="details-value">{{ $invoice->invoice_number }}</span>
    </div>
    <div class="details-row">
      <span class="details-label">Rechnungsdatum</span>
      <span class="details-value">{{ $invoice->date?->format('d.m.Y') }}</span>
    </div>
    <div class="details-row">
      <span class="details-label">Ursprüngliche Fälligkeit</span>
      <span class="details-value">{{ $invoice->due_date?->format('d.m.Y') }}</span>
    </div>
    <div class="details-row">
      <span class="details-label">Rechnungsbetrag</span>
      <span class="details-value">{{ number_format($invoice->amount_gross / 100, 2, ',', '.') }} €</span>
    </div>
    @if($fee_eur > 0)
    <div class="details-row">
      <span class="details-label">Mahngebühr</span>
      <span class="details-value">{{ number_format($fee_eur, 2, ',', '.') }} €</span>
    </div>
    @endif
    <div class="details-row total">
      <span>Zu zahlen bis {{ $new_due_date }}</span>
      <span>{{ number_format($total_due_eur, 2, ',', '.') }} €</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Dokument erstellt am {{ now()->format('d.m.Y H:i') }} Uhr &nbsp;·&nbsp; {{ $level_label }} &nbsp;·&nbsp; Rechnung {{ $invoice->invoice_number }}
  </div>
</div>
</body>
</html>
