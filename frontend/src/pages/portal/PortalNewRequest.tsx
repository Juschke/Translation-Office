import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, DatePicker, Form, Input, Select, Upload } from 'antd';
import { Check, ChevronRight, FileText, UploadCloud, UserRound } from 'lucide-react';
import type { UploadFile } from 'antd/es/upload/interface';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { portalRequestService } from '../../api/services/portal';
import { usePortal } from '../../context/PortalContext';
import { Button } from '../../components/ui/button';

const { TextArea } = Input;
const { Dragger } = Upload;

const languageOptions = [
  'Deutsch',
  'Englisch',
  'Franzoesisch',
  'Spanisch',
  'Italienisch',
  'Niederlaendisch',
  'Portugiesisch',
  'Polnisch',
  'Tuerkisch',
  'Arabisch',
  'Chinesisch',
  'Japanisch',
];

type StepKey = 'general' | 'languages' | 'files' | 'summary';

interface RequestFormValues {
  project_name: string;
  service_type?: string;
  reference_number?: string;
  deadline?: dayjs.Dayjs;
  notes?: string;
  source_language: string;
  target_language: string;
  language_notes?: string;
}

const stepItems: Array<{ key: StepKey; number: number; label: string }> = [
  { key: 'general', number: 1, label: 'Allgemein' },
  { key: 'languages', number: 2, label: 'Sprachen' },
  { key: 'files', number: 3, label: 'Projektdateien' },
  { key: 'summary', number: 4, label: 'Zusammenfassung' },
];

const requiredMark = (label: string) => (
  <span className="inline-flex items-center gap-1">
    <span>{label}</span>
    <span className="text-[#0e5a67]">*</span>
  </span>
);

