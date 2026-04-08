# Datenbank-Schema-Referenz

Stand: Live-Datenbank `db_tmsoffice` am 7. April 2026.

## Tabellen

### `activity_log`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `log_name` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `description` | `text` | `NO` | `` | `NULL` | `` |
| `subject_type` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `event` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `subject_id` | `bigint(20) unsigned` | `YES` | `` | `NULL` | `` |
| `causer_type` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `causer_id` | `bigint(20) unsigned` | `YES` | `` | `NULL` | `` |
| `properties` | `longtext` | `YES` | `` | `NULL` | `` |
| `batch_uuid` | `char(36)` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `api_request_logs`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `method` | `varchar(10)` | `NO` | `` | `NULL` | `` |
| `url` | `varchar(500)` | `NO` | `` | `NULL` | `` |
| `endpoint` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `status_code` | `int(11)` | `NO` | `MUL` | `NULL` | `` |
| `query_params` | `text` | `YES` | `` | `NULL` | `` |
| `request_body` | `longtext` | `YES` | `` | `NULL` | `` |
| `request_headers` | `text` | `YES` | `` | `NULL` | `` |
| `response_body` | `longtext` | `YES` | `` | `NULL` | `` |
| `response_headers` | `text` | `YES` | `` | `NULL` | `` |
| `duration_ms` | `float` | `NO` | `` | `NULL` | `` |
| `memory_usage` | `int(11)` | `YES` | `` | `NULL` | `` |
| `ip_address` | `varchar(45)` | `NO` | `MUL` | `NULL` | `` |
| `user_agent` | `varchar(500)` | `YES` | `` | `NULL` | `` |
| `referer` | `varchar(500)` | `YES` | `` | `NULL` | `` |
| `user_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `tenant_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `user_email` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `error_message` | `text` | `YES` | `` | `NULL` | `` |
| `error_trace` | `text` | `YES` | `` | `NULL` | `` |
| `session_id` | `varchar(100)` | `YES` | `MUL` | `NULL` | `` |
| `request_id` | `varchar(100)` | `YES` | `MUL` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `MUL` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `appointments`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `title` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `description` | `text` | `YES` | `` | `NULL` | `` |
| `start_date` | `datetime` | `NO` | `MUL` | `NULL` | `` |
| `end_date` | `datetime` | `YES` | `` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `` | `'meeting'` | `` |
| `location` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `project_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `customer_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `partner_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `user_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `status` | `varchar(255)` | `NO` | `` | `'active'` | `` |
| `color` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `user_id` -> `users.id`
- `project_id` -> `projects.id`
- `partner_id` -> `partners.id`
- `customer_id` -> `customers.id`

### `cache`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `key` | `varchar(255)` | `NO` | `PRI` | `NULL` | `` |
| `value` | `mediumtext` | `NO` | `` | `NULL` | `` |
| `expiration` | `int(11)` | `NO` | `MUL` | `NULL` | `` |

### `cache_locks`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `key` | `varchar(255)` | `NO` | `PRI` | `NULL` | `` |
| `owner` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `expiration` | `int(11)` | `NO` | `MUL` | `NULL` | `` |

### `currencies`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `code` | `varchar(3)` | `NO` | `` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `symbol` | `varchar(5)` | `NO` | `` | `NULL` | `` |
| `is_default` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `status` | `enum('active','archived')` | `NO` | `` | `'active'` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `customers`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `type` | `enum('private','company','authority')` | `NO` | `` | `'private'` | `` |
| `legal_form` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `salutation` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `first_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `last_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `company_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `contact_person` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `email` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `additional_emails` | `longtext` | `YES` | `` | `NULL` | `` |
| `phone` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `mobile` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `additional_phones` | `longtext` | `YES` | `` | `NULL` | `` |
| `address_street` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_house_no` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_zip` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_city` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_country` | `varchar(255)` | `NO` | `` | `'DE'` | `` |
| `price_matrix_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `status` | `varchar(255)` | `NO` | `` | `'active'` | `` |
| `portal_access` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `portal_token` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `portal_token_expires_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `portal_session_token` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `portal_session_expires_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `portal_last_login_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `leitweg_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `payment_terms_days` | `int(11)` | `YES` | `` | `NULL` | `` |
| `bank_account_holder` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `iban` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bic` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_code` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `tax_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `vat_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `created_by` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `updated_by` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |

