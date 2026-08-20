from src.models.audit_log import AuditLog
from src.services.system import SystemService


def test_audit_logs_include_actor_and_target_metadata(factory, db):
    actor = factory.person(role="work_admin", full_name="Alex Operator")
    log = AuditLog(
        actor_id=actor.id,
        action="REQUEST_CREATED",
        entity="work_request",
        reason="Laptop request",
    )
    db.add(log)
    db.commit()

    result = SystemService.get_audit_logs(db)

    assert len(result) == 1
    assert result[0].actor == "Alex Operator"
    assert result[0].role == "work_admin"
    assert result[0].target == "work_request"
    assert result[0].outcome == "success"
