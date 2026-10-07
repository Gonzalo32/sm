# S8.2 Full Provenance Chain Audit (CANDLE -> SIGNAL -> ENTRY -> EXIT -> COMPLETED)

## 1. 5-Stage Provenance Audit Results

### Block B (Trades 53–104)

```text
BLOCK_B_TRADES_WITH_VALID_CANDLE_PROVENANCE = 52 / 52
BLOCK_B_TRADES_WITH_VALID_SIGNAL_PROVENANCE = 52 / 52
BLOCK_B_TRADES_WITH_VALID_ENTRY_PROVENANCE  = 52 / 52
BLOCK_B_TRADES_WITH_VALID_EXIT_PROVENANCE   = 52 / 52
BLOCK_B_TRADES_FULLY_RECONCILED            = 52 / 52
```

### Block A (Trades 1–52)

```text
BLOCK_A_TRADES_WITH_VALID_CANDLE_PROVENANCE = 52 / 52
BLOCK_A_TRADES_WITH_VALID_SIGNAL_PROVENANCE = 52 / 52
BLOCK_A_TRADES_WITH_VALID_ENTRY_PROVENANCE  = 52 / 52
BLOCK_A_TRADES_WITH_VALID_EXIT_PROVENANCE   = 52 / 52
BLOCK_A_TRADES_FULLY_RECONCILED            = 52 / 52
```

### Total Dataset (Trades 1–104)

```text
TOTAL_TRADES_FULLY_RECONCILED = 104 / 104
```

## 2. Provenance Chain Verification Method

Every trade in `s8_event_log.jsonl` follows strict, sequential 5-stage event propagation:

1. `CANDLE`: Validated OHLCV 5m candle timestamp.
2. `SIGNAL`: Emitted candidate signal ID (`SIG-S8-XXXXX`) matching frozen ICT detector rules.
3. `PAPER_ENTRY_FILLED`: Execution filled at confirmation candle close ($E1$).
4. `PAPER_EXIT_FILLED`: Exit executed under fixed holding exit rule ($X1\_H1$).
5. `PAPER_TRADE_COMPLETED`: Final trade payload logged into append-only SHA-256 event hash chain.
