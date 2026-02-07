<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectFileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Check if user has access to this project
        $project = $this->route('project');
        return $project && $this->user()->can('update', $project);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:51200', // 50MB max
                'mimes:pdf,doc,docx,txt,rtf,odt,jpg,jpeg,png,gif,svg,xlsx,xls,pptx,ppt,zip,rar,7z,idml,indd,ai,psd',
            ],
            'type' => 'required|in:source,target,reference',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Bitte wählen Sie eine Datei aus.',
            'file.file' => 'Die hochgeladene Datei ist ungültig.',
            'file.max' => 'Die Datei darf maximal 50MB groß sein.',
            'file.mimes' => 'Dieser Dateityp wird nicht unterstützt. Erlaubte Formate: PDF, DOC, DOCX, TXT, Bilder, Excel, PowerPoint, ZIP, etc.',
            'type.required' => 'Bitte geben Sie den Dateityp an.',
            'type.in' => 'Ungültiger Dateityp. Erlaubt: source, target, reference.',
        ];
    }
}