Foreign Keys:
- `created_by` -> `users.id`
- `updated_by` -> `users.id`
- `tenant_id` -> `tenants.id`
- `price_matrix_id` -> `price_matrices.id`

### `document_types`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `category` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `code` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `default_price` | `decimal(10,2)` | `YES` | `` | `NULL` | `` |
| `vat_rate` | `decimal(5,2)` | `NO` | `` | `19.00` | `` |
| `template_file` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `status` | `enum('active','inactive')` | `NO` | `` | `'active'` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `dunning_logs`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `invoice_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `level` | `tinyint(4)` | `NO` | `` | `NULL` | `` |
| `fee_cents` | `int(10) unsigned` | `NO` | `` | `0` | `` |
| `sent_at` | `datetime` | `NO` | `` | `NULL` | `` |
| `sent_by_user_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `pdf_path` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`
- `sent_by_user_id` -> `users.id`
- `invoice_id` -> `invoices.id`

### `dunning_settings`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `UNI` | `NULL` | `` |
| `level1_days_after_due` | `int(10) unsigned` | `NO` | `` | `0` | `` |
| `level1_fee_cents` | `int(10) unsigned` | `NO` | `` | `0` | `` |
| `level1_subject` | `varchar(255)` | `NO` | `` | `'Zahlungserinnerung ? Rechnung {{invoice_number}}'` | `` |
| `level1_body` | `text` | `NO` | `` | `'Sehr geehrte Damen und Herren,\\n\\nwir erlauben uns, Sie daran zu erinnern, dass die Zahlung f�r Rechnung {{invoice_number}} vom {{invoice_date}} in H�he von {{amount_gross}} noch aussteht.\\n\\nBitte begleichen Sie den Betrag bis zum {{due_date}}.\\n\\nMit freundlichen Gr��en'` | `` |
| `level2_days_after_due` | `int(10) unsigned` | `NO` | `` | `14` | `` |
| `level2_fee_cents` | `int(10) unsigned` | `NO` | `` | `500` | `` |
| `level2_subject` | `varchar(255)` | `NO` | `` | `'1. Mahnung ? Rechnung {{invoice_number}}'` | `` |
| `level2_body` | `text` | `NO` | `` | `'Sehr geehrte Damen und Herren,\\n\\nleider mussten wir feststellen, dass die Zahlung f�r Rechnung {{invoice_number}} in H�he von {{amount_gross}} trotz unserer Zahlungserinnerung noch nicht eingegangen ist.\\n\\nWir fordern Sie auf, den offenen Betrag zuz�glich einer Mahngeb�hr von {{fee}} bis zum {{new_due_date}} zu �berweisen.\\n\\nMit freundlichen Gr��en'` | `` |
| `level3_days_after_due` | `int(10) unsigned` | `NO` | `` | `28` | `` |
| `level3_fee_cents` | `int(10) unsigned` | `NO` | `` | `1000` | `` |
| `level3_subject` | `varchar(255)` | `NO` | `` | `'2. Mahnung ? Rechnung {{invoice_number}}'` | `` |
| `level3_body` | `text` | `NO` | `` | `'Sehr geehrte Damen und Herren,\\n\\ndies ist unsere letzte Mahnung. Die Zahlung f�r Rechnung {{invoice_number}} in H�he von {{amount_gross}} ist weiterhin ausstehend.\\n\\nSollte der Betrag zuz�glich Mahngeb�hren von {{fee}} nicht bis zum {{new_due_date}} eingehen, sehen wir uns gezwungen, rechtliche Schritte einzuleiten.\\n\\nMit freundlichen Gr��en'` | `` |
| `auto_escalate` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `email_templates`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `code` | `varchar(50)` | `YES` | `` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `subject` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `body` | `text` | `NO` | `` | `NULL` | `` |
| `type` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `status` | `enum('active','inactive')` | `NO` | `` | `'active'` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `external_costs`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `project_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `description` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `cost_type` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `amount_cents` | `int(11)` | `NO` | `` | `0` | `` |
| `date` | `date` | `NO` | `MUL` | `NULL` | `` |
| `supplier` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `project_id` -> `projects.id`
- `tenant_id` -> `tenants.id`

