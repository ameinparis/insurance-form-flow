# Project rules

- Keep the Investment Managers design prototype in its own administration components with React state only; it must not connect to the wizard's investment-manager data or imply permanent storage before backend integration is requested.
- Keep funds nested under their asset manager and edit by stable IDs; matching fund names across managers must remain independent.
- Save the wizard's final-review display snapshot inside the existing policy form and render it with shared review content in approvals; submitted amounts and fund names must not depend on later fee or catalogue changes.