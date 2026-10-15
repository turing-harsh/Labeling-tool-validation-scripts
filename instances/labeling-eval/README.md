# labeling-eval

- **Tool URL:** https://eval.turing.com

## Projects

| Slug | Task type | Status | Owner |
|------|-----------|--------|-------|
| [198-terminal-bench-science](projects/198-terminal-bench-science/) | Terminal-Bench-Science, one script per review pipeline (below) | draft | harsh.a@turing.com |

### 198-terminal-bench-science pipelines

Mirrors `agentic-reviewer-qd`'s `instances/labeling-eval/projects/terminal-bench-science-198/pipelines/`.

| Pipeline | What it validates | Status |
|----------|-------------------|--------|
| [task-data-validation-1128](projects/198-terminal-bench-science/pipelines/task-data-validation-1128/) | The task package (Drive folder) before the oracle runs; a copy of `labeling-m/279-terminal-bench-science-demo` | draft |
| [oracle-validation-1183](projects/198-terminal-bench-science/pipelines/oracle-validation-1183/) | The Oracle Check: every oracle trial of the latest current-version run scored reward 1 | draft |
| [pass-at-1-reward-validation-1180](projects/198-terminal-bench-science/pipelines/pass-at-1-reward-validation-1180/) | The post-eval reward result at breakpoint `pass5RewardValidation` (Harbor GCS ZIPs) | draft |
| [task-completion](projects/198-terminal-bench-science/pipelines/task-completion/) | All three gates above, at task completion. **Generated** by `scripts/build-198-task-completion.mjs`; never edit by hand | draft |
