<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Language;
use App\Models\DocumentType;
use App\Models\Service;
use App\Models\EmailTemplate;
use App\Models\Tenant;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first() ?? Tenant::create(['company_name' => 'Default Office']);
        $tenantId = $tenant->id;

        // 1. Comprehensive Language List (A-Z)
        $languages = [
            ['iso_code' => 'af-ZA', 'name_internal' => 'Afrikaans', 'name_native' => 'Afrikaans', 'flag_icon' => 'za'],
            ['iso_code' => 'sq-AL', 'name_internal' => 'Albanisch', 'name_native' => 'Shqip', 'flag_icon' => 'al'],
            ['iso_code' => 'am-ET', 'name_internal' => 'Amharisch', 'name_native' => 'አማርኛ', 'flag_icon' => 'et'],
            ['iso_code' => 'ar-SA', 'name_internal' => 'Arabisch', 'name_native' => 'العربية', 'flag_icon' => 'sa'],
            ['iso_code' => 'hy-AM', 'name_internal' => 'Armenisch', 'name_native' => 'Հայերեն', 'flag_icon' => 'am'],
            ['iso_code' => 'az-AZ', 'name_internal' => 'Aserbaidschanisch', 'name_native' => 'Azərbaycanca', 'flag_icon' => 'az'],
            ['iso_code' => 'eu-ES', 'name_internal' => 'Baskisch', 'name_native' => 'Euskara', 'flag_icon' => 'es-pv'],
            ['iso_code' => 'bn-BD', 'name_internal' => 'Bengalisch', 'name_native' => 'বাংলা', 'flag_icon' => 'bd'],
            ['iso_code' => 'bs-BA', 'name_internal' => 'Bosnisch', 'name_native' => 'Bosanski', 'flag_icon' => 'ba'],
            ['iso_code' => 'bg-BG', 'name_internal' => 'Bulgarisch', 'name_native' => 'Български', 'flag_icon' => 'bg'],
            ['iso_code' => 'my-MM', 'name_internal' => 'Burmesisch', 'name_native' => 'မြန်မာဘာသာ', 'flag_icon' => 'mm'],
            ['iso_code' => 'ca-ES', 'name_internal' => 'Katalanisch', 'name_native' => 'Català', 'flag_icon' => 'es-ct'],
            ['iso_code' => 'zh-CN', 'name_internal' => 'Chinesisch (S)', 'name_native' => '简体中文', 'flag_icon' => 'cn'],
            ['iso_code' => 'zh-TW', 'name_internal' => 'Chinesisch (T)', 'name_native' => '繁體中文', 'flag_icon' => 'tw'],
            ['iso_code' => 'da-DK', 'name_internal' => 'Dänisch', 'name_native' => 'Dansk', 'flag_icon' => 'dk'],
            ['iso_code' => 'de-DE', 'name_internal' => 'Deutsch (DE)', 'name_native' => 'Deutsch', 'flag_icon' => 'de'],
            ['iso_code' => 'de-AT', 'name_internal' => 'Deutsch (AT)', 'name_native' => 'Deutsch (AT)', 'flag_icon' => 'at'],
            ['iso_code' => 'de-CH', 'name_internal' => 'Deutsch (CH)', 'name_native' => 'Deutsch (CH)', 'flag_icon' => 'ch'],
            ['iso_code' => 'en-GB', 'name_internal' => 'Englisch (UK)', 'name_native' => 'English (UK)', 'flag_icon' => 'gb'],
            ['iso_code' => 'en-US', 'name_internal' => 'Englisch (US)', 'name_native' => 'English (US)', 'flag_icon' => 'us'],
            ['iso_code' => 'et-EE', 'name_internal' => 'Estnisch', 'name_native' => 'Eesti', 'flag_icon' => 'ee'],
            ['iso_code' => 'fa-IR', 'name_internal' => 'Farsi / Persisch', 'name_native' => 'فارسی', 'flag_icon' => 'ir'],
            ['iso_code' => 'prs-AF', 'name_internal' => 'Dari', 'name_native' => 'دری', 'flag_icon' => 'af'],
            ['iso_code' => 'fi-FI', 'name_internal' => 'Finnisch', 'name_native' => 'Suomi', 'flag_icon' => 'fi'],
            ['iso_code' => 'fr-FR', 'name_internal' => 'Französisch (FR)', 'name_native' => 'Français', 'flag_icon' => 'fr'],
            ['iso_code' => 'fr-CA', 'name_internal' => 'Französisch (CA)', 'name_native' => 'Français (CA)', 'flag_icon' => 'ca'],
            ['iso_code' => 'ka-GE', 'name_internal' => 'Georgisch', 'name_native' => 'ქართული', 'flag_icon' => 'ge'],
            ['iso_code' => 'el-GR', 'name_internal' => 'Griechisch', 'name_native' => 'Ελληνικά', 'flag_icon' => 'gr'],
            ['iso_code' => 'he-IL', 'name_internal' => 'Hebräisch', 'name_native' => 'עברית', 'flag_icon' => 'il'],
            ['iso_code' => 'hi-IN', 'name_internal' => 'Hindi', 'name_native' => 'हिन्दी', 'flag_icon' => 'in'],
            ['iso_code' => 'id-ID', 'name_internal' => 'Indonesisch', 'name_native' => 'Bahasa Indonesia', 'flag_icon' => 'id'],
            ['iso_code' => 'is-IS', 'name_internal' => 'Isländisch', 'name_native' => 'Íslenska', 'flag_icon' => 'is'],
            ['iso_code' => 'it-IT', 'name_internal' => 'Italienisch', 'name_native' => 'Italiano', 'flag_icon' => 'it'],
            ['iso_code' => 'ja-JP', 'name_internal' => 'Japanisch', 'name_native' => '日本語', 'flag_icon' => 'jp'],
            ['iso_code' => 'kk-KZ', 'name_internal' => 'Kasachisch', 'name_native' => 'Қазақ тілі', 'flag_icon' => 'kz'],
            ['iso_code' => 'ko-KR', 'name_internal' => 'Koreanisch', 'name_native' => '한국어', 'flag_icon' => 'kr'],
            ['iso_code' => 'hr-HR', 'name_internal' => 'Kroatisch', 'name_native' => 'Hrvatski', 'flag_icon' => 'hr'],
            ['iso_code' => 'lv-LV', 'name_internal' => 'Lettisch', 'name_native' => 'Latviešu', 'flag_icon' => 'lv'],
            ['iso_code' => 'lt-LT', 'name_internal' => 'Litauisch', 'name_native' => 'Lietuvių', 'flag_icon' => 'lt'],
            ['iso_code' => 'ms-MY', 'name_internal' => 'Malaysisch', 'name_native' => 'Bahasa Melayu', 'flag_icon' => 'my'],
            ['iso_code' => 'nl-NL', 'name_internal' => 'Niederländisch', 'name_native' => 'Nederlands', 'flag_icon' => 'nl'],
            ['iso_code' => 'no-NO', 'name_internal' => 'Norwegisch', 'name_native' => 'Norsk', 'flag_icon' => 'no'],
            ['iso_code' => 'ps-AF', 'name_internal' => 'Paschtu', 'name_native' => 'پښتو', 'flag_icon' => 'af'],
            ['iso_code' => 'pl-PL', 'name_internal' => 'Polnisch', 'name_native' => 'Polski', 'flag_icon' => 'pl'],
            ['iso_code' => 'pt-PT', 'name_internal' => 'Portugiesisch (PT)', 'name_native' => 'Português', 'flag_icon' => 'pt'],
            ['iso_code' => 'pt-BR', 'name_internal' => 'Portugiesisch (BR)', 'name_native' => 'Português (BR)', 'flag_icon' => 'br'],
            ['iso_code' => 'ro-RO', 'name_internal' => 'Rumänisch', 'name_native' => 'Română', 'flag_icon' => 'ro'],
            ['iso_code' => 'ru-RU', 'name_internal' => 'Russisch', 'name_native' => 'Русский', 'flag_icon' => 'ru'],
            ['iso_code' => 'sv-SE', 'name_internal' => 'Schwedisch', 'name_native' => 'Svenska', 'flag_icon' => 'se'],
            ['iso_code' => 'sr-RS', 'name_internal' => 'Serbisch', 'name_native' => 'Српски', 'flag_icon' => 'rs'],
            ['iso_code' => 'sk-SK', 'name_internal' => 'Slowakisch', 'name_native' => 'Slovenčina', 'flag_icon' => 'sk'],
            ['iso_code' => 'sl-SI', 'name_internal' => 'Slowenisch', 'name_native' => 'Slovenščina', 'flag_icon' => 'si'],
            ['iso_code' => 'es-ES', 'name_internal' => 'Spanisch (ES)', 'name_native' => 'Español', 'flag_icon' => 'es'],
            ['iso_code' => 'es-MX', 'name_internal' => 'Spanisch (MX)', 'name_native' => 'Español (MX)', 'flag_icon' => 'mx'],
            ['iso_code' => 'th-TH', 'name_internal' => 'Thailändisch', 'name_native' => 'ไทย', 'flag_icon' => 'th'],
            ['iso_code' => 'cs-CZ', 'name_internal' => 'Tschechisch', 'name_native' => 'Čeština', 'flag_icon' => 'cz'],
            ['iso_code' => 'tr-TR', 'name_internal' => 'Türkisch', 'name_native' => 'Türkçe', 'flag_icon' => 'tr'],
            ['iso_code' => 'uk-UA', 'name_internal' => 'Ukrainisch', 'name_native' => 'Українська', 'flag_icon' => 'ua'],
            ['iso_code' => 'hu-HU', 'name_internal' => 'Ungarisch', 'name_native' => 'Magyar', 'flag_icon' => 'hu'],
            ['iso_code' => 'uz-UZ', 'name_internal' => 'Usbekisch', 'name_native' => 'Oʻzbekcha', 'flag_icon' => 'uz'],
            ['iso_code' => 'vi-VN', 'name_internal' => 'Vietnamesisch', 'name_native' => 'Tiếng Việt', 'flag_icon' => 'vn'],
        ];

        foreach ($languages as $lang) {
            Language::updateOrCreate(
                ['tenant_id' => $tenantId, 'iso_code' => $lang['iso_code']],
                $lang
            );
        }

        // 2. Categorized Document Types A-Z
        $docTypes = [
            // Urkunden & Zeugnisse
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Abifeierzeugnis'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Apostille'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Arbeitszeugnis'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Bachelorzeugnis'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Diplomurkunde'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Eheurkunde'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Führerschein'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Führungszeugnis'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Geburtsurkunde'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Ledigkeitsbescheinigung'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Masterzeugnis'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Meldebescheinigung'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Personalausweis'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Reisepass'],
            ['category' => 'Urkunden & Zeugnisse', 'name' => 'Sterbeurkunde'],
            
            // Recht & Verträge
            ['category' => 'Recht & Verträge', 'name' => 'AGB'],
            ['category' => 'Recht & Verträge', 'name' => 'Anklageschrift'],
            ['category' => 'Recht & Verträge', 'name' => 'Arbeitsvertrag'],
            ['category' => 'Recht & Verträge', 'name' => 'DSGVO / Datenschutzerklärung'],
            ['category' => 'Recht & Verträge', 'name' => 'Gerichtsurteil'],
            ['category' => 'Recht & Verträge', 'name' => 'Handelsregisterauszug'],
            ['category' => 'Recht & Verträge', 'name' => 'Kaufvertrag'],
            ['category' => 'Recht & Verträge', 'name' => 'Mietvertrag'],
            ['category' => 'Recht & Verträge', 'name' => 'Notarielle Urkunde'],
            ['category' => 'Recht & Verträge', 'name' => 'Patentschrift'],
            ['category' => 'Recht & Verträge', 'name' => 'Vollmacht'],
            
            // Wirtschaft & Finanzen
            ['category' => 'Wirtschaft & Finanzen', 'name' => 'Bankbeleg'],
            ['category' => 'Wirtschaft & Finanzen', 'name' => 'Bilanzen'],
            ['category' => 'Wirtschaft & Finanzen', 'name' => 'Finanzbericht'],
            ['category' => 'Wirtschaft & Finanzen', 'name' => 'Gewinn- und Verlustrechnung'],
            ['category' => 'Wirtschaft & Finanzen', 'name' => 'Jahresabschluss'],
            ['category' => 'Wirtschaft & Finanzen', 'name' => 'Steuerbescheid'],
            ['category' => 'Wirtschaft & Finanzen', 'name' => 'Versicherungsdokument'],
            
            // Technik & IT
            ['category' => 'Technik & IT', 'name' => 'Bedienungsanleitung'],
            ['category' => 'Technik & IT', 'name' => 'Datenblatt'],
            ['category' => 'Technik & IT', 'name' => 'ISO-Zertifizierung'],
            ['category' => 'Technik & IT', 'name' => 'Sicherheitsdatenblatt'],
            ['category' => 'Technik & IT', 'name' => 'Software-Dokumentation'],
            ['category' => 'Technik & IT', 'name' => 'Technische Zeichnung'],
            
            // Medizin & Pharma
            ['category' => 'Medizin & Pharma', 'name' => 'Arztbericht'],
            ['category' => 'Medizin & Pharma', 'name' => 'Beipackzettel'],
            ['category' => 'Medizin & Pharma', 'name' => 'Klinische Studie'],
            ['category' => 'Medizin & Pharma', 'name' => 'Krankenhausbericht'],
            ['category' => 'Medizin & Pharma', 'name' => 'Medizinischer Befund'],
            ['category' => 'Medizin & Pharma', 'name' => 'Patientenakten'],
            
            // Marketing & Web
            ['category' => 'Marketing & Web', 'name' => 'Blogartikel'],
            ['category' => 'Marketing & Web', 'name' => 'Broschüre'],
            ['category' => 'Marketing & Web', 'name' => 'Katalog'],
            ['category' => 'Marketing & Web', 'name' => 'Newsletter'],
            ['category' => 'Marketing & Web', 'name' => 'Pressemitteilung'],
            ['category' => 'Marketing & Web', 'name' => 'Social Media Content'],
            ['category' => 'Marketing & Web', 'name' => 'Website Content'],
            
            // Privat & Sonstiges
            ['category' => 'Privat & Sonstiges', 'name' => 'Empfehlungsschreiben'],
            ['category' => 'Privat & Sonstiges', 'name' => 'Lebenslauf'],
            ['category' => 'Privat & Sonstiges', 'name' => 'Motivationsschreiben'],
            ['category' => 'Privat & Sonstiges', 'name' => 'Privatkorrespondenz'],
            ['category' => 'Privat & Sonstiges', 'name' => 'Schriftverkehr'],
        ];

        foreach ($docTypes as $type) {
            DocumentType::updateOrCreate(
                ['tenant_id' => $tenantId, 'name' => $type['name']],
                ['category' => $type['category']]
            );
        }

        // 3. Standard Service Packages
        $services = [
            ['name' => 'Übersetzung (Human-Only)', 'unit' => 'word', 'base_price' => 0.12],
            ['name' => 'MTPE (Machine Translation + Proofreading)', 'unit' => 'word', 'base_price' => 0.07],
            ['name' => 'Lektorat / Korrektorat', 'unit' => 'hour', 'base_price' => 65.00],
            ['name' => 'Beglaubigte Übersetzung', 'unit' => 'piece', 'base_price' => 15.00],
            ['name' => 'Transkription (Audio/Video)', 'unit' => 'hour', 'base_price' => 85.00],
            ['name' => 'DTP / Layout-Anpassung', 'unit' => 'hour', 'base_price' => 55.00],
            ['name' => 'Eilzuschlag', 'unit' => 'percent', 'base_price' => 25.00],
            ['name' => 'Mindestauftragspauschale', 'unit' => 'piece', 'base_price' => 35.00],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['tenant_id' => $tenantId, 'name' => $service['name']], $service);
        }

        // 4. Email Templates
        $emailTemplates = [
            [
                'name' => 'Angebot Standard',
                'type' => 'offer',
                'subject' => 'Ihr Übersetzungsangebot {offer_number}',
                'body' => "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage. Anbei finden Sie unser Angebot für das Projekt '{project_name}'.\n\nWir freuen uns auf Ihre Bestätigung.\n\nMit freundlichen Grüßen,\nIhr Translation Office"
            ],
            [
                'name' => 'Rechnung Standard',
                'type' => 'invoice',
                'subject' => 'Rechnung {invoice_number} - {project_name}',
                'body' => "Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung zu Ihren Unterlagen. Bitte begleichen Sie den Betrag bis zum {due_date}.\n\nVielen Dank für die angenehme Zusammenarbeit.\n\nMit freundlichen Grüßen,\nIhr Translation Office"
            ],
            [
                'name' => 'Auftragsbestätigung',
                'type' => 'order_confirmation',
                'subject' => 'Bestätigung Ihres Auftrags {project_number}',
                'body' => "Sehr geehrte Damen und Herren,\n\nhiermit bestätigen wir den Eingang Ihres Auftrags. Wir haben mit der Bearbeitung begonnen.\n\nGeplante Lieferung: {deadline}\n\nMit freundlichen Grüßen,\nIhr Translation Office"
            ],
            [
                'name' => 'Partner-Anfrage',
                'type' => 'partner_inquiry',
                'subject' => 'Anfrage: Projekt {project_name} ({source} > {target})',
                'body' => "Hallo,\n\nhast du Kapazitäten für ein neues Projekt?\nVolumen: {volume}\nDeadline: {deadline}\n\nBitte um kurze Rückmeldung.\n\nBeste Grüße"
            ],
        ];

        foreach ($emailTemplates as $tpl) {
            EmailTemplate::updateOrCreate(['tenant_id' => $tenantId, 'name' => $tpl['name']], $tpl);
        }
    }
}
