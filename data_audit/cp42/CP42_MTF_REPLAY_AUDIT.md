# CP42 — MTF REPLAY DETERMINISM AUDIT

## 1. MULTI-TIMEFRAME CONTEXT REPLAY AUDIT

`MultiTimeframeContextEngine` processes Higher Timeframe (HTF) candidate contexts and Lower Timeframe (LTF) candidate contexts to derive causal MTF confluence objects (`MultiTimeframeContext`).

---

## 2. TIMEFRAME TIMESTAMP CATEGORIZATION

The audit verified strict separation between temporal timestamps:
* **Event Timestamp (`eventTimestamp`)**: Market timestamp of candidate event creation.
* **Confirmation Timestamp (`confirmationTimestamp`)**: Bar close timestamp when HTF structure/FVG is confirmed.
* **Arrival Timestamp**: Order of message arrival at adapter.
* **Processing Timestamp**: Clock time of execution.

---

## 3. MTF REPLAY DETERMINISM RESULTS

### Experiment:
* HTF Context: `NQ 15m`, $T_{ev} = 100000$, $T_{conf} = 150000$.
* LTF Context: `NQ 5m`, $T_{ev} = 160000$, $T_{conf} = 165000$.
* Run MTF Evaluation twice on separate engine instances.

### Observed Results:
* `mtf1.id === mtf2.id` (`mtf_NQ_15m_5m_160000`)
* `mtf1.causal === mtf2.causal` (`true`, because $150000 \le 160000$)
* `mtf1.status === mtf2.status` (`CONFIRMED`)
* SHA-256 structural hash: 100% Match.
* Status: `VERIFIED`.
