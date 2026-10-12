# Hackathon Build Brief

## Recommendation

Build **Milestone Payroll**: an extension of Circle's Arc escrow sample that splits a contractor agreement into separately evidenced and tracked milestone payments, then settles each accepted milestone in USDC on Arc testnet.

This is the strongest grounded fit for the email's “pay the crew before the day is out” challenge. The sample already covers agreement setup, Refund Protocol deployment, USDC funding, image submission, AI validation, and payment release. Its current workflow handles a single amount and assumes payment ID `0`; the prototype can make the experience milestone-aware while keeping the existing sample's architecture.

Treat this as a separate fork/prototype based on `~/.arc-canteen/context/samples/arc-escrow`, not as a feature to squeeze into this Python CLI. The CLI is builder infrastructure: it provides Arc RPC and a local-key testnet wallet, while the escrow sample uses Circle Developer Controlled Wallets, Circle's Smart Contract Platform, Supabase, and OpenAI.

## What This Repository Already Provides

- `arc_canteen/cli.py` registers the Typer commands, including `wallet`, `rpc`, and `context sync`.
- `arc_canteen/wallet.py` requests a funded Arc testnet wallet and stores its private key locally using the repository's secure-file helpers.
- `arc_canteen/rpc.py` forwards JSON-RPC through the authenticated Canteen proxy. The synced official agent context says `eth_sendRawTransaction` is allowed, so locally signed testnet calls are supported.
- `arc_canteen/settings.py` currently supports `testnet` and `mainnet`, but `rpc.py` only maps a testnet endpoint; a configured mainnet RPC call therefore fails.
- `arc_canteen/push.py` maintains an append-only queue for Canteen product events. It is not a financial ledger, transaction journal, or signed decision log.
- `arc_canteen/paths.py` applies private permissions to local state files where the platform supports them.
- `pyproject.toml` has a small dependency set (Typer, Rich, HTTPX, PyYAML). There is no test suite or accounting/contract library in this checkout.
- Official Arc agent context is synced at `~/.arc-canteen/context/`; its `samples/arc-escrow` checkout uses Next.js, Supabase, Circle wallet/contract SDKs, and OpenAI.
- In that sample, `RefundProtocol.pay(address,uint256,address)` creates an individual payment. Its timestamp is set to the current block time; a beneficiary can call `withdraw(uint256[])` immediately. The contract does not itself gate withdrawal on work approval.
- The sample's current `validate-work` route asks OpenAI to validate an image, requires `valid` plus `HIGH` confidence, stores the evidence, and then submits `withdraw([0])` using the beneficiary's Circle wallet. This is an application-layer policy, not an on-chain enforcement guarantee.

## MVP Scope

1. Fork the `arc-escrow` sample into a clearly named, open-source project; retain its licenses and credit its upstream dependencies.
2. Change the agreement model/UI from a single amount to an ordered list of milestones, each with a description, amount, acceptance criteria, due date, evidence, and status.
3. Add durable per-milestone data. Stop assuming every agreement has one payment at ID `0`; store each on-chain payment ID and transaction ID in the database and use those IDs for evidence, release, and status updates.
4. Deposit and track each milestone amount separately, or document and implement a contract change if a single pooled deposit is required. Ensure the sum of milestone amounts equals the agreement total.
5. Keep the reviewer in control: AI may summarize evidence and recommend acceptance, but should not be presented as the sole contractual authority. Require an explicit client/reviewer approval before the app requests payment release.
6. Display each milestone's evidence, reviewer decision, funding state, release transaction, and explorer link. Make pending/failed/confirmed states distinct.
7. Add automated tests for amount conservation, milestone-to-payment-ID mapping, one-time release handling, and rejection of unapproved evidence. Provide a local/demo fixture path.
8. Document the trust model precisely. In particular, application-side approval does not stop a beneficiary from calling `withdraw()` directly under the current contract. If the challenge requires enforceable gated releases, modify and thoroughly test the contract or choose a contract with a real on-chain release condition.

Keep the first demo narrow: one client, one contractor, one USDC agreement split into three milestones, one evidence/reviewer flow, and real Arc testnet transactions only after contract and Circle configuration are verified. Do not claim fully streaming wages, autonomous AI adjudication, or trustless milestone gating unless the implementation actually provides it.

## Build Sequence (Sep 30–Oct 10)

- **Sep 30:** Confirm registration, judging/submission rules, and team size. Fork the official escrow sample and run its current baseline if credentials/services are available.
- **Oct 1–2:** Model milestones in the schema and UI. Add validation for unique ordered milestones and ensure amounts sum exactly to the agreement total.
- **Oct 3–4:** Implement per-milestone evidence, review decisions, and payment/transaction mapping. Remove payment ID `0` assumptions and add focused tests.
- **Oct 5–6:** Confirm Arc testnet USDC address/decimals, Circle blockchain identifier, contract deployability, and Circle Developer Controlled Wallet availability. Test with a fresh testnet agreement.
- **Oct 7:** Add clear reviewer approval and transaction confirmation states; decide whether the existing RefundProtocol's trust model is acceptable or whether an on-chain gating contract is required.
- **Oct 8–9:** Run end-to-end tests, harden failure handling, document limitations, and record a reproducible demo.
- **Oct 10:** Freeze scope and submit the repo/demo. State plainly what is on-chain, what is application policy, and what remains human-controlled.

## Verification Gates

- The milestone amounts sum exactly to the signed agreement total; invalid or zero-value milestones are rejected.
- Evidence and review status are attached to one explicit milestone and its recorded payment ID, not a hard-coded payment ID.
- A failed, pending, or duplicate transaction cannot be displayed as a confirmed payout.
- A test proves whether unapproved payment withdrawal is possible on the deployed contract. If it is possible, disclose this prominently and do not call the flow trustless or contract-gated.
- No API key, entity secret, or signing key appears in logs, fixtures, or committed environment files.
- Testnet transactions are opt-in, show chain/destination/amount before confirmation, and can be checked by transaction hash in the explorer.
- Documentation states testnet USDC is not real money and AI evidence review can be wrong; parties retain a human dispute/review path.

## Open Questions To Resolve Before On-Chain Work

- Does the hackathon's challenge specifically require per-day/per-milestone settlement, or is a milestone lifecycle enough?
- Can a contractor withdraw a payment before the application records work acceptance? The current RefundProtocol code says yes; is this trust model acceptable for a demo?
- Can RefundProtocol be safely extended to multiple payment IDs per agreement, and does the UI/schema preserve each ID? Current release and refund routes use `[0]`.
- What are the verified Arc testnet USDC address/decimals and Circle `CIRCLE_BLOCKCHAIN` identifier for the event environment?
- Are Circle Developer Controlled Wallets, Circle Smart Contract Platform, Supabase, and OpenAI credentials available to the team? The sample requires these; the CLI's funded testnet wallet does not substitute for the Circle wallet IDs and server credentials.
- Does judging require integration with a named accounting system, a public deployment, or a particular submission format?

Use the synced official docs and sample as the starting point, and verify network-specific settings against current official Arc/Circle references. Do not infer contract addresses or API identifiers from another chain or a sample environment file.