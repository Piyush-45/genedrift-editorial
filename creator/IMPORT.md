# Creator Schema Import

## What this package contains

- `Genedrift_Editorial_Platform_Production.ds`: the 17-form editorial schema,
  relationships, baseline reports, permissions scaffold, and navigation.

## What is intentionally separate

- Demo and configuration records
- Lifecycle validation and transition workflows
- Catalyst connection and credentials
- Publisher retry/scheduling functions
- Editor widget ZIP
- Role-specific record permissions

Creator assigns and validates component link names during import. The automation
layer will be added after the baseline schema imports successfully so scripts are
written against the final link names instead of guessed identifiers.

## Validation import

1. In Creator, select **Create Solution**.
2. Select **Applications**, then **Import from file**.
3. Upload `Genedrift_Editorial_Platform_Production.ds`.
4. Use a temporary name such as `GeneDrift Editorial Validation 01` if Creator
   asks for one.
5. Do not add records or change fields before recording the import result.
6. If Creator reports an error, capture the full error text and line number.

The import creates a new application. It does not populate the existing blank
`genedrift-editorial-platform-prod` application.
