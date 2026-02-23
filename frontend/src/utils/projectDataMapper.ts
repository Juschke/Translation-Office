/**
 * Mappt Backend-Projektdaten (snake_case) auf die Frontend-Datenstruktur (camelCase).
 * Isoliert die Schemaübersetzung aus ProjectDetail.tsx für einfachere Wartung und Tests.
 */
export function mapProjectResponse(projectResponse: any) {
    return {
        id: projectResponse.id.toString(),
        name: projectResponse.project_name || '',
        client:
            projectResponse.customer?.company_name ||
            `${projectResponse.customer?.first_name} ${projectResponse.customer?.last_name}` ||
            'Unbekannter Kunde',
        customer_id: projectResponse.customer_id,
        customer: projectResponse.customer
            ? {
                id: projectResponse.customer.id.toString(),
                name:
                    projectResponse.customer.company_name ||
                    `${projectResponse.customer.first_name} ${projectResponse.customer.last_name}`,
                company_name: projectResponse.customer.company_name || '',
                first_name: projectResponse.customer.first_name || '',
                last_name: projectResponse.customer.last_name || '',
                contact: projectResponse.customer.company_name
                    ? `${projectResponse.customer.first_name} ${projectResponse.customer.last_name}`
                    : 'Privatkunde',
                email: projectResponse.customer.email || '',
                phone: projectResponse.customer.phone || '',
                initials: (
                    (projectResponse.customer.first_name?.[0] || '') +
                    (projectResponse.customer.last_name?.[0] || 'K')
                ).toUpperCase(),
                type: projectResponse.customer.type || 'client',
                address_street: projectResponse.customer.address_street || '',
                address_house_no: projectResponse.customer.address_house_no || '',
                address_zip: projectResponse.customer.address_zip || '',
                address_city: projectResponse.customer.address_city || '',
                address_country: projectResponse.customer.address_country || '',
            }
            : { id: '', name: 'Unbekannt', contact: '', email: '', phone: '', initials: '?', type: '' },
        source: projectResponse.source_language?.iso_code || projectResponse.source || 'de',
        target: projectResponse.target_language?.iso_code || projectResponse.target || 'en',
        source_language: projectResponse.source_language,
        target_language: projectResponse.target_language,
        progress: projectResponse.progress || 0,
        status: projectResponse.status || 'draft',
        priority: projectResponse.priority || 'medium',
        due: projectResponse.deadline || projectResponse.due || '',
        isCertified: !!projectResponse.is_certified,
        hasApostille: !!projectResponse.has_apostille,
        isExpress: !!projectResponse.is_express,
        classification: projectResponse.classification ? 'ja' : 'nein',
        copies: projectResponse.copies_count || 0,
        copyPrice: parseFloat(projectResponse.copy_price) || 5,
        docType: projectResponse.document_type
            ? [projectResponse.document_type.name]
            : projectResponse.document_type_id
                ? [projectResponse.document_type_id.toString()]
                : [],
        document_type_id: projectResponse.document_type_id,
        additional_doc_types: projectResponse.additional_doc_types,
        translator: projectResponse.partner
            ? {
                id: projectResponse.partner.id.toString(),
                name:
                    projectResponse.partner.company ||
                    `${projectResponse.partner.first_name} ${projectResponse.partner.last_name}`,
                email: projectResponse.partner.email,
                initials: (
                    (projectResponse.partner.first_name?.[0] || '') +
                    (projectResponse.partner.last_name?.[0] || 'P')
                ).toUpperCase(),
                phone: projectResponse.partner.phone || '',
                address_street: projectResponse.partner.address_street,
                address_house_no: projectResponse.partner.address_house_no,
                address_zip: projectResponse.partner.address_zip,
                address_city: projectResponse.partner.address_city,
                address_country: projectResponse.partner.address_country,
                rating: projectResponse.partner.rating,
                languages: projectResponse.partner.languages,
                unit_rates: Array.isArray(projectResponse.partner.unit_rates)
                    ? projectResponse.partner.unit_rates
                    : typeof projectResponse.partner.unit_rates === 'string'
                        ? JSON.parse(projectResponse.partner.unit_rates)
                        : [],
                flat_rates: Array.isArray(projectResponse.partner.flat_rates)
                    ? projectResponse.partner.flat_rates
                    : typeof projectResponse.partner.flat_rates === 'string'
                        ? JSON.parse(projectResponse.partner.flat_rates)
                        : [],
            }
            : { name: '-', email: '', initials: '?', phone: '' },
        documentsSent: !!projectResponse.documents_sent,
        pm: projectResponse.pm?.name || 'Admin',
        createdAt: new Date(projectResponse.created_at).toLocaleDateString('de-DE'),
        updatedAt: new Date(projectResponse.updated_at).toLocaleDateString('de-DE'),
        creator: projectResponse.creator,
        editor: projectResponse.editor,
        positions: (projectResponse.positions || []).map((p: any) => ({
            id: p.id.toString(),
            description: p.description,
            amount: p.amount?.toString() || '0',
            unit: p.unit,
            quantity: p.quantity?.toString() || '1',
            partnerRate: p.partner_rate?.toString() || '0',
            partnerMode: p.partner_mode,
            partnerTotal: p.partner_total?.toString() || '0',
            customerRate: p.customer_rate?.toString() || '0',
            customerTotal: p.customer_total?.toString() || '0',
            customerMode: p.customer_mode,
            marginType: p.margin_type,
            marginPercent: p.margin_percent?.toString() || '0',
        })),
        payments: projectResponse.payments ||
            (projectResponse.down_payment
                ? [
                    {
                        amount: projectResponse.down_payment,
                        payment_date: projectResponse.down_payment_date,
                        payment_method: projectResponse.down_payment_method,
                        note: projectResponse.down_payment_note,
                    },
                ]
                : []),
        notes: projectResponse.notes || '',
        messages: projectResponse.messages || [],
        access_token: projectResponse.access_token,
        invoices: (projectResponse.invoices || []).filter((inv: any) => inv.type !== 'credit_note'),
        files: (projectResponse.files || []).map((f: any) => ({
            id: f.id.toString(),
            name: f.file_name || f.original_name,
            fileName: f.file_name || f.original_name,
            original_name: f.original_name,
            ext: f.extension || (f.file_name || f.original_name || '').split('.').pop()?.toUpperCase() || '',
            extension: f.extension,
            type: f.type,
            mime_type: f.mime_type,
            version: f.version || '1.0',
            size: f.file_size,
            file_size: f.file_size,
            words: f.word_count || 0,
            chars: f.char_count || 0,
            word_count: f.word_count || 0,
            char_count: f.char_count || 0,
            createdAt: f.created_at,
            status: f.status || 'ready',
            uploaded_by: f.uploader?.name || f.uploader?.email || 'System',
            uploader: f.uploader,
            created_at: f.created_at,
            upload_date: f.created_at,
            upload_time: f.created_at
                ? new Date(f.created_at).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
                : '',
        })),
        appointment_location: projectResponse.appointment_location || '',
        customer_reference: projectResponse.customer_reference || '',
        customer_date: projectResponse.customer_date || null,
    };
}
