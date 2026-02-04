<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class WordCountService
{
    /**
     * Count words in the uploaded file.
     * 
     * @param UploadedFile $file
     * @return int
     */
    public function countWords(UploadedFile $file): int
    {
        $extension = $file->getClientOriginalExtension();
        $content = '';

        try {
            if ($extension === 'txt') {
                $content = file_get_contents($file->getRealPath());
            } elseif ($extension === 'docx') {
                $content = $this->readDocx($file->getRealPath());
            }
            // Add more formats here (PDF requires external libs usually)

            // Simple word count by splitting whitespace
            $wordCount = str_word_count(strip_tags($content));

            // Fallback if 0 (e.g. for non-latin scripts or failed parsing) - very basic approximation
            if ($wordCount === 0 && strlen($content) > 0) {
                $wordCount = (int) (strlen($content) / 6); // Avg word length
            }

            return $wordCount;

        } catch (\Exception $e) {
            // Log error
            return 0;
        }
    }

    private function readDocx($filename)
    {
        $striped_content = '';
        $content = '';

        $zip = zip_open($filename);

        if (!$zip || is_numeric($zip))
            return false;

        while ($zip_entry = zip_read($zip)) {

            if (zip_entry_open($zip, $zip_entry) == FALSE)
                continue;

            if (zip_entry_name($zip_entry) != "word/document.xml")
                continue;

            $content .= zip_entry_read($zip_entry, zip_entry_filesize($zip_entry));

            zip_entry_close($zip_entry);
        }
        zip_close($zip);

        $content = str_replace('</w:r></w:p></w:tc><w:tc>', " ", $content);
        $content = str_replace('</w:r></w:p>', "\r\n", $content);
        $striped_content = strip_tags($content);

        return $striped_content;
    }
}
