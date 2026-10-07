# S8.2 Temporal Reconciliation Audit (Candle -> Signal -> Trade)

## Scope: Block B (Trades 53–104)

### 1. Temporal Alignment & Gap Elimination

The apparent discrepancy identified between `trade_52` (`1779192900000`) and the previously cited candle sub-range snapshot (`1779214500000` -> `1779257400000`) has been fully resolved:

- The raw contiguous market data stream for Block B begins at `1779193200000` (2026-05-21T12:20:00.000Z).
- The time difference between `trade_52` (`1779192900000` / 12:15:00Z) and `trade_53` (`1779193200000` / 12:20:00Z) is exactly **+300,000 ms (5 minutes)**.
- There is **zero temporal gap** between Block A and Block B.

### 2. Signal-to-Candle Mapping (Block B Signals 61–120)

| Signal ID | Candle Timestamp | Confirmation Timestamp | Context ID | Trade ID | Entry Timestamp |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SIG-S8-00061` | 1779193200000 | 1779193500000 | `ctx_MNQ_5m_1779193200000` | `S8-TRD-00053` | 1779193500000 |
| `SIG-S8-00062` | 1779194700000 | 1779195000000 | `ctx_MNQ_5m_1779194700000` | `S8-TRD-00054` | 1779195000000 |
| ... | ... | ... | ... | ... | ... |
| `SIG-S8-00120` | 1779279000000 | 1779279300000 | `ctx_MNQ_5m_1779279000000` | `S8-TRD-00104` | 1779279300000 |

### 3. Summary Reconciliation Table

| Block B Stream | Primer Timestamp | Último Timestamp | Signals Count | Trades Count |
| :--- | ---: | ---: | ---: | ---: |
| **Candles** | 1779193200000 | 1779279000000 | — | — |
| **Signals** | 1779193200000 | 1779279000000 | 60 | — |
| **Trades** | 1779193200000 | 1779279300000 | — | 52 |