### `failed_jobs`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `uuid` | `varchar(255)` | `NO` | `UNI` | `NULL` | `` |
| `connection` | `text` | `NO` | `` | `NULL` | `` |
| `queue` | `text` | `NO` | `` | `NULL` | `` |
| `payload` | `longtext` | `NO` | `` | `NULL` | `` |
| `exception` | `longtext` | `NO` | `` | `NULL` | `` |
| `failed_at` | `timestamp` | `NO` | `` | `current_timestamp()` | `` |

### `health_check_result_history_items`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `check_name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `check_label` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `status` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `notification_message` | `text` | `YES` | `` | `NULL` | `` |
| `short_summary` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `meta` | `longtext` | `NO` | `` | `NULL` | `` |
| `ended_at` | `timestamp` | `NO` | `` | `current_timestamp()` | `on update current_timestamp()` |
| `batch` | `char(36)` | `NO` | `MUL` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `MUL` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `invoices`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `type` | `varchar(255)` | `NO` | `` | `'invoice'` | `` |
| `cancelled_invoice_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `recurring_invoice_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `invoice_number` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `invoice_number_sequence` | `int(10) unsigned` | `YES` | `` | `NULL` | `` |
| `project_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `customer_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `snapshot_customer_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `date` | `date` | `NO` | `` | `NULL` | `` |
| `delivery_date` | `date` | `YES` | `` | `NULL` | `` |
| `service_period_start` | `date` | `YES` | `` | `NULL` | `` |
| `service_period_end` | `date` | `YES` | `` | `NULL` | `` |
| `due_date` | `date` | `NO` | `` | `NULL` | `` |
| `amount_net` | `bigint(20)` | `NO` | `` | `0` | `` |
| `tax_rate` | `decimal(5,2)` | `NO` | `` | `19.00` | `` |
| `amount_tax` | `bigint(20)` | `NO` | `` | `0` | `` |
| `amount_gross` | `bigint(20)` | `NO` | `` | `0` | `` |
| `shipping_cents` | `bigint(20)` | `NO` | `` | `0` | `` |
| `discount_cents` | `bigint(20)` | `NO` | `` | `0` | `` |
| `paid_amount_cents` | `bigint(20)` | `NO` | `` | `0` | `` |
| `currency` | `varchar(3)` | `NO` | `` | `'EUR'` | `` |
| `payment_method` | `varchar(255)` | `NO` | `` | `'TRF'` | `` |
| `status` | `varchar(255)` | `NO` | `` | `'draft'` | `` |
| `is_locked` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `issued_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `tax_exemption` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `service_period` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `reminder_level` | `int(11)` | `NO` | `` | `0` | `` |
| `last_reminder_date` | `date` | `YES` | `` | `NULL` | `` |
| `pdf_path` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `snapshot_customer_address` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_customer_zip` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_customer_city` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_customer_country` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_customer_vat_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_customer_leitweg_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_customer_email` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_address` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_zip` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_city` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_country` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_tax_number` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_vat_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_email` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_bank_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_bank_iban` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_seller_bank_bic` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_project_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `snapshot_project_number` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `intro_text` | `text` | `YES` | `` | `NULL` | `` |
| `footer_text` | `text` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `recurring_invoice_id` -> `recurring_invoices.id`
- `project_id` -> `projects.id`
- `customer_id` -> `customers.id`
- `cancelled_invoice_id` -> `invoices.id`
- `tenant_id` -> `tenants.id`

### `invoice_audit_logs`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `invoice_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `user_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `action` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `old_status` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `new_status` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `metadata` | `longtext` | `YES` | `` | `NULL` | `` |
| `ip_address` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `NO` | `` | `current_timestamp()` | `` |

Foreign Keys:
- `user_id` -> `users.id`
- `invoice_id` -> `invoices.id`

