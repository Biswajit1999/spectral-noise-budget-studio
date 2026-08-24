# Internal research synthesis and claim ledger

## Decision

Make feature-to-bandpass placement using real transmission curves the gate before any reduced noise budget.

## Evidence

1. SVO Filter Profile Service provides IVOA transmission profiles: https://svo2.cab.inta-csic.es/theory/fps/
2. STScI documents that Pandeia mode throughputs combine multiple optical components: https://jwst-docs.stsci.edu/jwst-exposure-time-calculator-overview/jwst-etc-pandeia-engine-tutorial/jwst-etc-instrument-throughputs

## Claim ledger

| Claim | Confidence | Response |
|---|---:|---|
| curves are real reference products | high | retain VOTable URL and SHA-256 |
| a filter curve equals full ETC throughput | false | explicit non-claim and Pandeia link |
| feature outside band can be rescued by exposure | false | make bandpass intersection the first gate |
