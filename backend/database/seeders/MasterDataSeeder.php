<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Language;
use App\Models\DocumentType;
use App\Models\Service;
use App\Models\EmailTemplate;
use App\Models\Specialization;
use App\Models\Unit;
use App\Models\Currency;
use App\Models\Tenant;
use App\Models\ProjectStatus;

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
            ['iso_code' => 'hy-AM', 'name_internal' => 'Armenisch', 'name_native' => 'Հայերen', 'flag_icon' => 'am'],
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
            ['iso_code' => 'so-SO', 'name_internal' => 'Somali', 'name_native' => 'Soomaali', 'flag_icon' => 'so'],
            ['iso_code' => 'sw-KE', 'name_internal' => 'Suaheli', 'name_native' => 'Kiswahili', 'flag_icon' => 'ke'],
            ['iso_code' => 'ti-ER', 'name_internal' => 'Tigrinya', 'name_native' => 'ትግርኛ', 'flag_icon' => 'er'],
        ];

        $i = 1;
        foreach ($languages as $lang) {
            $lang['code'] = str_pad($i++, 3, '0', STR_PAD_LEFT);
            Language::updateOrCreate(
                ['tenant_id' => $tenantId, 'iso_code' => $lang['iso_code']],
                $lang
            );
        }

        // 2. Categorized Document Types A-Z
        $docTypesData = [
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
            ['category' => 'Recht & Behörden', 'name' => 'Anklageschrift'],
            ['category' => 'Recht & Behörden', 'name' => 'Apostille'],
            ['category' => 'Recht & Behörden', 'name' => 'Beglaubigungsvermerk'],
            ['category' => 'Recht & Behörden', 'name' => 'Erbschein'],
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
            ['category' => 'Marketing & Sonstiges', 'name' => 'Broschüre / Flyer'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Katalog'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Newsletter'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Pressemitteilung'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Privatkorrespondenz'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Website-Inhalte / Blog'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Social Media Post'],
            ['category' => 'Marketing & Sonstiges', 'name' => 'Werbetext'],
        ];

        $i = 1;
        foreach ($docTypesData as $type) {
            $type['code'] = str_pad($i++, 3, '0', STR_PAD_LEFT);
            DocumentType::updateOrCreate(
                ['tenant_id' => $tenantId, 'name' => $type['name']],
                array_merge($type, ['status' => 'active'])
            );
        }

        // 3. Standard Service Packages
        $servicesData = [
            ['name' => 'Übersetzung (Standard)', 'unit' => 'word', 'base_price' => 0.12, 'status' => 'active'],
            ['name' => 'Fachübersetzung (Jura / Medizin)', 'unit' => 'word', 'base_price' => 0.18, 'status' => 'active'],
            ['name' => 'Beglaubigte Übersetzung', 'unit' => 'piece', 'base_price' => 15.00, 'status' => 'active'],
            ['name' => 'Beglaubigungspauschale', 'unit' => 'piece', 'base_price' => 10.00, 'status' => 'active'],
            ['name' => 'Apostille-Service', 'unit' => 'piece', 'base_price' => 25.00, 'status' => 'active'],
            ['name' => 'Dolmetschen (Simultan)', 'unit' => 'hour', 'base_price' => 120.00, 'status' => 'active'],
            ['name' => 'Dolmetschen (Konsekutiv)', 'unit' => 'hour', 'base_price' => 95.00, 'status' => 'active'],
            ['name' => 'Lektorat / Korrekturlesen', 'unit' => 'word', 'base_price' => 0.05, 'status' => 'active'],
            ['name' => 'Transkription (Audio/Video)', 'unit' => 'minute', 'base_price' => 2.50, 'status' => 'active'],
        ];

        $i = 1;
        foreach ($servicesData as $service) {
            $service['service_code'] = str_pad($i++, 3, '0', STR_PAD_LEFT);
            Service::updateOrCreate(['tenant_id' => $tenantId, 'name' => $service['name']], $service);
        }

        // 4. Email Templates
        $emailTemplatesData = [
            [
                'name' => 'Angebot Standard', 
                'type' => 'Angebot', 
                'subject' => 'Angebot {{project_number}} – {{project_name}}', 
                'status' => 'active', 
                'body' => "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage und das damit verbundene Interesse an unseren Dienstleistungen.\n\nAnbei erhalten Sie unser unverbindliches Angebot für Ihr Projekt {{project_name}} (Referenz: {{project_number}}). Wir würden uns freuen, Sie bei diesem Vorhaben unterstützen zu dürfen.\n\nFür Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.\n\nMit freundlichen Grüßen\n\nIhr Projekt-Team"
            ],
            [
                'name' => 'Rechnung Standard', 
                'type' => 'Rechnung', 
                'subject' => 'Rechnung {{invoice_number}} – {{project_name}}', 
                'status' => 'active', 
                'body' => "Sehr geehrte Damen und Herren,\n\nwie vereinbart übersenden wir Ihnen anbei die Rechnung {{invoice_number}} zu Ihrem Projekt {{project_name}}.\n\nBitte begleichen Sie den offenen Betrag bis zum angegebenen Zahlungsziel auf unser unten genanntes Bankkonto.\n\nVielen Dank für die gute Zusammenarbeit.\n\nMit freundlichen Grüßen\n\nIhre Buchhaltung"
            ],
            [
                'name' => 'Auftragsbestätigung', 
                'type' => 'Auftragsbestätigung', 
                'subject' => 'Auftragsbestätigung – Ihr Projekt {{project_number}}', 
                'status' => 'active', 
                'body' => "Sehr geehrte Damen und Herren,\n\nvielen Dank für die Erteilung des Auftrags. Hiermit bestätigen wir formell den Beginn der Arbeiten gemäß unserem Angebot für das Projekt {{project_number}}.\n\nWir werden Sie über den Fortschritt auf dem Laufenden halten und die Lieferung zum vereinbarten Termin sicherstellen.\n\nMit freundlichen Grüßen\n\nIhr Projekt-Management"
            ],
            [
                'name' => 'Partner-Anfrage', 
                'type' => 'Partner-Anfrage', 
                'subject' => 'Verfügbarkeitsanfrage für das Projekt {{project_name}}', 
                'status' => 'active', 
                'body' => "Guten Tag {{partner_name}},\n\nwir haben aktuell einen neuen Übersetzungsauftrag vorliegen und würden uns freuen, diesen mit Ihnen zusammenzuarbeiten.\n\nKönnten Sie uns bitte mitteilen, ob Sie für das Projekt {{project_name}} zeitlich verfügbar sind?\n\nÜber eine kurze Rückmeldung würden wir uns sehr freuen.\n\nBeste Grüße\n\nIhr Vendor-Management"
            ],
            [
                'name' => 'Abholbereit', 
                'type' => 'Abholbestätigung', 
                'subject' => 'Ihre bearbeiteten Dokumente sind abholbereit – {{project_number}}', 
                'status' => 'active', 
                'body' => "Sehr geehrte Damen und Herren,\n\nwir freuen uns, Ihnen mitteilen zu können, dass Ihr Auftrag mit der Nummer {{project_number}} erfolgreich fertiggestellt wurde.\n\nDie Dokumente stehen ab sofort zur Abholung bereit oder werden Ihnen, sofern vereinbart, auf dem Postweg zugestellt.\n\nMit freundlichen Grüßen\n\nIhr Service-Team"
            ],
        ];

        $i = 1;
        foreach ($emailTemplatesData as $tpl) {
            $tpl['code'] = str_pad($i++, 3, '0', STR_PAD_LEFT);
            EmailTemplate::updateOrCreate(['tenant_id' => $tenantId, 'name' => $tpl['name']], $tpl);
        }

        // 5. Specializations (Fachgebiete)
        $specializationsData = [
            ['name' => 'Recht & Verträge', 'status' => 'active'],
            ['name' => 'Medizin & Pharmazie', 'status' => 'active'],
            ['name' => 'Technik & Ingenieurwesen', 'status' => 'active'],
            ['name' => 'Wirtschaft & Finanzen', 'status' => 'active'],
            ['name' => 'IT & Software', 'status' => 'active'],
            ['name' => 'Marketing & Werbung', 'status' => 'active'],
            ['name' => 'Behörden & Urkunden', 'status' => 'active'],
            ['name' => 'Wissenschaft & Forschung', 'status' => 'active'],
            ['name' => 'Literatur & Medien', 'status' => 'active'],
            ['name' => 'Tourismus & Reise', 'status' => 'active'],
            ['name' => 'Automotive', 'status' => 'active'],
            ['name' => 'Architektur & Bauwesen', 'status' => 'active'],
        ];

        $i = 1;
        foreach ($specializationsData as $spec) {
            $spec['code'] = str_pad($i++, 3, '0', STR_PAD_LEFT);
            Specialization::updateOrCreate(['tenant_id' => $tenantId, 'name' => $spec['name']], $spec);
        }

        // 6. Units (Einheiten)
        $unitsData = [
            ['name' => 'Wort', 'abbreviation' => 'Wrt', 'status' => 'active', 'type' => 'quantity', 'iso_unit_code' => 'WSD'],
            ['name' => 'Zeile', 'abbreviation' => 'Zl', 'status' => 'active', 'type' => 'quantity', 'iso_unit_code' => '7I'],
            ['name' => 'Normseite', 'abbreviation' => 'NS', 'status' => 'active', 'type' => 'quantity', 'iso_unit_code' => 'ZZ'],
            ['name' => 'Seite', 'abbreviation' => 'S.', 'status' => 'active', 'type' => 'quantity', 'iso_unit_code' => 'C62'],
            ['name' => 'Stunde', 'abbreviation' => 'Std', 'status' => 'active', 'type' => 'time', 'iso_unit_code' => 'HUR'],
            ['name' => 'Minute', 'abbreviation' => 'Min', 'status' => 'active', 'type' => 'time', 'iso_unit_code' => 'MIN'],
            ['name' => 'Pauschal', 'abbreviation' => 'Psch', 'status' => 'active', 'type' => 'fixed', 'iso_unit_code' => 'C62'],
        ];

        $i = 1;
        foreach ($unitsData as $unit) {
            $unit['code'] = str_pad($i++, 3, '0', STR_PAD_LEFT);
            Unit::updateOrCreate(['tenant_id' => $tenantId, 'name' => $unit['name']], $unit);
        }

        // 7. Project Statuses
        $statusesData = [
            ['name' => 'neu', 'label' => 'Neu', 'color' => 'slate', 'style' => 'bg-slate-50 text-slate-600 border-slate-200', 'sort_order' => 1],
            ['name' => 'angebot_erstellt', 'label' => 'Angebot erstellt', 'color' => 'blue', 'style' => 'bg-blue-50 text-blue-700 border-blue-200', 'sort_order' => 2],
            ['name' => 'bestatigt', 'label' => 'Bestätigt', 'color' => 'emerald', 'style' => 'bg-emerald-50 text-emerald-700 border-emerald-200', 'sort_order' => 3],
            ['name' => 'in_bearbeitung', 'label' => 'In Bearbeitung', 'color' => 'amber', 'style' => 'bg-amber-50 text-amber-700 border-amber-200', 'sort_order' => 4],
            ['name' => 'geliefert', 'label' => 'Geliefert', 'color' => 'indigo', 'style' => 'bg-indigo-50 text-indigo-700 border-indigo-200', 'sort_order' => 5],
            ['name' => 'abgeschlossen', 'label' => 'Abgeschlossen', 'color' => 'green', 'style' => 'bg-green-50 text-green-700 border-green-200', 'sort_order' => 6],
            ['name' => 'storniert', 'label' => 'Storniert', 'color' => 'rose', 'style' => 'bg-rose-50 text-rose-700 border-rose-200', 'sort_order' => 7],
        ];

        $i = 1;
        foreach ($statusesData as $status) {
            $status['code'] = str_pad($i++, 3, '0', STR_PAD_LEFT);
            ProjectStatus::updateOrCreate(['tenant_id' => $tenantId, 'name' => $status['name']], array_merge($status, ['is_active' => true]));
        }

        // 8. Currencies
        $currenciesData = [
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'is_default' => true, 'status' => 'active'],
            ['code' => 'USD', 'name' => 'US-Dollar', 'symbol' => '$', 'is_default' => false, 'status' => 'active'],
        ];

        foreach ($currenciesData as $currency) {
            Currency::updateOrCreate(['tenant_id' => $tenantId, 'code' => $currency['code']], $currency);
        }

        // 9. Number Circle Settings
        $numberSettings = [
            'customer_id_prefix' => 'K',
            'customer_padding' => '5',
            'customer_separator' => '-',
            'customer_year_format' => 'YY',
            'partner_id_prefix' => 'P',
            'partner_padding' => '5',
            'partner_separator' => '-',
            'partner_year_format' => 'YY',
            'project_id_prefix' => 'PO',
            'project_padding' => '5',
            'project_separator' => '-',
            'project_year_format' => 'YY',
            'invoice_prefix' => 'RE',
            'invoice_padding' => '5',
            'invoice_separator' => '-',
            'invoice_year_format' => 'YY',
            'invoice_reset_yearly' => '1',
            'offer_id_prefix' => 'AN',
            'offer_padding' => '5',
            'offer_separator' => '-',
            'offer_year_format' => 'YY',
            'credit_note_prefix' => 'G',
            'credit_note_padding' => '5',
            'credit_note_separator' => '-',
            'credit_note_year_format' => 'YY',
        ];

        foreach ($numberSettings as $key => $value) {
            \App\Models\TenantSetting::updateOrCreate(
                ['tenant_id' => $tenantId, 'key' => $key],
                ['value' => $value]
            );
        }
    }
}