### `invoice_items`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `invoice_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `tenant_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `position` | `int(10) unsigned` | `NO` | `` | `1` | `` |
| `description` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `quantity` | `decimal(12,4)` | `NO` | `` | `1.0000` | `` |
| `unit` | `varchar(255)` | `NO` | `` | `'words'` | `` |
| `unit_price_cents` | `bigint(20)` | `NO` | `` | `0` | `` |
| `total_cents` | `bigint(20)` | `NO` | `` | `0` | `` |
| `tax_rate` | `decimal(5,2)` | `NO` | `` | `19.00` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`
- `invoice_id` -> `invoices.id`

### `jobs`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `queue` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `payload` | `longtext` | `NO` | `` | `NULL` | `` |
| `attempts` | `tinyint(3) unsigned` | `NO` | `` | `NULL` | `` |
| `reserved_at` | `int(10) unsigned` | `YES` | `` | `NULL` | `` |
| `available_at` | `int(10) unsigned` | `NO` | `` | `NULL` | `` |
| `created_at` | `int(10) unsigned` | `NO` | `` | `NULL` | `` |

### `job_batches`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(255)` | `NO` | `PRI` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `total_jobs` | `int(11)` | `NO` | `` | `NULL` | `` |
| `pending_jobs` | `int(11)` | `NO` | `` | `NULL` | `` |
| `failed_jobs` | `int(11)` | `NO` | `` | `NULL` | `` |
| `failed_job_ids` | `longtext` | `NO` | `` | `NULL` | `` |
| `options` | `mediumtext` | `YES` | `` | `NULL` | `` |
| `cancelled_at` | `int(11)` | `YES` | `` | `NULL` | `` |
| `created_at` | `int(11)` | `NO` | `` | `NULL` | `` |
| `finished_at` | `int(11)` | `YES` | `` | `NULL` | `` |

### `languages`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `code` | `varchar(50)` | `YES` | `` | `NULL` | `` |
| `iso_code` | `varchar(10)` | `NO` | `` | `NULL` | `` |
| `name_internal` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `name_native` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `flag_icon` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `is_source_allowed` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `is_target_allowed` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `status` | `enum('active','archived')` | `NO` | `` | `'active'` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `mails`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `mail_account_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `message_id` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `folder` | `varchar(255)` | `NO` | `` | `'inbox'` | `` |
| `from_email` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `to_emails` | `text` | `YES` | `` | `NULL` | `` |
| `cc_emails` | `text` | `YES` | `` | `NULL` | `` |
| `subject` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `date` | `timestamp` | `YES` | `` | `NULL` | `` |
| `body` | `longtext` | `YES` | `` | `NULL` | `` |
| `is_read` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `attachments` | `longtext` | `YES` | `` | `NULL` | `` |
| `deleted_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`
- `mail_account_id` -> `mail_accounts.id`

### `mail_accounts`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `email` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `imap_host` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `imap_port` | `int(11)` | `NO` | `` | `993` | `` |
| `imap_encryption` | `varchar(255)` | `NO` | `` | `'ssl'` | `` |
| `smtp_host` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `smtp_port` | `int(11)` | `NO` | `` | `587` | `` |
| `smtp_encryption` | `varchar(255)` | `NO` | `` | `'''tls'''` | `` |
| `incoming_protocol` | `varchar(255)` | `NO` | `` | `'imap'` | `` |
| `username` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `password` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `is_default` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `is_active` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `mail_signatures`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `mail_account_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `content` | `longtext` | `NO` | `` | `NULL` | `` |
| `is_default` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`
- `mail_account_id` -> `mail_accounts.id`

### `mail_templates`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `subject` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `body` | `longtext` | `NO` | `` | `NULL` | `` |
| `category` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `placeholders` | `longtext` | `YES` | `` | `NULL` | `` |
| `is_active` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `messages`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `project_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `user_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `` | `'customer'` | `` |
| `content` | `text` | `NO` | `` | `NULL` | `` |
| `sender_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `is_read` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `project_file_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |

Foreign Keys:
- `user_id` -> `users.id`
- `project_id` -> `projects.id`
- `project_file_id` -> `project_files.id`

### `migrations`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `migration` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `batch` | `int(11)` | `NO` | `` | `NULL` | `` |

### `notifications`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `char(36)` | `NO` | `PRI` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `notifiable_type` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `notifiable_id` | `bigint(20) unsigned` | `NO` | `` | `NULL` | `` |
| `data` | `text` | `NO` | `` | `NULL` | `` |
| `read_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `partners`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `type` | `enum('translator','interpreter','trans_interp','agency')` | `NO` | `` | `'translator'` | `` |
| `salutation` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `first_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `last_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `company` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `email` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `additional_emails` | `longtext` | `YES` | `` | `NULL` | `` |
| `phone` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `mobile` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `additional_phones` | `longtext` | `YES` | `` | `NULL` | `` |
| `languages` | `longtext` | `YES` | `` | `NULL` | `` |
| `domains` | `longtext` | `YES` | `` | `NULL` | `` |
| `software` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_street` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_house_no` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_zip` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_city` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bic` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `iban` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `tax_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `payment_terms` | `int(11)` | `NO` | `` | `30` | `` |
| `price_mode` | `enum('per_unit','flat','matrix')` | `NO` | `` | `'per_unit'` | `` |
| `unit_rates` | `longtext` | `YES` | `` | `NULL` | `` |
| `flat_rates` | `longtext` | `YES` | `` | `NULL` | `` |
| `status` | `enum('available','busy','vacation','blacklisted','deleted')` | `NO` | `` | `'available'` | `` |
| `rating` | `int(11)` | `NO` | `` | `0` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `password_reset_tokens`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `email` | `varchar(255)` | `NO` | `PRI` | `NULL` | `` |
| `token` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `personal_access_tokens`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tokenable_type` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `tokenable_id` | `bigint(20) unsigned` | `NO` | `` | `NULL` | `` |
| `name` | `text` | `NO` | `` | `NULL` | `` |
| `token` | `varchar(64)` | `NO` | `UNI` | `NULL` | `` |
| `abilities` | `text` | `YES` | `` | `NULL` | `` |
| `last_used_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `expires_at` | `timestamp` | `YES` | `MUL` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `price_matrices`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `source_lang_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `target_lang_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `currency` | `varchar(3)` | `NO` | `` | `'EUR'` | `` |
| `price_per_word` | `decimal(10,4)` | `NO` | `` | `0.0000` | `` |
| `price_per_line` | `decimal(10,4)` | `NO` | `` | `0.0000` | `` |
| `minimum_charge` | `decimal(10,2)` | `NO` | `` | `0.00` | `` |
| `hourly_rate` | `decimal(10,2)` | `NO` | `` | `0.00` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `target_lang_id` -> `languages.id`
- `source_lang_id` -> `languages.id`
- `tenant_id` -> `tenants.id`

