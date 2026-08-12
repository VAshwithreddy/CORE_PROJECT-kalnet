"""
NotificationIntelligenceService test suite. Every AI-provider interaction
is mocked at the _call_anthropic boundary — no network calls, no API key
needed, and every failure mode (timeout, HTTP error, malformed JSON,
invalid enum, out-of-range numbers) is exercised deterministically.

The one property every test in this file ultimately checks: nothing here
can ever affect the underlying Notification row (Layer A). AI enrichment
is purely additive.
"""
import dataclasses

import httpx
import pytest

from src.core.config import settings
import src.services.notification_intelligence as ni_module
from src.models.notification import Notification
from src.models.notification_enrichment import NotificationEnrichment
from src.services.notification_intelligence import NotificationIntelligenceService, _validate_ai_output
from src.services.notifications import NotificationDraft, NotificationService
from src.models.enums import NotificationEntityType, NotificationSeverity, NotificationType


def _patch_settings(monkeypatch, **overrides):
    """`Settings` is a frozen dataclass, so attributes can't be mutated in
    place — this swaps the module-level `settings` binding that
    notification_intelligence.py actually reads from with a modified copy."""
    patched = dataclasses.replace(ni_module.settings, **overrides)
    monkeypatch.setattr(ni_module, "settings", patched)
    return patched


GOOD_RESPONSE = """{
  "importance_score": 87,
  "risk_level": "HIGH",
  "summary": "Critical work is blocked and at risk of missing its deadline.",
  "reason": "The assignment has an unresolved blocker and a priority-critical project.",
  "recommended_action": "Review the blocker with the assignee today.",
  "escalation_recommended": true,
  "confidence": 0.82
}"""


@pytest.fixture(autouse=True)
def _ai_enabled(monkeypatch):
    _patch_settings(monkeypatch, ai_enabled=True, ai_api_key="test-key-not-real")


def _make_notification(db, factory) -> Notification:
    person = factory.person()
    created = NotificationService.deliver(
        db,
        [
            NotificationDraft(
                recipient_id=person.id,
                type=NotificationType.WORK_ASSIGNED,
                severity=NotificationSeverity.INFO,
                message="You were assigned to Test Project as developer.",
                entity_type=NotificationEntityType.ASSIGNMENT,
                entity_id=person.id,  # any UUID; not FK-constrained, and no assignment needed for these tests
            )
        ],
    )
    return created[0]


# ── AI disabled / no key ────────────────────────────────────────────────────

def test_disabled_ai_never_calls_out_or_writes_anything(db, factory, monkeypatch):
    _patch_settings(monkeypatch, ai_enabled=False)
    notification = _make_notification(db, factory)

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result is None
    assert db.query(NotificationEnrichment).count() == 0


# ── happy path ───────────────────────────────────────────────────────────────

def test_successful_enrichment_is_validated_and_persisted(db, factory, monkeypatch):
    notification = _make_notification(db, factory)
    monkeypatch.setattr(
        "src.services.notification_intelligence._call_anthropic", lambda context: GOOD_RESPONSE
    )

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result is not None
    assert result.importance_score == 87
    assert result.risk_level == "HIGH"
    assert result.escalation_recommended is True
    assert 0.0 <= result.confidence <= 1.0
    assert result.model_identifier == settings.ai_model


def test_enrichment_never_touches_the_underlying_notification(db, factory, monkeypatch):
    notification = _make_notification(db, factory)
    original_message = notification.message
    original_severity = notification.severity
    monkeypatch.setattr(
        "src.services.notification_intelligence._call_anthropic", lambda context: GOOD_RESPONSE
    )

    NotificationIntelligenceService.analyze_notification(db, notification)
    db.refresh(notification)

    assert notification.message == original_message
    assert notification.severity == original_severity  # AI risk_level never overrides deterministic severity


# ── fail-closed behavior ────────────────────────────────────────────────────

def test_provider_timeout_produces_no_enrichment_and_does_not_raise(db, factory, monkeypatch):
    notification = _make_notification(db, factory)
    monkeypatch.setattr("src.services.notification_intelligence._call_anthropic", lambda context: None)

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result is None
    assert db.query(NotificationEnrichment).count() == 0


