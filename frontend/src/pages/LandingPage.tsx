import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';

type LeadFormState = {
    name: string;
    company: string;
    email: string;
    phone: string;
    team_size: string;
    reason: string;
    message: string;
};

const initialLeadForm: LeadFormState = {
    name: '',
    company: '',
    email: '',
    phone: '',
    team_size: '',
    reason: '',
    message: '',
};

const marketingPages = [
    { href: '#funktionen', label: 'Funktionen' },
    { href: '#ablauf', label: 'Ablauf' },
    { href: '#api', label: 'API' },
    { href: '#preise', label: 'Preise' },
    { href: '#vertrauen', label: 'Vertrauen' },
];

function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [formState, setFormState] = useState<LeadFormState>(initialLeadForm);
    const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const previousHeight = document.body.style.height;
        const previousTitle = document.title;

        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.title = 'TranslationOffice - Software fuer Uebersetzungsbueros';

        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.style.height = previousHeight;
            document.title = previousTitle;
        };
    }, []);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const messageClassName = useMemo(() => {
        if (!formStatus) {
            return '';
        }

        return formStatus.type === 'success'
            ? 'lead-form-message lead-form-message-success'
            : 'lead-form-message lead-form-message-error';
    }, [formStatus]);

    const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
        if (!href.startsWith('#')) {
            return;
        }

        const target = document.querySelector(href);
        if (!target) {
            return;
        }

        event.preventDefault();
        const navbarHeight = document.getElementById('navbar')?.offsetHeight ?? 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        setIsMobileMenuOpen(false);
    };

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;
        setFormState((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const email = formState.email.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFormStatus({
                type: 'error',
                message: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.',
            });
            return;
        }

        setIsSubmitting(true);
        setFormStatus(null);

        await new Promise((resolve) => window.setTimeout(resolve, 800));

        setFormStatus({
            type: 'success',
            message: 'Vielen Dank. Wir melden uns zeitnah mit einem passenden Vorschlag.',
        });
        setFormState(initialLeadForm);
        setIsSubmitting(false);
    };

    return (
        <div className="landing-page min-h-screen bg-stone-50 text-[#172423]">
            <nav
                id="navbar"
                className={`fixed top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur transition-all duration-300 ${isScrolled ? 'scrolled' : ''}`}
            >
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <a href="#hero" className="flex items-center gap-3 text-[#1B4D4F]" onClick={(event) => handleAnchorClick(event, '#hero')}>
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1B4D4F] font-extrabold text-white shadow-lg shadow-[#1B4D4F]/15">TO</span>
                        <span className="hidden text-xl font-extrabold sm:inline">TranslationOffice</span>
                    </a>

                    <div className="hidden items-center gap-8 text-sm font-semibold text-stone-700 md:flex">
                        {marketingPages.map((item) => (
                            <a key={item.href} href={item.href} className="hover:text-[#1B4D4F]" onClick={(event) => handleAnchorClick(event, item.href)}>
                                {item.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/auth"
                            className="hidden rounded-xl border border-stone-300 bg-white px-5 py-2.5 font-semibold text-stone-800 transition hover:border-stone-500 sm:inline-flex"
                        >
                            Login
                        </Link>
                        <a
                            href="#demo"
                            className="hidden rounded-xl bg-[#1B4D4F] px-5 py-2.5 font-semibold text-white shadow-lg shadow-[#1B4D4F]/15 transition hover:bg-[#143A3C] sm:inline-flex"
                            onClick={(event) => handleAnchorClick(event, '#demo')}
                        >
                            Produktdemo anfragen
                        </a>
                        <button
                            type="button"
                            className="text-stone-700 md:hidden"
                            aria-label="Menue oeffnen"
                            aria-expanded={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen((current) => !current)}
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="border-t border-stone-200 bg-white md:hidden">
                        <div className="flex flex-col gap-3 px-4 py-4 text-sm font-semibold">
                            {marketingPages.map((item) => (
                                <a key={item.href} href={item.href} className="py-2" onClick={(event) => handleAnchorClick(event, item.href)}>
                                    {item.label}
                                </a>
                            ))}
                            <Link
                                to="/auth"
                                className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-5 py-3 text-stone-800"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <a
                                href="#demo"
                                className="inline-flex justify-center rounded-xl bg-[#1B4D4F] px-5 py-3 text-white"
                                onClick={(event) => handleAnchorClick(event, '#demo')}
                            >
                                Produktdemo anfragen
                            </a>
                        </div>
                    </div>
                )}
            </nav>

            <main>
                <section id="hero" className="hero-bg px-0 pb-20 pt-28 sm:pb-24 sm:pt-36">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
                            <div>
                                <div className="section-kicker mb-5">Deutschsprachige Betriebssoftware fuer Uebersetzungsbueros</div>
                                <h1 className="display-title mb-6 text-4xl leading-tight text-stone-950 sm:text-5xl lg:text-6xl">
                                    Von der Anfrage bis zur Rechnung in einem klaren System.
                                </h1>
                                <p className="mb-8 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
                                    TranslationOffice verbindet Anfrage, Angebot, Auftrag, Lieferantensteuerung, Kundenportal und Abrechnung. So bleibt Ihr kompletter Ablauf an einem Ort.
                                </p>

                                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                                    <a
                                        href="#demo"
                                        className="inline-flex items-center justify-center rounded-xl bg-[#1B4D4F] px-7 py-4 font-semibold text-white shadow-lg shadow-[#1B4D4F]/15 transition hover:bg-[#143A3C]"
                                        onClick={(event) => handleAnchorClick(event, '#demo')}
                                    >
                                        Jetzt Demo anfragen
                                    </a>
                                    <a
                                        href="#preise"
                                        className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white/70 px-7 py-4 font-semibold text-stone-800 transition hover:border-stone-500"
                                        onClick={(event) => handleAnchorClick(event, '#preise')}
                                    >
                                        Preise ansehen
                                    </a>
                                </div>

                                <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-3">
                                    <div className="trust-pill">Deutschsprachige Oberflaeche</div>
                                    <div className="trust-pill">Kundenportal und Rollenmodell</div>
                                    <div className="trust-pill">Rechnungen, Mahnungen und API</div>
                                </div>
                            </div>

                            <div className="hero-panel">
                                <div className="hero-panel-head">
                                    <span>Betriebsansicht</span>
                                    <span className="text-[#1B4D4F]">TranslationOffice</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="module-row">
                                        <div>
                                            <h3>Anfragen, Angebote und Auftraege</h3>
                                            <p>Neue Auftraege strukturiert erfassen, kalkulieren und sauber weiterfuehren.</p>
                                        </div>
                                        <span className="module-tag">Vertrieb</span>
                                    </div>
                                    <div className="module-row">
                                        <div>
                                            <h3>Projekte und Termine</h3>
                                            <p>Status, Fristen, Dokumente, Kalender und operative Aufgaben.</p>
                                        </div>
                                        <span className="module-tag">Produktion</span>
                                    </div>
                                    <div className="module-row">
                                        <div>
                                            <h3>Kunden, Lieferanten und Portal</h3>
                                            <p>Ein zentraler Ort fuer Kunden, Sprachdienstleister, Uploads und Zusammenarbeit.</p>
                                        </div>
                                        <span className="module-tag">Kommunikation</span>
                                    </div>
                                    <div className="module-row">
                                        <div>
                                            <h3>Rechnung, Mahnung und Auswertungen</h3>
                                            <p>Finanzen, wiederkehrende Rechnungen, Auswertungen und Nachverfolgung.</p>
                                        </div>
                                        <span className="module-tag">Abrechnung</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="funktionen" className="border-y border-stone-200 bg-white py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 max-w-3xl">
                            <div className="section-kicker mb-4">Module</div>
                            <h2 className="display-title mb-4 text-3xl text-stone-950 sm:text-4xl">
                                Die gleiche Logik, die starke TMS-Plattformen gross gemacht hat.
                            </h2>
                            <p className="text-lg leading-8 text-stone-600">
                                Im Mittelpunkt stehen nicht Einzelfunktionen, sondern ein durchgaengiger Ablauf: Anfrage, Angebot, Auftrag, Ressourcen, Lieferung, Qualitaet und Abrechnung.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            <article className="serious-card">
                                <h3>Request, Quote, Order</h3>
                                <p>Anfragen werden zu Angeboten und Auftraegen, ohne dass Informationen mehrfach gepflegt werden muessen.</p>
                            </article>
                            <article className="serious-card">
                                <h3>Kunden- und Vendor-Management</h3>
                                <p>Kunden, Ansprechpartner, Lieferanten, Preislisten und Qualifikationen bleiben zentral und durchsuchbar.</p>
                            </article>
                            <article className="serious-card">
                                <h3>Job-Zuweisung und Ressourcen</h3>
                                <p>Passende Ressourcen lassen sich anhand von Sprache, Fachgebiet, Verfuegbarkeit und Preis schneller zuordnen.</p>
                            </article>
                            <article className="serious-card">
                                <h3>Portal fuer Kunden und Zusammenarbeit</h3>
                                <p>Dateien, Freigaben, Status und Rueckfragen laufen ueber einen geregelten Kanal statt ueber verstreute E-Mails.</p>
                            </article>
                            <article className="serious-card">
                                <h3>Admin, Rechte und Sicherheit</h3>
                                <p>Rollen, Zugriffe, individuelle Felder und Arbeitsbereiche lassen sich kontrolliert und nachvollziehbar steuern.</p>
                            </article>
                            <article className="serious-card">
                                <h3>Abrechnung, Reports und Auswertung</h3>
                                <p>Rechnungen, Mahnungen, Berichte und Kennzahlen greifen auf denselben Projekt- und Kundendatenstand zu.</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section id="ablauf" className="bg-[#F5F0E7] py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 max-w-3xl">
                            <div className="section-kicker mb-4">Ablauf</div>
                            <h2 className="display-title mb-4 text-3xl text-stone-950 sm:text-4xl">So sieht der typische Prozess aus.</h2>
                            <p className="text-lg leading-8 text-stone-600">
                                Inhaltlich orientiert sich der Aufbau an bewaehrten TMS-Ablaufen: erst Anfrage, dann Kalkulation, dann Auftrag, Ressourceneinsatz, Lieferung und Abrechnung.
                            </p>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-5">
                            {[
                                ['01', 'Anfrage erfassen', 'Kundendaten, Sprachen, Dateien und Anforderungen kommen strukturiert ins System.'],
                                ['02', 'Angebot erstellen', 'Preise, Leistungen und Fristen werden schnell kalkuliert und als Angebot vorbereitet.'],
                                ['03', 'Auftrag und Jobs', 'Aus dem Angebot wird ein Auftrag, inklusive Jobs, Dokumenten und Zustaendigkeiten.'],
                                ['04', 'Ressourcen steuern', 'Lieferanten, Deadlines und Rueckmeldungen werden direkt am Projekt organisiert.'],
                                ['05', 'Liefern und abrechnen', 'Finale Dateien, Portal-Kommunikation und Rechnung folgen auf demselben Datenstand.'],
                            ].map(([number, title, text]) => (
                                <article key={number} className="process-step">
                                    <div className="process-number">{number}</div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white py-24">
                    <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
                        <div>
                            <div className="section-kicker mb-4">Nutzen im Alltag</div>
                            <h2 className="display-title mb-4 text-3xl text-stone-950 sm:text-4xl">
                                Besonders stark wird die Plattform im Zusammenspiel.
                            </h2>
                            <p className="mb-8 text-lg leading-8 text-stone-600">
                                Der Mehrwert entsteht dann, wenn Vertrieb, Projektmanagement, Ressourcensteuerung, Portal und Abrechnung nicht mehr getrennt gedacht werden muessen.
                            </p>
                            <div className="space-y-4">
                                <div className="benefit-line"><span>Zentraler Datenstand fuer Request, Quote, Order und Invoice.</span></div>
                                <div className="benefit-line"><span>Kunden und Lieferanten arbeiten strukturierter ueber Portal und geregelte Zuweisungen zusammen.</span></div>
                                <div className="benefit-line"><span>Preislisten, Rollen und Rechte bleiben nachvollziehbar statt in Einzeldateien verteilt.</span></div>
                                <div className="benefit-line"><span>Automatisierung laesst sich spaeter auf einen stabilen Grundprozess setzen.</span></div>
                                <div className="benefit-line"><span>Reporting und Finanzen greifen auf echte operative Daten zu.</span></div>
                            </div>
                        </div>

                        <aside className="context-panel">
                            <h3>Besonders relevant fuer</h3>
                            <ul className="space-y-4 text-stone-200">
                                <li><strong>Leitung:</strong> wenn Wachstum nicht an fehlender Struktur scheitern soll.</li>
                                <li><strong>Projektmanagement:</strong> wenn Angebote, Jobs, Lieferanten und Lieferungen sauber zusammenlaufen muessen.</li>
                                <li><strong>Operations und Finance:</strong> wenn Reporting und Abrechnung direkt an den Projektprozess anschliessen sollen.</li>
                            </ul>
                        </aside>
                    </div>
                </section>

                <section id="api" className="bg-stone-950 py-24 text-stone-100">
                    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
                        <div>
                            <div className="section-kicker section-kicker-dark mb-4">API und Anbindung</div>
                            <h2 className="display-title mb-4 text-3xl text-white sm:text-4xl">Integrationen und Automatisierung gehoeren dazu.</h2>
                            <p className="mb-8 text-lg leading-8 text-stone-300">
                                Starke TMS-Plattformen enden nicht bei Projektmasken. Sie binden CAT-Tools, Formulare, Portale, CMS, CRM, Reporting und Finanzprozesse an.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="dark-card">REST API fuer Projekte, Kunden, Preise und weitere Fachobjekte</div>
                                <div className="dark-card">Saubere Grundlage fuer Portal-, Formular- und CRM-Prozesse</div>
                                <div className="dark-card">Anschlussfaehig fuer TMS-, CMS-, DMS- und Reporting-Szenarien</div>
                                <div className="dark-card">Automatisierung moeglich, ohne den Prozess aus der Hand zu geben</div>
                            </div>
                        </div>

                        <div className="integration-code">
                            <div className="mb-4 flex items-center justify-between text-sm text-stone-400">
                                <span>Beispiel fuer einen Projekt-Request</span>
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-300">API</span>
                            </div>
                            <pre className="overflow-x-auto text-sm leading-7">
                                <code>{`{
  "customer": "Muster GmbH",
  "sourceLanguage": "de",
  "targetLanguage": "en",
  "deadline": "2026-04-14",
  "status": "open"
}`}</code>
                            </pre>
                            <p className="mt-5 text-sm text-stone-400">
                                Typische Einsatzfaelle sind automatisierte Anfragewege, Systemanbindungen, Preisberechnungen und projektnahe Auswertungen.
                            </p>
                        </div>
                    </div>
                </section>

                <section id="vertrauen" className="bg-white py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 max-w-3xl">
                            <div className="section-kicker mb-4">Vertrauen</div>
                            <h2 className="display-title mb-4 text-3xl text-stone-950 sm:text-4xl">
                                Sicherheit, Qualitaet und Steuerbarkeit gehoeren auf die Startseite.
                            </h2>
                            <p className="text-lg leading-8 text-stone-600">
                                Auch inhaltlich orientiert sich die Seite an dem, was etablierte TMS-Loesungen stark macht: Rechte, Datenschutz, Qualitaet, Ressourcen und nachvollziehbare Workflows.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            <article className="serious-card serious-card-muted">
                                <h3>Rechte und Rollen</h3>
                                <p>Benutzer sehen nur das, was fuer ihre Rolle vorgesehen ist. Das schafft Klarheit und Sicherheit im Tagesbetrieb.</p>
                            </article>
                            <article className="serious-card serious-card-muted">
                                <h3>Datenschutz und Kontrolle</h3>
                                <p>Kontakte, Projektinformationen und Zugriffe bleiben in einem geregelten System statt in verteilten Einzeltools.</p>
                            </article>
                            <article className="serious-card serious-card-muted">
                                <h3>Qualitaetsprozesse</h3>
                                <p>Feedback, Reklamationen, Dokumentation und vendorbezogene Bewertungen lassen sich sauber abbilden.</p>
                            </article>
                            <article className="serious-card serious-card-muted">
                                <h3>Kunden- und Lieferantenportale</h3>
                                <p>Dateien, Freigaben und Rueckmeldungen bleiben direkt am Vorgang und nicht in losen E-Mail-Ketten.</p>
                            </article>
                            <article className="serious-card serious-card-muted">
                                <h3>Automatisierung mit Eingriffsmoeglichkeit</h3>
                                <p>Wiederkehrende Schritte koennen beschleunigt werden, ohne dass Projektmanager die Kontrolle verlieren.</p>
                            </article>
                            <article className="serious-card serious-card-muted">
                                <h3>Geeignet fuer wachsende Bueros</h3>
                                <p>Die Struktur traegt auch dann noch, wenn mehr Kunden, mehr Jobs, mehr Rollen und mehr Integrationen dazukommen.</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section id="preise" className="border-y border-stone-200 bg-[#F5F0E7] py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 max-w-3xl">
                            <div className="section-kicker mb-4">Preise</div>
                            <h2 className="display-title mb-4 text-3xl text-stone-950 sm:text-4xl">Klare Pakete. Ohne Umwege.</h2>
                            <p className="text-lg leading-8 text-stone-600">Sie koennen klein starten und spaeter ausbauen.</p>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <article className="pricing-card">
                                <div className="pricing-plan">Basis</div>
                                <div className="pricing-amount">49 <span>EUR/Monat</span></div>
                                <p className="pricing-copy">Fuer kleine Bueros, die endlich zentral arbeiten wollen.</p>
                                <ul className="pricing-list">
                                    <li>1 Nutzer</li>
                                    <li>Projektverwaltung</li>
                                    <li>Kundenportal</li>
                                    <li>Basis-Auswertungen</li>
                                </ul>
                            </article>

                            <article className="pricing-card pricing-card-featured">
                                <div className="pricing-plan">Team</div>
                                <div className="pricing-amount">99 <span>EUR/Monat</span></div>
                                <p className="pricing-copy">Fuer Teams, die Projekte, Abrechnung und Rollen sauber steuern wollen.</p>
                                <ul className="pricing-list">
                                    <li>Mehrere Nutzer</li>
                                    <li>Rechnungen und Mahnungen</li>
                                    <li>API und Integrationen</li>
                                    <li>Auswertungen und Portal</li>
                                </ul>
                            </article>

                            <article className="pricing-card">
                                <div className="pricing-plan">Individuell</div>
                                <div className="pricing-amount">Individuell</div>
                                <p className="pricing-copy">Fuer groessere Anforderungen, Migrationen und individuelle Prozesse.</p>
                                <ul className="pricing-list">
                                    <li>Individuelle Einfuehrung</li>
                                    <li>Erweiterte Betreuung</li>
                                    <li>Individuelle Integrationen</li>
                                    <li>Ausbau fuer groessere Bueros</li>
                                </ul>
                            </article>
                        </div>
                    </div>
                </section>

                <section id="faq" className="bg-white py-24">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center">
                            <div className="section-kicker mb-4">FAQ</div>
                            <h2 className="display-title mb-4 text-3xl text-stone-950 sm:text-4xl">Kurz beantwortet</h2>
                        </div>

                        <div className="space-y-4">
                            <details className="faq-detail">
                                <summary>Fuer welche Teams ist TranslationOffice gedacht?</summary>
                                <p>Fuer Uebersetzungsbueros und Sprachdienstleister, die ihren Alltag sauber strukturieren wollen.</p>
                            </details>
                            <details className="faq-detail">
                                <summary>Welche Bereiche deckt die Anwendung ab?</summary>
                                <p>Anfragen, Projekte, Kunden, Partner, Portal, Rechnungen und Auswertungen.</p>
                            </details>
                            <details className="faq-detail">
                                <summary>Gibt es ein Kundenportal und technische Anbindungen?</summary>
                                <p>Ja. Kundenportal und technische Anbindungen sind vorgesehen.</p>
                            </details>
                            <details className="faq-detail">
                                <summary>Kann die Anwendung mit mehreren Rollen genutzt werden?</summary>
                                <p>Ja. Rollen und Verantwortlichkeiten lassen sich sauber abbilden.</p>
                            </details>
                            <details className="faq-detail">
                                <summary>Wie laeuft der Einstieg ab?</summary>
                                <p>Wir schauen uns gemeinsam Ihren Ablauf an und pruefen, ob TranslationOffice dazu passt.</p>
                            </details>
                        </div>
                    </div>
                </section>

                <section id="demo" className="bg-stone-950 py-24 text-white">
                    <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <div>
                            <div className="section-kicker section-kicker-dark mb-4">Demo</div>
                            <h2 className="display-title mb-4 text-3xl text-white sm:text-4xl">Lassen Sie uns auf Ihr Buero schauen.</h2>
                            <p className="mb-8 text-lg leading-8 text-stone-300">
                                In der Demo geht es nicht um Folien. Sondern darum, ob die Software Ihnen im Alltag wirklich Arbeit abnimmt.
                            </p>
                            <div className="space-y-4 text-stone-300">
                                <div className="dark-list-item">Ihr Ablauf statt Standardpraesentation</div>
                                <div className="dark-list-item">Klare Einschaetzung zu Nutzen und Einfuehrung</div>
                                <div className="dark-list-item">Direkte Antworten auf Ihre Fragen</div>
                            </div>
                        </div>

                        <div>
                            <form className="lead-form space-y-5 rounded-[28px] border border-white/10 bg-white p-8 text-stone-900 shadow-2xl" onSubmit={handleSubmit}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="mb-2 block font-semibold">Name</label>
                                        <input id="name" name="name" value={formState.name} onChange={handleChange} required className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
                                    </div>
                                    <div>
                                        <label htmlFor="company" className="mb-2 block font-semibold">Unternehmen</label>
                                        <input id="company" name="company" value={formState.company} onChange={handleChange} required className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="email" className="mb-2 block font-semibold">E-Mail</label>
                                        <input id="email" name="email" type="email" value={formState.email} onChange={handleChange} required className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="mb-2 block font-semibold">Telefon (optional)</label>
                                        <input id="phone" name="phone" value={formState.phone} onChange={handleChange} className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="team_size" className="mb-2 block font-semibold">Teamgroesse</label>
                                        <select id="team_size" name="team_size" value={formState.team_size} onChange={handleChange} className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3">
                                            <option value="">Bitte waehlen</option>
                                            <option value="1-3">1 bis 3 Personen</option>
                                            <option value="4-10">4 bis 10 Personen</option>
                                            <option value="11-25">11 bis 25 Personen</option>
                                            <option value="25+">Mehr als 25 Personen</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="reason" className="mb-2 block font-semibold">Ihr Anliegen</label>
                                        <select id="reason" name="reason" value={formState.reason} onChange={handleChange} className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3">
                                            <option value="">Bitte waehlen</option>
                                            <option value="demo">Produktdemo</option>
                                            <option value="migration">Wechsel von bestehender Loesung</option>
                                            <option value="api">API und Integrationen</option>
                                            <option value="pricing">Preise und Einfuehrung</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="message" className="mb-2 block font-semibold">Was moechten Sie konkret verbessern?</label>
                                    <textarea id="message" name="message" rows={4} value={formState.message} onChange={handleChange} className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
                                </div>
                                <p className="text-sm leading-6 text-stone-500">
                                    Je konkreter Ihre Angaben sind, desto besser koennen wir die Demo auf Ihren Ablauf vorbereiten.
                                </p>
                                {formStatus && <div className={messageClassName}>{formStatus.message}</div>}
                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-[#1B4D4F] py-3 font-semibold text-white transition hover:bg-[#143A3C] disabled:cursor-not-allowed disabled:opacity-70"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Wird gesendet...' : 'Rueckruf anfragen'}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-[#141716] py-16 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-10 md:grid-cols-4">
                        <div>
                            <div className="mb-4 flex items-center gap-3 text-xl font-extrabold">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1B4D4F]">TO</span>
                                TranslationOffice
                            </div>
                            <p className="leading-7 text-stone-400">
                                Software fuer Uebersetzungsbueros mit Fokus auf Anfrage, Projekt, Portal, Abrechnung und technisch anschlussfaehige Prozesse.
                            </p>
                        </div>
                        <div>
                            <h3 className="mb-4 font-bold text-white">Produkt</h3>
                            <div className="space-y-2 text-stone-400">
                                {marketingPages.slice(0, 4).map((item) => (
                                    <a key={item.href} href={item.href} className="footer-link" onClick={(event) => handleAnchorClick(event, item.href)}>
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-4 font-bold text-white">Weiteres</h3>
                            <div className="space-y-2 text-stone-400">
                                <a href="#faq" className="footer-link" onClick={(event) => handleAnchorClick(event, '#faq')}>FAQ</a>
                                <a href="#demo" className="footer-link" onClick={(event) => handleAnchorClick(event, '#demo')}>Demo</a>
                                <Link to="/auth" className="footer-link">Portal-Login</Link>
                                <a href="mailto:info@translationoffice.de" className="footer-link">info@translationoffice.de</a>
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-4 font-bold text-white">Recht und Kontakt</h3>
                            <div className="space-y-2 text-stone-400">
                                <a href="/landing-page/kontakt.html" className="footer-link">Kontakt</a>
                                <a href="/landing-page/impressum.html" className="footer-link">Impressum</a>
                                <a href="/landing-page/datenschutz.html" className="footer-link">Datenschutz</a>
                                <a href="/landing-page/agb.html" className="footer-link">AGB</a>
                                <a href="/landing-page/cookie.html" className="footer-link">Cookies</a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-sm text-stone-500 sm:flex-row">
                        <span>&copy; 2026 TranslationOffice GmbH</span>
                        <span>Entwickelt fuer Uebersetzungsbueros im deutschsprachigen Raum</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
