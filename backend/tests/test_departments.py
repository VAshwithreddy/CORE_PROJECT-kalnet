from src.services.departments import DepartmentsService


def test_department_list_includes_its_assigned_head(factory, db):
    head = factory.person(role="department_head", full_name="Avery Head")
    department = factory.department(head_person_id=head.id, name="Operations")
    head.department_id = department.id
    head.job_title = "Director of Operations"
    db.commit()

    departments = DepartmentsService.get_all_departments(db)

    assert len(departments) == 1
    result = departments[0]
    assert result.head_person_id == head.id
    assert result.head_name == "Avery Head"
    assert result.head_email == head.email
    assert result.head_job_title == "Director of Operations"


def test_department_list_falls_back_to_a_department_head_role(factory, db):
    department = factory.department(name="Engineering")
    head = factory.person(
        role="department_head",
        department_id=department.id,
        full_name="Jordan Head",
    )

    departments = DepartmentsService.get_all_departments(db)

    assert departments[0].head_person_id == head.id
    assert departments[0].head_name == "Jordan Head"