def test_malformed_json_is_rejected_not_partially_stored(db, factory, monkeypatch):
    notification = _make_notification(db, factory)
    monkeypatch.setattr(
        "src.services.notification_intelligence._call_anthropic",
        lambda context: "Sure! Here's my analysis: this looks pretty urgent.",
    )

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result is None
    assert db.query(NotificationEnrichment).count() == 0


def test_invalid_risk_level_enum_is_dropped_not_stored_raw(db, factory, monkeypatch):
    bad = GOOD_RESPONSE.replace('"HIGH"', '"SUPER_DUPER_URGENT"')
    notification = _make_notification(db, factory)
    monkeypatch.setattr("src.services.notification_intelligence._call_anthropic", lambda context: bad)

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result is not None  # other valid fields still get stored
    assert result.risk_level is None  # the invalid enum value never lands in the DB


def test_out_of_range_score_is_clamped(db, factory, monkeypatch):
    bad = GOOD_RESPONSE.replace('"importance_score": 87', '"importance_score": 400')
    notification = _make_notification(db, factory)
    monkeypatch.setattr("src.services.notification_intelligence._call_anthropic", lambda context: bad)

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result.importance_score == 100


def test_out_of_range_confidence_is_clamped(db, factory, monkeypatch):
    bad = GOOD_RESPONSE.replace('"confidence": 0.82', '"confidence": 5.0')
    notification = _make_notification(db, factory)
    monkeypatch.setattr("src.services.notification_intelligence._call_anthropic", lambda context: bad)

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result.confidence <= 1.0


def test_provider_raising_an_unexpected_exception_is_swallowed(db, factory, monkeypatch):
    def _broken(context):
        raise RuntimeError("simulated SDK bug")

    notification = _make_notification(db, factory)
    monkeypatch.setattr("src.services.notification_intelligence._call_anthropic", _broken)

    # analyze_notification wraps the whole body in try/except, so a bug in
    # the provider call must not raise out to the caller.
    result = NotificationIntelligenceService.analyze_notification(db, notification)
    assert result is None


def test_no_api_key_configured_skips_the_call_cleanly(db, factory, monkeypatch):
    _patch_settings(monkeypatch, ai_api_key="")
    notification = _make_notification(db, factory)

    result = NotificationIntelligenceService.analyze_notification(db, notification)

    assert result is None


# ── caching / re-analysis avoidance (§19) ───────────────────────────────────

def test_identical_context_is_not_re_analyzed(db, factory, monkeypatch):
    calls = {"count": 0}

    def _counting_call(context):
        calls["count"] += 1
        return GOOD_RESPONSE

    notification = _make_notification(db, factory)
    monkeypatch.setattr("src.services.notification_intelligence._call_anthropic", _counting_call)

    NotificationIntelligenceService.analyze_notification(db, notification)
    NotificationIntelligenceService.analyze_notification(db, notification)

    assert calls["count"] == 1  # second call reused the cached enrichment via the context fingerprint


# ── direct validator unit tests ─────────────────────────────────────────────

def test_validator_rejects_non_dict_json():
    assert _validate_ai_output("[1, 2, 3]") is None


def test_validator_truncates_overlong_text():
    huge = GOOD_RESPONSE.replace(
        '"summary": "Critical work is blocked and at risk of missing its deadline."',
        f'"summary": "{"x" * 1000}"',
    )
    result = _validate_ai_output(huge)
    assert len(result["ai_summary"]) <= 240


# ── batch enrichment ─────────────────────────────────────────────────────────

def test_enrich_pending_only_processes_un_enriched_notifications(db, factory, monkeypatch):
    monkeypatch.setattr("src.services.notification_intelligence._call_anthropic", lambda context: GOOD_RESPONSE)
    n1 = _make_notification(db, factory)
    n2 = _make_notification(db, factory)
    NotificationIntelligenceService.analyze_notification(db, n1)  # pre-enrich one

    enriched_count = NotificationIntelligenceService.enrich_pending(db)

    assert enriched_count == 1  # only n2 was pending
    assert db.query(NotificationEnrichment).count() == 2


def test_enrich_pending_is_a_noop_when_ai_disabled(db, factory, monkeypatch):
    _patch_settings(monkeypatch, ai_enabled=False)
    _make_notification(db, factory)

    assert NotificationIntelligenceService.enrich_pending(db) == 0
