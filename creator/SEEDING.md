# Initial Creator Configuration

The application schema is empty after DS import. Run the one-time idempotent seed
function before creating articles.

## Install in Creator 6

1. Open the validation application in **Edit** mode.
2. Select **Workflows** from the top application-builder navigation.
3. Open the **Functions** tab in the Workflow Dashboard.
4. Click **New Function**.
5. Enter these properties:
   - Language: `Deluge`
   - Function Name: `seed_editorial_configuration`
   - Namespace: create or select `Setup`
   - Return Type: `void`
   - Arguments: leave empty
6. Click **Create Function**.
7. Creator opens the Deluge builder. Open
   `functions/seed_editorial_configuration.deluge`, select the complete file,
   then replace the complete contents of the Zoho editor with it. The file now
   includes the function signature and its outer braces.
8. Click **Save Function**. Resolve no warnings by guessing; record the complete
   line number and message if Creator reports an error.
9. Click **Execute**. Because the function has no arguments, submit the execution
   dialog without entering values.
10. Confirm that the execution log ends with:
    `GeneDrift editorial configuration seed completed.`

The function is idempotent: running it again will skip records identified by
their stable keys.

## Verify in live mode

Open the corresponding reports and confirm these totals:

- Employees: 1
- Teams: 1
- Team Memberships: 1
- Editorial Roles: 4
- Approval Policies: 2
- Categories: 6
- Tags: 8
- Site Settings: 1

## Expected records

- 1 demo employee mapped to the current Zoho login
- 1 editorial team and 1 team membership
- 4 editorial role assignments
- 2 approval policies
- 6 categories
- 8 tags
- 1 site-settings record

Do not add production employees or client-specific role assignments in this
validation application. Those will be mapped to the client's existing Employee /
Team module during production integration.
