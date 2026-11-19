# Project rules

- Keep the Investment Managers design prototype in its own administration components with React state only; it must not connect to the wizard's investment-manager data or imply permanent storage before backend integration is requested.
- Keep funds nested under their asset manager and edit by stable IDs; matching fund names across managers must remain independent.
- Save the wizard's final-review and portfolio display snapshots inside the existing policy form and render them with shared review content in approvals; intact submitted sections are authoritative, and legacy portfolio fallback uses only saved fund names, percentages and net investment, never current fees/catalogue or gross investment.