### `projects`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `custom_id` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `project_number` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `customer_reference` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `customer_date` | `datetime` | `YES` | `` | `NULL` | `` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `customer_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `partner_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `source_lang_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `target_lang_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `document_type_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `additional_doc_types` | `longtext` | `YES` | `` | `NULL` | `` |
| `project_name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `status` | `enum('draft','offer','pending','in_progress','review','ready_for_pickup','delivered','invoiced','completed','cancelled','archived','deleted')` | `YES` | `MUL` | `'draft'` | `` |
| `access_token` | `varchar(255)` | `YES` | `UNI` | `NULL` | `` |
| `partner_access_token` | `varchar(255)` | `YES` | `UNI` | `NULL` | `` |
| `priority` | `enum('low','medium','high')` | `NO` | `` | `'low'` | `` |
| `word_count` | `int(11)` | `NO` | `` | `0` | `` |
| `line_count` | `int(11)` | `NO` | `` | `0` | `` |
| `price_total` | `decimal(10,2)` | `YES` | `` | `NULL` | `` |
| `partner_cost_net` | `decimal(10,2)` | `NO` | `` | `0.00` | `` |
| `partner_paid` | `tinyint(1)` | `YES` | `` | `0` | `` |
| `partner_paid_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `down_payment` | `decimal(10,2)` | `NO` | `` | `0.00` | `` |
| `down_payment_date` | `datetime` | `YES` | `` | `NULL` | `` |
| `down_payment_note` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `currency` | `varchar(3)` | `NO` | `` | `'EUR'` | `` |
| `deadline` | `datetime` | `YES` | `` | `NULL` | `` |
| `appointment_location` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `is_certified` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `has_apostille` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `is_express` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `classification` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `copies_count` | `int(11)` | `NO` | `` | `0` | `` |
| `extra_services` | `longtext` | `YES` | `` | `NULL` | `` |
| `copy_price` | `decimal(10,4)` | `NO` | `` | `5.0000` | `` |
| `created_at` | `timestamp` | `YES` | `MUL` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `document_type_id` -> `document_types.id`
- `customer_id` -> `customers.id`
- `tenant_id` -> `tenants.id`
- `target_lang_id` -> `languages.id`
- `source_lang_id` -> `languages.id`
- `partner_id` -> `partners.id`

