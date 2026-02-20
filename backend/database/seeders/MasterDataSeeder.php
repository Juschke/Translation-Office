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
        $this->seedForTenant($tenant->id);
    }

    public function seedForTenant(int $tenantId): void
    {
        // 1. Comprehensive Language List (A-Z)
        $languages = [
            ['iso_code' => 'af-ZA', 'name_internal' => 'Afrikaans', 'name_native' => 'Afrikaans', 'flag_icon' => 'za'],
            ['iso_code' => 'sq-AL', 'name_internal' => 'Albanisch', 'name_native' => 'Shqip', 'flag_icon' => 'al'],
            ['iso_code' => 'am-ET', 'name_internal' => 'Amharisch', 'name_native' => 'አማርኛ', 'flag_icon' => 'et'],
            ['iso_code' => 'ar-SA', 'name_internal' => 'Arabisch', 'name_native' => 'العربية', 'flag_icon' => 'sa'],
            ['iso_code' => 'hy-AM', 'name_internal' => 'Armenisch', 'name_native' => 'Հայերեն', 'flag_icon' => 'am'],
            ['iso_code' => 'az-AZ', 'name_internal' => 'Aserbaidschanisch', 'name_native' => 'Azərbaycanca', 'flag_icon' => 'az'],
            ['iso_code' => 'eu-ES', 'name_internal' => 'Baskisch', 'name_native' => 'Euskara', 'flag_icon' => 'es-pv'],
            ['iso_code' => 'be-BY', 'name_internal' => 'Belarussisch', 'name_native' => 'Беларуская', 'flag_icon' => 'by'],
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
            ['iso_code' => 'am-ET', 'name_internal' => 'Amharisch', 'name_native' => 'አማርኛ', 'flag_icon' => 'et'],
            ['iso_code' => 'so-SO', 'name_internal' => 'Somali', 'name_native' => 'Soomaali', 'flag_icon' => 'so'],
            ['iso_code' => 'sw-KE', 'name_internal' => 'Suaheli', 'name_native' => 'Kiswahili', 'flag_icon' => 'ke'],
            ['iso_code' => 'ti-ER', 'name_internal' => 'Tigrinya', 'name_native' => 'ትግርኛ', 'flag_icon' => 'er'],
        ];

        foreach ($languages as $lang) {
            Language::updateOrCreate(
                ['tenant_id' => $tenantId, 'iso_code' => $lang['iso_code']],
                $lang
            );
        }

        // 2. Categorized Document Types A-Z
        $docTypes = [
            // Personenstand & Identität
            ['category' => 'Personenstand & Identität', 'name' => 'Aufenthaltsbescheinigung'],
            ['category' => 'Personenstand & Identität', 'name' => 'Aufenthaltstitel / Visum'],
            ['category' => 'Personenstand & Identität', 'name' => 'Eheurkunde / Heiratsurkunde'],
            ['category' => 'Personenstand & Identität', 'name' => 'Einbürgerungsurkunde'],
            ['category' => 'Personenstand & Identität', 'name' => 'Familienbuch'],
            ['category' => 'Personenstand & Identität', 'name' => 'Geburtsurkunde'],
            ['category' => 'Personenstand & Identität', 'name' => 'Ledigkeitsbescheinigung'],
            ['category' => 'Personenstand & Identität', 'name' => 'Meldebescheinigung'],
            ['category' => 'Personenstand & Identität', 'name' => 'Namensänderungsurkunde'],
            ['category' => 'Personenstand & Identität', 'name' => 'Personalausweis'],
            ['category' => 'Personenstand & Identität', 'name' => 'Reisepass'],
            ['category' => 'Personenstand & Identität', 'name' => 'Scheidungsurteil / Scheidungsurkunde'],
            ['category' => 'Personenstand & Identität', 'name' => 'Staatsangehörigkeitsnachweis'],
            ['category' => 'Personenstand & Identität', 'name' => 'Sterbeurkunde'],
            ['category' => 'Personenstand & Identität', 'name' => 'Vaterschaftsanerkennung'],
            ['category' => 'Personenstand & Identität', 'name' => 'Wohnsitzbescheinigung'],

            // Bildung & Karriere
            ['category' => 'Bildung & Karriere', 'name' => 'Abiturzeugnis'],
            ['category' => 'Bildung & Karriere', 'name' => 'Approbationsurkunde'],
            ['category' => 'Bildung & Karriere', 'name' => 'Arbeitsbuch'],
            ['category' => 'Bildung & Karriere', 'name' => 'Arbeitszeugnis'],
            ['category' => 'Bildung & Karriere', 'name' => 'Bachelorzeugnis'],
            ['category' => 'Bildung & Karriere', 'name' => 'Diplomurkunde / Diplomzeugnis'],
            ['category' => 'Bildung & Karriere', 'name' => 'Empfehlungsschreiben'],
            ['category' => 'Bildung & Karriere', 'name' => 'Forschungsbericht'],
            ['category' => 'Bildung & Karriere', 'name' => 'Gesellenbrief'],
            ['category' => 'Bildung & Karriere', 'name' => 'Habilitationsurkunde'],
            ['category' => 'Bildung & Karriere', 'name' => 'Lebenslauf (CV)'],
            ['category' => 'Bildung & Karriere', 'name' => 'Masterzeugnis'],
            ['category' => 'Bildung & Karriere', 'name' => 'Meisterbrief'],
            ['category' => 'Bildung & Karriere', 'name' => 'Motivationsschreiben'],
            ['category' => 'Bildung & Karriere', 'name' => 'Promotionsurkunde (Doktorurkunde)'],
            ['category' => 'Bildung & Karriere', 'name' => 'Schulzeugnis'],
            ['category' => 'Bildung & Karriere', 'name' => 'Studienbescheinigung'],
            ['category' => 'Bildung & Karriere', 'name' => 'Transcript of Records'],

            // Recht & Behörden
            ['category' => 'Recht & Behörden', 'name' => 'Anklageschrift'],
            ['category' => 'Recht & Behörden', 'name' => 'Apostille'],
            ['category' => 'Recht & Behörden', 'name' => 'Beglaubigungsvermerk'],
            ['category' => 'Recht & Behörden', 'name' => 'Eerbschein'],
            ['category' => 'Recht & Behörden', 'name' => 'Eidesstattliche Versicherung'],
            ['category' => 'Recht & Behörden', 'name' => 'Ermittlungsakte'],
            ['category' => 'Recht & Behörden', 'name' => 'Führerschein'],
            ['category' => 'Recht & Behörden', 'name' => 'Führungszeugnis'],
            ['category' => 'Recht & Behörden', 'name' => 'Gerichtsurteil'],
            ['category' => 'Recht & Behörden', 'name' => 'Haftbefehl'],
            ['category' => 'Recht & Behörden', 'name' => 'Klageerwiderung'],
            ['category' => 'Recht & Behörden', 'name' => 'Klageschrift'],
            ['category' => 'Recht & Behörden', 'name' => 'Notarielle Urkunde'],
            ['category' => 'Recht & Behörden', 'name' => 'Patentschrift'],
            ['category' => 'Recht & Behörden', 'name' => 'Rechtshilfeersuchen'],
            ['category' => 'Recht & Behörden', 'name' => 'Schriftsatz'],
            ['category' => 'Recht & Behörden', 'name' => 'Strafbefehl'],
            ['category' => 'Recht & Behörden', 'name' => 'Testament'],
            ['category' => 'Recht & Behörden', 'name' => 'Vollmacht'],
            ['category' => 'Recht & Behörden', 'name' => 'Vollstreckungsbescheid'],

            // Wirtschaft & Verträge
            ['category' => 'Wirtschaft & Verträge', 'name' => 'AGB (Allgemeine Geschäftsbedingungen)'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Arbeitsvertrag'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Bankauszug'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Bilanzen'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'DSGVO / Datenschutzerklärung'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Gewerbeanmeldung'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Handelsregisterauszug'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Immobilienkaufvertrag'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Insolvenzbekanntmachung'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Jahresabschluss'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Kaufvertrag'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Leasingvertrag'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Mietvertrag / Pachtvertrag'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Rentenbescheid'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Steuerbescheid / Steuererklärung'],
            ['category' => 'Wirtschaft & Verträge', 'name' => 'Versicherungspolice'],

            // Medizin & Technik
            ['category' => 'Medizin & Technik', 'name' => 'Arztbericht / Attest'],
            ['category' => 'Medizin & Technik', 'name' => 'Bedienungsanleitung'],
            ['category' => 'Medizin & Technik', 'name' => 'Beipackzettel'],
            ['category' => 'Medizin & Technik', 'name' => 'Datenblatt'],
            ['category' => 'Medizin & Technik', 'name' => 'Impfpass'],
            ['category' => 'Medizin & Technik', 'name' => 'Klinische Studie'],
            ['category' => 'Medizin & Technik', 'name' => 'Medizinischer Befund'],
            ['category' => 'Medizin & Technik', 'name' => 'Sicherheitsdatenblatt'],
            ['category' => 'Medizin & Technik', 'name' => 'Technische Dokumentation / Zeichnung'],
            ['category' => 'Medizin & Technik', 'name' => 'Zulassungsbescheinigung (KFZ)'],

            // Marketing & Sonstiges
            ['category' => 'Marketing & Sonstiges', 'name' => 'Broschüre / Flyer'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Katalog'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Newsletter'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Pressemitteilung'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Privatkorrespondenz'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Website-Inhalte / Blog'],
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
