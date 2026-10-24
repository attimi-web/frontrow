# FrontRow — Documentazione di progetto

Questa cartella contiene tutta la pianificazione e il contesto per sviluppare FrontRow
**uno step alla volta, una chat per step**. Ogni chat nuova parte senza memoria: questi
file danno al modello tutto ciò che gli serve per riprendere esattamente dal punto giusto.

## Come usare questi documenti (IMPORTANTE)

All'inizio di **ogni nuova chat**, incolla un prompt tipo questo:

> Leggi `docs/CONTEXT.md` e `docs/WORKFLOW.md`, poi apri
> `docs/sprints/sprint-07-stats-delight.md` e fai lo **Step 1**.
> Alla fine: typecheck, build, verifica nel browser, commit e push su `develop`,
> e aggiorna lo stato nel file dello sprint.

Sostituisci sprint/step con quello che vuoi fare. Un solo step per chat.

## Indice dei file

| File | Cosa contiene |
|---|---|
| [`CONTEXT.md`](CONTEXT.md) | **Bootstrap**: fatti chiave (repo, Supabase, account test, env, come far girare l'app). Da leggere sempre per primo. |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Cosa è fatto (sprint 0–8) e cosa manca. Aggiornato dopo ogni sprint. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Stack, struttura cartelle, componenti condivisi, convenzioni di codice. |
| [`DATABASE.md`](DATABASE.md) | Schema, migrazioni, pattern RLS, storage, edge functions, **gotcha** importanti. |
| [`WORKFLOW.md`](WORKFLOW.md) | Il "rituale" di ogni chat: leggere il design, costruire, verificare, committare. |
| [`ROADMAP.md`](ROADMAP.md) | Tutti gli sprint 0–10 con stato e mappatura delle 37 schermate. |
| [`sprints/`](sprints/) | Un file dettagliato per ogni sprint rimanente, diviso in step. |
| [`sprints/backlog.md`](sprints/backlog.md) | Task singoli fuori sprint (es. restyle form Log a Show). |

## Regola d'oro sul design

FrontRow ha un prototipo visivo completo in `design_handoff/FrontRow.dc.html` (37 schermate).
**Ogni schermata va replicata fedelmente al prototipo**, non solo alla spec scritta.
Vedi `WORKFLOW.md` → "Come leggere il design".