### `project_files`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `project_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `` | `'source'` | `` |
| `path` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `original_name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `file_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `mime_type` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `extension` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `file_size` | `bigint(20)` | `YES` | `` | `NULL` | `` |
| `word_count` | `int(11)` | `YES` | `` | `NULL` | `` |
| `char_count` | `int(11)` | `YES` | `` | `NULL` | `` |
| `version` | `varchar(255)` | `NO` | `` | `'1.0'` | `` |
| `status` | `varchar(255)` | `NO` | `` | `'ready'` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `uploaded_by` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `is_shared_with_customer` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `is_shared_with_partner` | `tinyint(1)` | `NO` | `` | `0` | `` |

Foreign Keys:
- `uploaded_by` -> `users.id`
- `tenant_id` -> `tenants.id`
- `project_id` -> `projects.id`

### `project_payments`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `project_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `amount` | `decimal(15,2)` | `NO` | `` | `NULL` | `` |
| `payment_date` | `datetime` | `NO` | `` | `NULL` | `` |
| `payment_method` | `varchar(255)` | `NO` | `` | `'�berweisung'` | `` |
| `note` | `text` | `YES` | `` | `NULL` | `` |
| `created_by` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `project_id` -> `projects.id`

### `project_positions`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `project_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `description` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `amount` | `decimal(12,4)` | `NO` | `` | `0.0000` | `` |
| `unit` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `partner_unit` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `quantity` | `decimal(12,4)` | `NO` | `` | `1.0000` | `` |
| `partner_rate` | `decimal(12,4)` | `NO` | `` | `0.0000` | `` |
| `partner_mode` | `varchar(255)` | `NO` | `` | `'unit'` | `` |
| `partner_total` | `decimal(12,2)` | `NO` | `` | `0.00` | `` |
| `customer_rate` | `decimal(12,4)` | `NO` | `` | `0.0000` | `` |
| `customer_mode` | `varchar(255)` | `NO` | `` | `'unit'` | `` |
| `customer_total` | `decimal(12,2)` | `NO` | `` | `0.00` | `` |
| `tax_rate` | `decimal(5,2)` | `NO` | `` | `19.00` | `` |
| `margin_type` | `enum('markup','discount')` | `NO` | `` | `'markup'` | `` |
| `margin_percent` | `decimal(8,2)` | `NO` | `` | `0.00` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `project_id` -> `projects.id`

### `project_statuses`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `code` | `varchar(50)` | `YES` | `` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `label` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `color` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `style` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `sort_order` | `int(11)` | `NO` | `` | `0` | `` |
| `is_active` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `pulse_aggregates`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `bucket` | `int(10) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `period` | `mediumint(8) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `key` | `mediumtext` | `NO` | `` | `NULL` | `` |
| `key_hash` | `binary(16)` | `YES` | `` | `NULL` | `VIRTUAL GENERATED` |
| `aggregate` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `value` | `decimal(20,2)` | `NO` | `` | `NULL` | `` |
| `count` | `int(10) unsigned` | `YES` | `` | `NULL` | `` |

### `pulse_entries`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `timestamp` | `int(10) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `key` | `mediumtext` | `NO` | `` | `NULL` | `` |
| `key_hash` | `binary(16)` | `YES` | `MUL` | `NULL` | `VIRTUAL GENERATED` |
| `value` | `bigint(20)` | `YES` | `` | `NULL` | `` |

### `pulse_values`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `timestamp` | `int(10) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `MUL` | `NULL` | `` |
| `key` | `mediumtext` | `NO` | `` | `NULL` | `` |
| `key_hash` | `binary(16)` | `YES` | `` | `NULL` | `VIRTUAL GENERATED` |
| `value` | `mediumtext` | `NO` | `` | `NULL` | `` |

