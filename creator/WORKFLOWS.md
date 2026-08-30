# Creator Workflows

Install workflows in the validation application one at a time and test each one
before proceeding. Scripts in this directory contain only the workflow body;
do not wrap them in a function signature.

## 1. Initialize a new article

Create a form workflow with these settings:

- Form: `Articles`
- Record event: `Created`
- Form event: `Load of the form`
- Workflow name: `Initialize New Article`
- Action: `Deluge Script`
- Script: `workflows/articles_created_on_load.deluge`

Expected result when the Articles form is opened for a new record:

- Article UUID is populated and disabled.
- Owner and Primary Author select the active employee matching the logged-in
  user's email.
- Approval Policy selects the active default policy.
- Workflow State is `Draft` and disabled.
- Revision pointers, override controls, and publishing timestamps are disabled.

Do not proceed if Owner, Primary Author, or Approval Policy remains empty. Check
the seed records and the logged-in account email first.
