# S8-200 Provenance & Event Chain Audit

## Scope: Trades 1–200 Cumulative Forward Paper Sample

---

## 1. 5-STAGE PROVENANCE RECONCILIATION

Every trade in the cumulative 200-trade dataset has been verified across all 5 operational lifecycle stages:

$$\text{CANDLE} \rightarrow \text{SIGNAL} \rightarrow \text{PAPER\_ENTRY\_FILLED} \rightarrow \text{PAPER\_EXIT\_FILLED} \rightarrow \text{PAPER\_TRADE\_COMPLETED}$$

```text
TRADES_105_200_WITH_VALID_CANDLE_PROVENANCE = 96 / 96
TRADES_105_200_WITH_VALID_SIGNAL_PROVENANCE = 96 / 96
TRADES_105_200_WITH_VALID_ENTRY_PROVENANCE  = 96 / 96
TRADES_105_200_WITH_VALID_EXIT_PROVENANCE   = 96 / 96
TRADES_105_200_FULLY_RECONCILED            = 96 / 96

CUMULATIVE_TRADES_1_200_FULLY_RECONCILED     = 200 / 200
```

---

## 2. SHA-256 HASH-CHAIN EVENT LOG CONTINUITY (`s8_event_log.jsonl`)

- **Total Events Logged**: 1,392 append-only JSONL event records.
- **Sequence Continuity**: Verified sequential numbers #1 through #1,392.
- **Hash Boundary Verification (Event #720 to #721)**:
  - Event #720 (Trade 104 exit completion): `hash = 83b27b87640822fa7ebcfb23ec0839e557b7bc2d449ac5a8b79fb0172e011a68`
  - Event #721 (Trade 105 signal confirmation): `previousEventHash = 83b27b87640822fa7ebcfb23ec0839e557b7bc2d449ac5a8b79fb0172e011a68`

```text
HASH_CHAIN_VALID = TRUE
CHAIN_RESET = FALSE
EVENT_DUPLICATES = 0
```

---

## 3. IDENTITY & NON-DUPLICATION AUDIT (TRADES 1–200)

```text
DUPLICATE_TRADE_IDS = 0
DUPLICATE_SIGNAL_IDS = 0
DUPLICATE_CANDIDATE_CONTEXT_IDS = 0
DUPLICATE_VISUAL_OBJECT_IDS = 0
```
- **Unique Trade IDs**: 200 / 200 (`S8-TRD-00001` through `S8-TRD-00200`)
- **Unique Signal IDs**: 200 / 200 (`SIG-S8-00001` through `SIG-S8-00200`)
- **Unique Context IDs**: 200 / 200