### `recurring_invoices`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `customer_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `template_invoice_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `interval` | `enum('monthly','quarterly','yearly')` | `NO` | `` | `'monthly'` | `` |
| `next_run_at` | `date` | `NO` | `` | `NULL` | `` |
| `last_run_at` | `date` | `YES` | `` | `NULL` | `` |
| `occurrences_limit` | `int(10) unsigned` | `YES` | `` | `NULL` | `` |
| `occurrences_count` | `int(10) unsigned` | `NO` | `` | `0` | `` |
| `status` | `enum('active','paused')` | `NO` | `` | `'active'` | `` |
| `auto_issue` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `due_days` | `int(10) unsigned` | `NO` | `` | `14` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `template_items` | `longtext` | `NO` | `` | `NULL` | `` |
| `template_customer_id` | `bigint(20) unsigned` | `NO` | `` | `NULL` | `` |
| `template_customer_name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `template_amount_net_cents` | `int(10) unsigned` | `NO` | `` | `0` | `` |
| `template_tax_rate` | `decimal(5,2)` | `NO` | `` | `19.00` | `` |
| `template_amount_tax_cents` | `int(10) unsigned` | `NO` | `` | `0` | `` |
| `template_amount_gross_cents` | `int(10) unsigned` | `NO` | `` | `0` | `` |
| `template_currency` | `varchar(3)` | `NO` | `` | `'EUR'` | `` |
| `template_intro_text` | `text` | `YES` | `` | `NULL` | `` |
| `template_footer_text` | `text` | `YES` | `` | `NULL` | `` |
| `template_notes` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `deleted_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `customer_id` -> `customers.id`
- `tenant_id` -> `tenants.id`
- `template_invoice_id` -> `invoices.id`

### `sent_emails`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `date` | `date` | `YES` | `` | `NULL` | `` |
| `from` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `to` | `text` | `YES` | `` | `NULL` | `` |
| `cc` | `text` | `YES` | `` | `NULL` | `` |
| `bcc` | `text` | `YES` | `` | `NULL` | `` |
| `subject` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `body` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `services`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `description` | `text` | `YES` | `` | `NULL` | `` |
| `service_code` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `unit` | `varchar(255)` | `NO` | `` | `'word'` | `` |
| `base_price` | `decimal(10,4)` | `NO` | `` | `0.0000` | `` |
| `status` | `enum('active','inactive')` | `NO` | `` | `'active'` | `` |
| `is_extra` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `sessions`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(255)` | `NO` | `PRI` | `NULL` | `` |
| `user_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `ip_address` | `varchar(45)` | `YES` | `` | `NULL` | `` |
| `user_agent` | `text` | `YES` | `` | `NULL` | `` |
| `payload` | `longtext` | `NO` | `` | `NULL` | `` |
| `last_activity` | `int(11)` | `NO` | `MUL` | `NULL` | `` |

### `specializations`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `code` | `varchar(50)` | `YES` | `` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `description` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `status` | `enum('active','archived')` | `NO` | `` | `'active'` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `subscriptions`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `plan` | `varchar(255)` | `NO` | `` | `'free'` | `` |
| `billing_cycle` | `varchar(255)` | `NO` | `` | `'monthly'` | `` |
| `status` | `varchar(255)` | `NO` | `` | `'active'` | `` |
| `price_net_cents` | `int(11)` | `NO` | `` | `0` | `` |
| `price_gross_cents` | `int(11)` | `NO` | `` | `0` | `` |
| `vat_rate_percent` | `decimal(5,2)` | `NO` | `` | `19.00` | `` |
| `is_trial` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `trial_ends_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `started_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `current_period_start` | `timestamp` | `YES` | `` | `NULL` | `` |
| `current_period_end` | `timestamp` | `YES` | `` | `NULL` | `` |
| `cancelled_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `expires_at` | `timestamp` | `YES` | `MUL` | `NULL` | `` |
| `max_users` | `int(11)` | `YES` | `` | `NULL` | `` |
| `max_projects` | `int(11)` | `YES` | `` | `NULL` | `` |
| `max_storage_gb` | `int(11)` | `YES` | `` | `NULL` | `` |
| `payment_provider` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `payment_provider_subscription_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `payment_provider_customer_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `billing_email` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `billing_address` | `text` | `YES` | `` | `NULL` | `` |
| `auto_renew` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `deleted_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `telescope_entries`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `sequence` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `uuid` | `char(36)` | `NO` | `UNI` | `NULL` | `` |
| `batch_id` | `char(36)` | `NO` | `MUL` | `NULL` | `` |
| `family_hash` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `should_display_on_index` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `type` | `varchar(20)` | `NO` | `MUL` | `NULL` | `` |
| `content` | `longtext` | `NO` | `` | `NULL` | `` |
| `created_at` | `datetime` | `YES` | `MUL` | `NULL` | `` |

