This project now uses a Laravel-first migration baseline again.

Current strategy:
- `2024_01_01_000000_create_all_tables.php` creates the application tables
- `2024_01_01_000001_create_package_monitoring_tables.php` creates required package and monitoring tables
- fresh environments should bootstrap with `php artisan migrate`

Lifecycle conventions already covered by the baseline:
- soft deletes are present on tables whose Eloquent models use `SoftDeletes`
- activity logging is backed by the `activity_log` table for models using `LogsAllActivity`
- invoice audit logging is backed by the immutable `invoice_audit_logs` table
- package observability tables are included for Health, Pulse, Telescope, and sent email tracking

Going forward:
- add new migrations here for every schema change
- keep migrations focused and reversible where possible
- do not combine a full schema dump with a full baseline migration, because that causes duplicate table creation during `php artisan migrate`
