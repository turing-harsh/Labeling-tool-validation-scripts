#!/usr/bin/env python3
"""Offline Harbor task validation extracted from ``infra/harbor_gce``.

This is a self-contained, deterministic subset of
``infra/harbor_gce/validate_tasks.py``.  It intentionally does *not* import or
call ``semantic_gate.py``: no LLM, API key, Harbor CLI, container, or network
access is required.

It accepts a Harbor task directory or a directory containing task directories.
Use ``upload`` for admission checks, ``audit`` for strict validation of an
already-evidenced package, and ``delivery`` for the complete release contract.

Examples:
    python3 checks/deterministic_task_validation.py compbench-samples --profile upload
    python3 checks/deterministic_task_validation.py /path/to/task --profile delivery --json
"""

from __future__ import annotations

import argparse
import filecmp
import hashlib
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

try:
    import tomllib
except ImportError:  # pragma: no cover - Python 3.11+ is required in practice.
    tomllib = None


UPLOAD = "upload"
AUDIT = "audit"
DELIVERY = "delivery"
PROFILES = (UPLOAD, AUDIT, DELIVERY)

SAFE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
REQUIRED_DIRS = ("solution", "tests", "environment")
SPEC_PATHS = ("tests/verifier.json", "tests/manifest.json", "verifier.json")
MIRROR_GRADED_FILES = ("task.toml", "instruction.md")
MIRROR_GRADED_TREES = ("tests",)

DIFFICULTY = "difficulty"
SOLVABILITY = "solvability"
STABILITY = "stability"
PLATFORM = "platform"
REQUIRED_FINAL_AXES = (SOLVABILITY, DIFFICULTY, STABILITY, PLATFORM)
FINAL_ROOT_REQUIRED = {
    "review.csv",
    "qc_report.html",
    "client_qc_report.json",
    "client_qc_status.json",
    "client_format_check.json",
    "client_evaluations.csv",
    "client_programmatic_evidence.csv",
    "client_trial_matrix.csv",
    "evaluation_layout_repair.json",
    "finalization_review_reconcile.json",
    "client_qc",
    "task.toml",
    "instruction.md",
    "tests",
    "environment",
    "solution",
    "evaluations",
}
FINAL_ROOT_ALLOWED = FINAL_ROOT_REQUIRED | {"README.md", "golden_trajectory.json"}
GENERATED_CACHE_DIRS = {"__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"}
GENERATED_CACHE_SUFFIXES = {".pyc", ".pyo"}


@dataclass
class Report:
    """Machine-readable result for one independent Harbor task package."""

    task: str
    path: Path
    family: str = "native"
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    findings: list[dict[str, Any]] = field(default_factory=list)
    info: dict[str, Any] = field(default_factory=dict)
    indeterminate_errors: set[str] = field(default_factory=set, repr=False)

    @property
    def ok(self) -> bool:
        return not self.errors

    @property
    def audit_status(self) -> str:
        if self.errors:
            return "INDETERMINATE" if any(
                error in self.indeterminate_errors for error in self.errors
            ) else "FAIL"
        statuses = {finding["status"] for finding in self.findings if finding["blocking"]}
        if "FAIL" in statuses:
            return "FAIL"
        if "INDETERMINATE" in statuses:
            return "INDETERMINATE"
        return "PASS"

    def as_dict(self) -> dict[str, Any]:
        return {
            "task": self.task,
            "path": str(self.path),
            "family": self.family,
            "status": self.audit_status,
            "errors": self.errors,
            "warnings": self.warnings,
            "findings": self.findings,
            **self.info,
        }


def _is_generated_cache(path: Path) -> bool:
    return path.suffix.lower() in GENERATED_CACHE_SUFFIXES or any(
        part in GENERATED_CACHE_DIRS for part in path.parts
    )


def _listed(values: Iterable[str], limit: int = 6) -> str:
    values = list(values)
    shown = ", ".join(values[:limit])
    return shown + (f", … +{len(values) - limit}" if len(values) > limit else "")