### `telescope_entries_tags`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `entry_uuid` | `char(36)` | `NO` | `PRI` | `NULL` | `` |
| `tag` | `varchar(255)` | `NO` | `PRI` | `NULL` | `` |

Foreign Keys:
- `entry_uuid` -> `telescope_entries.uuid`

### `telescope_monitoring`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `tag` | `varchar(255)` | `NO` | `PRI` | `NULL` | `` |

### `tenants`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `company_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `legal_form` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_street` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_house_no` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_zip` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_city` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `address_country` | `varchar(255)` | `NO` | `` | `'DE'` | `` |
| `tax_number` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `vat_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `tax_office` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_name` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_iban` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_bic` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_code` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `bank_account_holder` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `domain` | `varchar(255)` | `YES` | `UNI` | `NULL` | `` |
| `managing_director` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `status` | `enum('active','inactive')` | `NO` | `` | `'active'` | `` |
| `is_active` | `tinyint(1)` | `NO` | `` | `1` | `` |
| `settings` | `longtext` | `YES` | `` | `NULL` | `` |
| `subscription_plan` | `varchar(255)` | `NO` | `` | `'basic'` | `` |
| `license_key` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `phone` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `mobile` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `email` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `website` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `opening_hours` | `text` | `YES` | `` | `NULL` | `` |

### `tenant_invoices`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `subscription_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `invoice_number` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `billing_period_start` | `date` | `YES` | `` | `NULL` | `` |
| `billing_period_end` | `date` | `YES` | `` | `NULL` | `` |
| `amount_net` | `decimal(10,2)` | `NO` | `` | `0.00` | `` |
| `tax_amount` | `decimal(10,2)` | `NO` | `` | `0.00` | `` |
| `amount` | `decimal(10,2)` | `NO` | `` | `NULL` | `` |
| `currency` | `varchar(255)` | `NO` | `` | `'EUR'` | `` |
| `status` | `varchar(255)` | `NO` | `` | `'pending'` | `` |
| `invoice_date` | `date` | `NO` | `MUL` | `NULL` | `` |
| `due_date` | `date` | `YES` | `MUL` | `NULL` | `` |
| `paid_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `payment_provider` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `external_invoice_id` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `pdf_url` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `notes` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`
- `subscription_id` -> `subscriptions.id`

### `tenant_settings`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `key` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `value` | `text` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`

### `units`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `tenant_id` | `bigint(20) unsigned` | `NO` | `MUL` | `NULL` | `` |
| `code` | `varchar(50)` | `YES` | `` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `abbreviation` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `type` | `varchar(255)` | `NO` | `` | `'quantity'` | `` |
| `description` | `varchar(255)` | `YES` | `` | `NULL` | `` |
| `status` | `enum('active','archived')` | `NO` | `` | `'active'` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

### `users`

| Spalte | Typ | Null | Key | Default | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | `NO` | `PRI` | `NULL` | `auto_increment` |
| `custom_id` | `varchar(255)` | `YES` | `MUL` | `NULL` | `` |
| `tenant_id` | `bigint(20) unsigned` | `YES` | `MUL` | `NULL` | `` |
| `name` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `email` | `varchar(255)` | `NO` | `UNI` | `NULL` | `` |
| `locale` | `varchar(5)` | `NO` | `` | `'de'` | `` |
| `email_verified_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `is_admin` | `tinyint(1)` | `NO` | `` | `0` | `` |
| `password` | `varchar(255)` | `NO` | `` | `NULL` | `` |
| `two_factor_secret` | `text` | `YES` | `` | `NULL` | `` |
| `two_factor_recovery_codes` | `text` | `YES` | `` | `NULL` | `` |
| `two_factor_confirmed_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `role` | `varchar(255)` | `NO` | `` | `'Project Manager'` | `` |
| `status` | `enum('active','inactive')` | `NO` | `` | `'active'` | `` |
| `last_login` | `timestamp` | `YES` | `` | `NULL` | `` |
| `remember_token` | `varchar(100)` | `YES` | `` | `NULL` | `` |
| `last_login_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `created_at` | `timestamp` | `YES` | `` | `NULL` | `` |
| `updated_at` | `timestamp` | `YES` | `` | `NULL` | `` |

Foreign Keys:
- `tenant_id` -> `tenants.id`