const formatFileSize = (size?: number) => {
  if (!size) return '-';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const PortalNewRequest: React.FC = () => {
  const navigate = useNavigate();
  const { customer } = usePortal();
  const [form] = Form.useForm<RequestFormValues>();
  const [currentStep, setCurrentStep] = useState<StepKey>('general');
  const [sourceFiles, setSourceFiles] = useState<UploadFile[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<UploadFile[]>([]);

  const values = Form.useWatch([], form);

  const mutation = useMutation({
    mutationFn: portalRequestService.create,
    onSuccess: () => {
      toast.success('Ihre Anfrage wurde erfolgreich uebermittelt.');
      navigate('/portal/projects');
    },
    onError: () => {
      // handled centrally
    },
  });

  const activeStepIndex = stepItems.findIndex((item) => item.key === currentStep);
  const contactName =
    customer?.company_name ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
    'Ihr Projektteam';

  const summaryData = useMemo(() => {
    const deadline = values?.deadline ? values.deadline.format('DD.MM.YYYY') : 'Kein Wunschtermin angegeben';
    return {
      projectName: values?.project_name || '-',
      serviceType: values?.service_type || 'Uebersetzung',
      referenceNumber: values?.reference_number || '-',
      deadline,
      sourceLanguage: values?.source_language || '-',
      targetLanguage: values?.target_language || '-',
      notes: values?.notes || '-',
      languageNotes: values?.language_notes || '-',
      fileCount: sourceFiles.length + referenceFiles.length,
    };
  }, [referenceFiles.length, sourceFiles.length, values]);

  const nextStep = async () => {
    if (currentStep === 'general') {
      await form.validateFields(['project_name', 'service_type', 'reference_number', 'deadline', 'notes']);
      setCurrentStep('languages');
      return;
    }

    if (currentStep === 'languages') {
      await form.validateFields(['source_language', 'target_language', 'language_notes']);
      setCurrentStep('files');
      return;
    }

    if (currentStep === 'files') {
      setCurrentStep('summary');
    }
  };

  const previousStep = () => {
    if (currentStep === 'summary') {
      setCurrentStep('files');
      return;
    }

    if (currentStep === 'files') {
      setCurrentStep('languages');
      return;
    }

    if (currentStep === 'languages') {
      setCurrentStep('general');
    }
  };

  const handleSubmit = async () => {
    const formValues = await form.validateFields();
    const formData = new FormData();

    formData.append('project_name', formValues.project_name);
    formData.append('source_language', formValues.source_language);
    formData.append('target_language', formValues.target_language);

    if (formValues.deadline) {
      formData.append('deadline', formValues.deadline.format('YYYY-MM-DD'));
    }

    const noteParts = [
      formValues.service_type ? `Leistungsart: ${formValues.service_type}` : null,
      formValues.reference_number ? `Referenznummer: ${formValues.reference_number}` : null,
      formValues.notes ? `Projektbeschreibung: ${formValues.notes}` : null,
      formValues.language_notes ? `Sprachhinweise: ${formValues.language_notes}` : null,
    ].filter(Boolean);

    if (noteParts.length > 0) {
      formData.append('notes', noteParts.join('\n\n'));
    }

    [...sourceFiles, ...referenceFiles].forEach((file) => {
      if (file.originFileObj) {
        formData.append('files[]', file.originFileObj);
      }
    });

    mutation.mutate(formData);
  };

  const renderStepContent = () => {
    if (currentStep === 'general') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-[34px] font-light tracking-tight text-slate-800">Allgemein</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Starten Sie Ihre Anfrage mit den wichtigsten Projektdaten. Je klarer die Angaben hier sind, desto schneller kann Ihr Projektmanager die Anfrage einordnen und vorbereiten.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Form.Item
              name="project_name"
              label={requiredMark('Projektname')}
              rules={[{ required: true, message: 'Bitte geben Sie einen Projektnamen ein.' }]}
            >
              <Input placeholder="z. B. Produktkatalog Fruehjahr 2026" />
            </Form.Item>

            <Form.Item name="service_type" label="Leistungsart">
              <Select
                placeholder="Bitte waehlen"
                options={[
                  { value: 'Uebersetzung', label: 'Uebersetzung' },
                  { value: 'Beglaubigte Uebersetzung', label: 'Beglaubigte Uebersetzung' },
                  { value: 'Korrektorat / Lektorat', label: 'Korrektorat / Lektorat' },
                  { value: 'Dolmetschen', label: 'Dolmetschen' },
                  { value: 'Sonstige Sprachdienstleistung', label: 'Sonstige Sprachdienstleistung' },
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Form.Item name="reference_number" label="Referenznummer">
              <Input placeholder="z. B. Ihre interne Vorgangsnummer" />
            </Form.Item>

            <Form.Item name="deadline" label="Gewuenschter Liefertermin">
              <DatePicker
                className="w-full"
                format="DD.MM.YYYY"
                placeholder="Datum auswaehlen"
                disabledDate={(date) => date.isBefore(dayjs().startOf('day'))}
              />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Beschreibung / Nachricht">
            <TextArea
              rows={6}
              placeholder="Beschreiben Sie kurz Inhalt, Zweck, Fachgebiet, Terminwunsch oder besondere Anforderungen."
            />
          </Form.Item>
        </div>
      );
    }

    if (currentStep === 'languages') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-[34px] font-light tracking-tight text-slate-800">Sprachen</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Geben Sie die gewuenschte Sprachkombination fuer Ihre Anfrage an. Weitere Hinweise, Varianten oder regionale Vorgaben koennen Sie darunter ergaenzen.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Form.Item
              name="source_language"
              label={requiredMark('Quellsprache')}
              rules={[{ required: true, message: 'Bitte waehlen Sie die Quellsprache.' }]}
            >
              <Select
                showSearch
                placeholder="Bitte waehlen"
                options={languageOptions.map((language) => ({ value: language, label: language }))}
              />
            </Form.Item>

            <Form.Item
              name="target_language"
              label={requiredMark('Zielsprache')}
              rules={[{ required: true, message: 'Bitte waehlen Sie die Zielsprache.' }]}
            >
              <Select
                showSearch
                placeholder="Bitte waehlen"
                options={languageOptions.map((language) => ({ value: language, label: language }))}
              />
            </Form.Item>
          </div>

          <Form.Item name="language_notes" label="Hinweise zur Sprachkombination">
            <TextArea
              rows={5}
              placeholder="z. B. Zielmarkt, Terminologie, bevorzugte Variante, Layoutsprache oder weitere Sprachversionen"
            />
          </Form.Item>
        </div>
      );
    }

    if (currentStep === 'files') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-[34px] font-light tracking-tight text-slate-800">Projektdateien</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Laden Sie Ihre Ausgangsdokumente und bei Bedarf zusaetzliche Referenzen hoch. Sie koennen Dateien auch spaeter noch nachreichen, falls Ihr Projektmanager Rueckfragen hat.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <div className="mb-3 text-sm font-medium text-slate-800">Quelldateien</div>
              <Dragger
                multiple
                fileList={sourceFiles}
                beforeUpload={() => false}
                onChange={({ fileList }) => setSourceFiles(fileList)}
                accept="*/*"
                className="[&_.ant-upload]:!py-10"
              >
                <p className="ant-upload-drag-icon">
                  <UploadCloud className="mx-auto h-8 w-8 text-[#0e5a67]" />
                </p>
                <p className="ant-upload-text text-sm">
                  Quelldateien hier ablegen oder <span className="text-[#0e5a67]">Dateien auswaehlen</span>
                </p>
                <p className="ant-upload-hint text-xs text-slate-400">
                  z. B. DOCX, PDF, XLSX, PPTX, IDML, ZIP oder weitere gaengige Formate
                </p>
              </Dragger>
            </div>

            <div>
              <div className="mb-3 text-sm font-medium text-slate-800">Referenzmaterial</div>
              <Dragger
                multiple
                fileList={referenceFiles}
                beforeUpload={() => false}
                onChange={({ fileList }) => setReferenceFiles(fileList)}
                accept="*/*"
                className="[&_.ant-upload]:!py-10"
              >
                <p className="ant-upload-drag-icon">
                  <FileText className="mx-auto h-8 w-8 text-[#0e5a67]" />
                </p>
                <p className="ant-upload-text text-sm">
                  Referenzdateien hier ablegen oder <span className="text-[#0e5a67]">Dateien auswaehlen</span>
                </p>
                <p className="ant-upload-hint text-xs text-slate-400">
                  Glossare, Styleguides, fruehere Uebersetzungen oder Freigabeunterlagen
                </p>
              </Dragger>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[34px] font-light tracking-tight text-slate-800">Zusammenfassung</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Pruefen Sie Ihre Angaben vor dem Absenden. Nach dem Versand geht die Anfrage direkt an Ihr Projektteam zur weiteren Bearbeitung.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-800">
              Projektdaten
            </div>
            <div className="grid gap-4 px-5 py-5 text-sm text-slate-700">
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Projektname</div>
                <div>{summaryData.projectName}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Leistungsart</div>
                <div>{summaryData.serviceType}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Referenznummer</div>
                <div>{summaryData.referenceNumber}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Liefertermin</div>
                <div>{summaryData.deadline}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Beschreibung</div>
                <div className="whitespace-pre-wrap">{summaryData.notes}</div>
              </div>
            </div>
          </div>

          <div className="border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-800">
              Sprachen und Dateien
            </div>
            <div className="grid gap-4 px-5 py-5 text-sm text-slate-700">
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Quellsprache</div>
                <div>{summaryData.sourceLanguage}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Zielsprache</div>
                <div>{summaryData.targetLanguage}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Sprachhinweise</div>
                <div className="whitespace-pre-wrap">{summaryData.languageNotes}</div>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-400">Anzahl Dateien</div>
                <div>{summaryData.fileCount}</div>
              </div>
              {(sourceFiles.length > 0 || referenceFiles.length > 0) && (
                <div className="space-y-3">
                  {sourceFiles.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Quelldateien</div>
                      <div className="space-y-2">
                        {sourceFiles.map((file) => (
                          <div key={file.uid} className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2">
                            <span className="truncate text-slate-800">{file.name}</span>
                            <span className="shrink-0 text-xs text-slate-500">{formatFileSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {referenceFiles.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Referenzmaterial</div>
                      <div className="space-y-2">
                        {referenceFiles.map((file) => (
                          <div key={file.uid} className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2">
                            <span className="truncate text-slate-800">{file.name}</span>
                            <span className="shrink-0 text-xs text-slate-500">{formatFileSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => {
    if (currentStep === 'general') {
      return (
        <>
          <Card className="border-0 bg-[#3f4143] text-white shadow-none">
            <div className="mb-5 text-[16px] font-normal">Ihr Ansprechpartner</div>
            <div className="space-y-2 text-sm text-white/90">
              <div className="font-medium text-white">{contactName}</div>
              {customer?.phone && <div>{customer.phone}</div>}
              {customer?.email && <div>{customer.email}</div>}
            </div>
          </Card>

          <Card className="border-0 bg-[#3f4143] text-white shadow-none">
            <div className="space-y-4 text-sm leading-6 text-white/85">
              <div className="font-medium text-white">So starten Sie Ihre Anfrage</div>
              <div>Geben Sie zuerst einen klaren Projektnamen und eine kurze Beschreibung an.</div>
              <div>Nutzen Sie die Referenznummer, wenn die Anfrage intern einem Vorgang zugeordnet werden soll.</div>
              <div>Falls ein Termin wichtig ist, koennen Sie bereits hier einen gewuenschten Liefertermin angeben.</div>
            </div>
          </Card>
        </>
      );
    }

    if (currentStep === 'languages') {
      return (
        <>
          <Card className="border-0 bg-[#3f4143] text-white shadow-none">
            <div className="mb-5 text-[16px] font-normal">Ihr Ansprechpartner</div>
            <div className="space-y-2 text-sm text-white/90">
              <div className="font-medium text-white">{contactName}</div>
              {customer?.phone && <div>{customer.phone}</div>}
              {customer?.email && <div>{customer.email}</div>}
            </div>
          </Card>

          <Card className="border-0 bg-[#3f4143] text-white shadow-none">
            <div className="space-y-4 text-sm leading-6 text-white/85">
              <div className="font-medium text-white">Hinweise zu den Sprachen</div>
              <div>Waehlen Sie die Hauptsprachkombination fuer diese Anfrage aus.</div>
              <div>Wenn regionale Varianten, Zielmaerkte oder Terminologie wichtig sind, tragen Sie diese bitte als Hinweis ein.</div>
              <div>Weitere Sprachwuensche koennen Sie ebenfalls im Hinweisfeld ergaenzen.</div>
            </div>
          </Card>
        </>
      );
    }

    if (currentStep === 'files') {
      return (
        <>
          <Card className="border-0 bg-[#3f4143] text-white shadow-none">
            <div className="mb-5 text-[16px] font-normal">Ihr Ansprechpartner</div>
            <div className="space-y-2 text-sm text-white/90">
              <div className="font-medium text-white">{contactName}</div>
              {customer?.phone && <div>{customer.phone}</div>}
              {customer?.email && <div>{customer.email}</div>}
            </div>
          </Card>

          <Card className="border-0 bg-[#3f4143] text-white shadow-none">
            <div className="space-y-4 text-sm leading-6 text-white/85">
              <div className="font-medium text-white">Dateien hochladen</div>
              <div>Fuegen Sie hier Ihre Ausgangsdokumente hinzu, damit Ihr Projektteam Umfang und Format direkt pruefen kann.</div>
              <div>Referenzmaterial wie Glossare, Freigaben oder fruehere Versionen hilft uns bei einer einheitlichen Bearbeitung.</div>
              <div>Falls Unterlagen noch fehlen, koennen diese spaeter im Projekt nachgereicht werden.</div>
            </div>
          </Card>
        </>
      );
    }

    return (
      <>
        <Card className="border-0 bg-[#3f4143] text-white shadow-none">
          <div className="mb-5 text-[16px] font-normal">Ihr Ansprechpartner</div>
          <div className="space-y-2 text-sm text-white/90">
            <div className="font-medium text-white">{contactName}</div>
            {customer?.phone && <div>{customer.phone}</div>}
            {customer?.email && <div>{customer.email}</div>}
          </div>
        </Card>

        <Card className="border-0 bg-[#3f4143] text-white shadow-none">
          <div className="space-y-4 text-sm leading-6 text-white/85">
            <div className="font-medium text-white">Fast geschafft</div>
            <div>Bitte pruefen Sie Ihre Angaben noch einmal sorgfaeltig, bevor Sie die Anfrage absenden.</div>
            <div>Nach dem Versand wird Ihre Anfrage direkt an das Projektteam uebermittelt und anschliessend im Portal weiterbearbeitet.</div>
            <div>Nicht bereit zum Senden? Sie koennen ueber Zurueck jederzeit noch Aenderungen vornehmen.</div>
          </div>
        </Card>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-white px-5 py-3 text-sm text-slate-700">
          Neue Anfrage
        </div>

        <div className="flex flex-wrap items-center gap-y-3 border-b border-slate-200 bg-[#fbfbfa] px-4 py-3">
          {stepItems.map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = index < activeStepIndex;

            return (
              <React.Fragment key={step.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (index <= activeStepIndex) {
                      setCurrentStep(step.key);
                    }
                  }}
                  className={`flex items-center gap-3 px-2 py-1 text-sm ${
                    index <= activeStepIndex ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                      isCompleted
                        ? 'border-[#0e5a67] bg-[#0e5a67] text-white'
                        : isActive
                          ? 'border-[#0e5a67] bg-white text-[#0e5a67]'
                          : 'border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step.number}
                  </span>
                  <span className={isActive ? 'font-medium text-slate-900' : 'text-slate-500'}>
                    {step.label}
                  </span>
                </button>

                {index < stepItems.length - 1 && <ChevronRight className="mx-1 h-4 w-4 text-slate-300" />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid gap-6 bg-[#f3f2ee] px-4 py-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6">
          <Card className="border border-slate-200 shadow-none">
            <Form
              form={form}
              layout="vertical"
              size="large"
              disabled={mutation.isPending}
              initialValues={{ service_type: 'Uebersetzung' }}
            >
              {renderStepContent()}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <div className="text-xs text-slate-500">Pflichtfelder sind mit * gekennzeichnet.</div>
                <div className="flex flex-wrap items-center gap-3">
                  {currentStep !== 'general' && (
                    <Button type="button" variant="secondary" onClick={previousStep} disabled={mutation.isPending}>
                      Zurueck
                    </Button>
                  )}

                  {currentStep !== 'summary' ? (
                    <Button type="button" variant="default" onClick={() => void nextStep()} disabled={mutation.isPending}>
                      Weiter
                    </Button>
                  ) : (
                    <Button type="button" variant="default" onClick={() => void handleSubmit()} disabled={mutation.isPending}>
                      {mutation.isPending ? 'Wird uebermittelt...' : 'Anfrage absenden'}
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          </Card>

          <div className="space-y-5">
            {renderSidebar()}

            <Card className="border border-slate-200 shadow-none">
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center bg-[#e4edf0] text-[#0e5a67]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Portal-Hinweis</div>
                  <div className="text-xs text-slate-500">Fuer Kunden, Partner und Projektmanager</div>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Diese Anfrage wird nach dem Absenden im Serviceportal weitergefuehrt. Rueckfragen, Statusaenderungen und weitere Dateien finden Sie anschliessend direkt im Projekt.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalNewRequest;