def _add_finding(
    report: Report,
    profile: str,
    code: str,
    message: str,
    *,
    tier: int = 0,
    status: str = "FAIL",
    intake_fatal: bool = False,
) -> None:
    """Record a profile-aware deterministic result.

    The original validator treats package-quality gaps as advisory at upload,
    then makes them blocking in strict audit/delivery profiles.
    """
    blocking = intake_fatal or profile in {AUDIT, DELIVERY}
    report.findings.append(
        {
            "code": code,
            "tier": tier,
            "status": status,
            "message": message,
            "blocking": blocking,
        }
    )
    if status == "PASS":
        return
    rendered = f"{code}: {message}"
    if blocking:
        report.errors.append(rendered)
        if status == "INDETERMINATE":
            report.indeterminate_errors.add(rendered)
    else:
        report.warnings.append(f"ADVISORY {rendered}")


def _read_json(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _load_toml(path: Path) -> dict[str, Any] | None:
    if tomllib is None:
        return None
    try:
        value = tomllib.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _reward(run: Path) -> float | None:
    """Read a numerical reward from Harbor's supported reward locations."""
    candidates = (
        run / "verifier" / "reward.json",
        run / "verifier" / "reward.txt",
        run / "verifier" / "verifier_summary.json",
        run / "reward.json",
        run / "result.json",
    )
    for path in candidates:
        if not path.is_file():
            continue
        if path.suffix == ".txt":
            try:
                return float(path.read_text(encoding="utf-8").strip())
            except (OSError, ValueError):
                continue
        payload = _read_json(path)
        if not payload:
            continue
        for value in (
            payload.get("reward"),
            (payload.get("verifier_result") or {}).get("rewards", {}).get("reward"),
            (payload.get("verification_summary") or {}).get("weighted_pass_rate"),
        ):
            if isinstance(value, bool):
                return float(value)
            if isinstance(value, (int, float)):
                return float(value)
    return None


def _trial_dirs(root: Path) -> list[Path]:
    """Return terminal run directories, not parent Harbor job directories."""
    results = sorted(root.rglob("result.json")) if root.is_dir() else []
    terminals = [
        result.parent
        for result in results
        if not any(
            other != result and result.parent in other.parent.parents for other in results
        )
    ]
    return terminals


def _trajectory(run: Path) -> Path | None:
    for path in (
        run / "agent" / "trajectory.json",
        run / "agent" / "frozen_trajectory.json",
        run / "trajectory.json",
    ):
        if path.is_file():
            return path
    return None


def _sha256(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for block in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()
    except OSError:
        return None


def _run_identity(run: Path) -> tuple[str, str, str]:
    config = _read_json(run / "config.json") or {}
    result = _read_json(run / "result.json") or {}
    agent = (
        (config.get("agent") or {}).get("name")
        or (result.get("agent_info") or {}).get("name")
        or ""
    )
    model = (
        (config.get("agent") or {}).get("model_name")
        or (result.get("agent_info") or {}).get("model_info", {}).get("name")
        or ""
    )
    environment = (
        (config.get("environment") or {}).get("type")
        or (config.get("environment") or {}).get("import_path")
        or ""
    )
    return str(agent), str(model), str(environment)


def _is_oracle(run: Path) -> bool:
    result = _read_json(run / "result.json") or {}
    agent, model, _ = _run_identity(run)
    return (
        (run / "agent" / "oracle.txt").is_file()
        or "oracle" in run.as_posix().lower()
        or "oracle" in agent.lower()
        or "oracle" in model.lower()
        or "oracle" in str(result.get("trial_name") or "").lower()
    )


def _check_common(task: Path, report: Report) -> None:
    if not SAFE_NAME.fullmatch(task.name):
        report.errors.append("folder name is not a safe path segment")
    links = [
        path.relative_to(task).as_posix()
        for path in task.rglob("*")
        if path.is_symlink()
    ]
    if links:
        report.errors.append(f"package contains symbolic links: {_listed(sorted(links))}")

    toml = task / "task.toml"
    if not toml.is_file() or not toml.stat().st_size:
        report.errors.append("task.toml missing or empty")
    else:
        parsed = _load_toml(toml)
        if tomllib is None:
            report.warnings.append("Python <3.11: task.toml was not parsed")
        elif parsed is None:
            report.errors.append("task.toml does not parse")
        elif not (parsed.get("task") or {}).get("name"):
            report.errors.append("task.toml has no [task] name")
        else:
            report.info["declared_name"] = parsed["task"]["name"]

    for name in REQUIRED_DIRS:
        directory = task / name
        if not directory.is_dir():
            report.errors.append(f"{name}/ missing")
        elif not any(
            path.is_file() and path.stat().st_size > 0
            for path in directory.rglob("*")
            if not _is_generated_cache(path.relative_to(task))
        ):
            report.errors.append(f"{name}/ holds no content")

    if not (task / "instruction.md").is_file():
        report.warnings.append("instruction.md missing")
    if not (task / "environment" / "Dockerfile").is_file():
        report.warnings.append("environment/Dockerfile missing")


def _check_specs(task: Path, report: Report) -> None:
    specs = [path for path in SPEC_PATHS if (task / path).is_file()]
    report.info["grader_specs"] = specs
    if not specs:
        report.errors.append("no grader spec: expected tests/verifier.json, tests/manifest.json, or verifier.json")


def _check_mirror(task: Path, report: Report) -> None:
    mirror = task / "environment" / "_app"
    if not mirror.is_dir():
        return
    drifted: list[str] = []
    for copied in mirror.rglob("*"):
        if not copied.is_file() or _is_generated_cache(copied.relative_to(task)):
            continue
        relative = copied.relative_to(mirror)
        origin = task / relative
        if not origin.is_file():
            continue
        graded = (
            relative.as_posix() in MIRROR_GRADED_FILES
            or relative.parts and relative.parts[0] in MIRROR_GRADED_TREES
        )
        if graded and not filecmp.cmp(origin, copied, shallow=False):
            drifted.append(relative.as_posix())
    if drifted:
        report.errors.append(
            "environment/_app mirror disagrees with the root in graded paths: "
            + _listed(sorted(drifted))
        )
    for spec in ("tests/manifest.json", "tests/verifier.json"):
        if (task / spec).is_file() and (mirror / "tests").is_dir() and not (mirror / spec).is_file():
            report.errors.append(f"environment/_app carries tests/ but not {spec}")


def _check_evaluation_shape(task: Path, report: Report, profile: str) -> None:
    evaluations = task / "evaluations"
    if not evaluations.exists():
        report.info["classification"] = "task-only"
        return
    if not evaluations.is_dir():
        report.errors.append("evaluations must be a directory when present")
        return

    report.info["classification"] = "with-runs"
    invalid_json: list[str] = []
    for path in evaluations.rglob("*.json"):
        try:
            json.loads(path.read_text(encoding="utf-8", errors="replace"))
        except (OSError, ValueError):
            invalid_json.append(path.relative_to(task).as_posix())
    if invalid_json:
        _add_finding(
            report, profile, "T0.evaluation-json",
            f"unparseable evaluation artifact(s): {_listed(invalid_json)}",
        )

    canonical_runs = [
        run for axis in (SOLVABILITY, DIFFICULTY, STABILITY)
        for run in _trial_dirs(evaluations / axis)
    ]
    bad_runs = [
        run.relative_to(task).as_posix()
        for run in canonical_runs
        if _reward(run) is None
    ]
    if bad_runs:
        _add_finding(
            report, profile, "T0.evaluation-reward",
            f"canonical run(s) lack a readable reward: {_listed(bad_runs)}",
        )


def _check_final_root(task: Path, report: Report, profile: str) -> None:
    actual = {entry.name for entry in task.iterdir() if not _is_generated_cache(entry.relative_to(task))}
    missing = sorted(FINAL_ROOT_REQUIRED - actual)
    unexpected = sorted(actual - FINAL_ROOT_ALLOWED)
    for name in missing:
        _add_finding(report, profile, "T0.root-missing", f"final package is missing {name}")
    for name in unexpected:
        _add_finding(report, profile, "T0.root-extra", f"final package has unexpected root entry {name}")
    axes = {entry.name for entry in (task / "evaluations").iterdir()} if (task / "evaluations").is_dir() else set()
    for axis in REQUIRED_FINAL_AXES:
        if axis not in axes:
            _add_finding(report, profile, "T0.evaluation-axis-missing", f"evaluations/{axis}/ missing")


def _check_certificate(task: Path, report: Report, profile: str) -> None:
    """Verify the presence and basic structure of the release certificate offline."""
    report_file = task / "qc_report.html"
    if not report_file.is_file():
        _add_finding(report, profile, "T0.certificate-missing", "qc_report.html is missing")
        return
    text = report_file.read_text(encoding="utf-8", errors="replace")
    match = re.search(
        r'<script\b[^>]*\bid=["\'](?:qc-certificate|harbor-qc-certificate|harbor-client-qc-certificate)["\'][^>]*>(.*?)</script>',
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not match:
        _add_finding(report, profile, "T0.certificate-missing", "embedded QC certificate is missing")
        return
    try:
        certificate = json.loads(match.group(1))
    except ValueError:
        _add_finding(report, profile, "T0.certificate-invalid", "embedded QC certificate is invalid JSON")
        return
    required = ("schema", "task", "profile", "status", "release_eligible", "package_digest")
    missing = [name for name in required if name not in certificate]
    if missing:
        _add_finding(
            report, profile, "T0.certificate-invalid",
            "embedded QC certificate lacks " + ", ".join(missing),
        )


def _check_solvability(task: Path, report: Report, profile: str) -> None:
    runs = _trial_dirs(task / "evaluations" / SOLVABILITY)
    passing = [
        run for run in runs
        if _reward(run) == 1.0 and _trajectory(run) is not None and not _is_oracle(run)
    ]
    if len(passing) != 1:
        _add_finding(
            report, profile, "T0.solvability",
            "requires exactly one reward-1.0 non-Oracle run with a saved trajectory",
        )


def _check_difficulty(task: Path, report: Report, profile: str) -> None:
    runs = _trial_dirs(task / "evaluations" / DIFFICULTY)
    if len(runs) not in {4, 5}:
        _add_finding(
            report, profile, "T0.difficulty-count",
            f"requires four or five difficulty trials; found {len(runs)}",
        )
        return
    invalid: list[str] = []
    for run in runs:
        agent, model, environment = _run_identity(run)
        if _reward(run) is None or _trajectory(run) is None or _is_oracle(run):
            invalid.append(run.name)
        elif not all((agent, model, environment)):
            invalid.append(run.name + " (missing provenance)")
        elif "glm-5.2" not in model.lower() and "glm-5p2" not in model.lower():
            invalid.append(run.name + " (not GLM-5.2)")
    if invalid:
        _add_finding(
            report, profile, "T0.difficulty-trials",
            "invalid difficulty trials: " + _listed(invalid),
        )
        return
    passes = sum(_reward(run) == 1.0 for run in runs[:4])
    if passes > 2:
        _add_finding(
            report, profile, "T2.difficulty-score",
            f"{passes}/4 difficulty trials passed; deterministic delivery limit is 2/4",
            tier=2,
        )


def _check_stability(task: Path, report: Report, profile: str) -> None:
    runs = _trial_dirs(task / "evaluations" / STABILITY)
    if len(runs) < 3:
        _add_finding(
            report, profile, "T0.stability-count",
            f"requires at least three frozen-answer regrades; found {len(runs)}",
        )
        return
    rewards = [_reward(run) for run in runs]
    trajectory_hashes = [_sha256(_trajectory(run)) if _trajectory(run) else None for run in runs]
    config_hashes = [_sha256(run / "config.json") for run in runs]
    lock_hashes = [_sha256(run / "lock.json") for run in runs]
    if None in rewards or len(set(rewards)) != 1:
        _add_finding(report, profile, "T0.stability-reward", "stability regrade rewards disagree or are missing")
    if None in trajectory_hashes or len(set(trajectory_hashes)) != 1:
        _add_finding(report, profile, "T0.stability-identity", "stability regrades do not use one frozen trajectory")
    if None in config_hashes or len(set(config_hashes)) != 1:
        _add_finding(report, profile, "T0.stability-config", "stability config.json files are missing or differ")
    if None in lock_hashes or len(set(lock_hashes)) != 1:
        _add_finding(report, profile, "T0.stability-lock", "stability lock.json files are missing or differ")


def _check_platform(task: Path, report: Report, profile: str) -> None:
    for provider, roles in {"e2b": ("oracle", "codex"), "modal": ("oracle", "run")}.items():
        for role in roles:
            root = task / "evaluations" / PLATFORM / provider / role
            runs = _trial_dirs(root)
            if len(runs) != 1:
                _add_finding(
                    report, profile, "T0.platform-layout",
                    f"evaluations/platform/{provider}/{role} requires exactly one run; found {len(runs)}",
                )
                continue
            run = runs[0]
            if _reward(run) is None:
                _add_finding(
                    report, profile, "T0.platform-reward",
                    f"platform {provider}/{role} has no readable reward",
                )
            if role == "oracle" and _reward(run) != 1.0:
                _add_finding(
                    report, profile, "T0.platform-oracle-reward",
                    f"platform {provider} Oracle reward must be 1.0",
                )
            if role != "oracle" and _trajectory(run) is None:
                _add_finding(
                    report, profile, "T0.platform-trajectory",
                    f"platform {provider}/{role} has no saved agent trajectory",
                )
            if role != "oracle" and not (run / "sanity_check.md").is_file():
                _add_finding(
                    report, profile, "T0.platform-sanity-check",
                    f"platform {provider}/{role} lacks digest-bound sanity_check.md",
                )


def validate_task(task: Path, profile: str = UPLOAD) -> Report:
    """Run the copied deterministic checks over one Harbor task directory.

    Unlike the source validator's ``validate_task``, this function never calls
    semantic reviewers.  Its `audit` and `delivery` results represent only the
    deterministic portion of the source policy.
    """
    if profile not in PROFILES:
        raise ValueError(f"unknown profile: {profile!r}")
    task = Path(task)
    report = Report(task=task.name, path=task)
    parsed = _load_toml(task / "task.toml") if (task / "task.toml").is_file() else None
    gyms = (parsed or {}).get("metadata", {}).get("mcp_servers_extended", [])
    report.family = "connector" if isinstance(gyms, list) and gyms else "native"
    report.info.update(
        {
            "profile": profile,
            "checker": "checks/deterministic_task_validation.py",
            "semantic_review": "not-run (intentionally excluded)",
        }
    )

    _check_common(task, report)
    _check_specs(task, report)
    _check_mirror(task, report)
    _check_evaluation_shape(task, report, profile)

    if (task / "evaluations").exists():
        _check_final_root(task, report, profile)
        _check_certificate(task, report, profile)
        _check_solvability(task, report, profile)
        _check_difficulty(task, report, profile)
        _check_stability(task, report, profile)
        if profile == DELIVERY:
            _check_platform(task, report, profile)
    elif profile == DELIVERY:
        _add_finding(
            report, profile, "T0.delivery-evaluations-missing",
            "evaluations/ is required for a delivery package",
        )
    return report


def discover(root: Path) -> tuple[list[Path], list[Path]]:
    """Find independent task roots and flag packages nested within another."""
    candidates = sorted(
        {path.parent for path in root.rglob("task.toml")},
        key=lambda path: (len(path.relative_to(root).parts), path.as_posix()),
    )
    independent: list[Path] = []
    nested: list[Path] = []
    for candidate in candidates:
        parent = next((item for item in independent if candidate.is_relative_to(item)), None)
        if parent is None:
            independent.append(candidate)
        elif not candidate.is_relative_to(parent / "environment"):
            nested.append(candidate)
    return independent, nested


def validate_tree(root: Path, profile: str = UPLOAD) -> tuple[list[Report], list[Path]]:
    """Run ``validate_task`` for every independent task below ``root``."""
    root = Path(root)
    tasks, nested = discover(root)
    if root.joinpath("task.toml").is_file() and not tasks:
        tasks = [root]
    reports = [validate_task(task, profile) for task in tasks]
    names = {task.name for task in tasks}
    for name in names:
        matching = [task for task in tasks if task.name == name]
        if len(matching) > 1:
            for report in reports:
                if report.task == name:
                    report.errors.append(f"duplicate task folder identity: {name}")
    return reports, nested


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="Harbor task directory or tree of tasks")
    parser.add_argument("--profile", choices=PROFILES, default=AUDIT)
    parser.add_argument("--json", action="store_true", help="Print a JSON report")
    args = parser.parse_args()
    if not args.target.is_dir():
        parser.error(f"target is not a directory: {args.target}")
    reports, nested = validate_tree(args.target, args.profile)
    payload = {
        "checker": "checks/deterministic_task_validation.py",
        "profile": args.profile,
        "semantic_review": "not-run (intentionally excluded)",
        "tasks": [report.as_dict() for report in reports],
        "nested": [str(path.relative_to(args.target)) for path in nested],
        "summary": {
            "total": len(reports),
            "passed": sum(report.ok for report in reports),
            "failed": sum(not report.ok for report in reports),
        },
    }
    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        for report in reports:
            detail = report.errors[0] if report.errors else (
                report.warnings[0] if report.warnings else "ok"
            )
            print(f"{report.audit_status:<13} {report.task:<55} {detail}")
        print(
            f"\n{args.profile}: {payload['summary']['passed']}/{payload['summary']['total']} "
            "tasks passed deterministic checks"
        )
    return 0 if all(report.ok for report in reports) and not nested else 1


if __name__ == "__main__":
    sys.exit(main())
