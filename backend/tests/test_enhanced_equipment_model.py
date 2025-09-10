import pytest
from datetime import date, datetime
from sqlmodel import Session, create_engine, SQLModel
from app.domains.equipment.models.equipment import Equipment

# Create in-memory SQLite database for testing
engine = create_engine("sqlite:///:memory:")

@pytest.fixture
def session():
    """Create a test database session"""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_equipment_creation_with_required_fields(session):
    """Test creating equipment with required fields"""
    equipment = Equipment(
        tag="P-001",
        description="Main Process Pump",
        unit="Unit 1",
        equipment_type="Pump"
    )
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    assert equipment.id is not None
    assert equipment.tag == "P-001"
    assert equipment.description == "Main Process Pump"
    assert equipment.unit == "Unit 1"
    assert equipment.equipment_type == "Pump"
    assert equipment.created_at is not None
    assert equipment.updated_at is not None

def test_equipment_tag_uniqueness(session):
    """Test that equipment TAG must be unique"""
    equipment1 = Equipment(
        tag="P-UNIQUE-001",
        description="First Pump",
        unit="Unit 1",
        equipment_type="Pump"
    )
    
    equipment2 = Equipment(
        tag="P-UNIQUE-001",  # Same TAG
        description="Second Pump",
        unit="Unit 2",
        equipment_type="Pump"
    )
    
    session.add(equipment1)
    session.commit()
    
    session.add(equipment2)
    with pytest.raises(Exception):  # Should raise integrity error
        session.commit()

def test_equipment_with_all_fields(session):
    """Test creating equipment with all optional fields"""
    equipment = Equipment(
        tag="HX-001",
        description="Heat Exchanger",
        unit="Unit 1",
        train="Train A",
        equipment_type="Heat Exchanger",
        installation_date=date(2020, 1, 15),
        operating_pressure=10.5,
        operating_temperature=150.0,
        material="Stainless Steel 316L",
        inspection_interval_months=12,
        p_and_id="P&ID-001-Rev-A",
        data_sheet_path="/docs/equipment/HX-001-datasheet.pdf"
    )
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    assert equipment.tag == "HX-001"
    assert equipment.description == "Heat Exchanger"
    assert equipment.unit == "Unit 1"
    assert equipment.train == "Train A"
    assert equipment.equipment_type == "Heat Exchanger"
    assert equipment.installation_date == date(2020, 1, 15)
    assert equipment.operating_pressure == 10.5
    assert equipment.operating_temperature == 150.0
    assert equipment.material == "Stainless Steel 316L"
    assert equipment.inspection_interval_months == 12
    assert equipment.p_and_id == "P&ID-001-Rev-A"
    assert equipment.data_sheet_path == "/docs/equipment/HX-001-datasheet.pdf"

def test_equipment_optional_fields_can_be_none(session):
    """Test that optional fields can be None"""
    equipment = Equipment(
        tag="V-001",
        unit="Unit 1",
        equipment_type="Vessel"
        # description is None
        # train is None
        # All other optional fields are None
    )
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    assert equipment.tag == "V-001"
    assert equipment.description is None
    assert equipment.train is None
    assert equipment.installation_date is None
    assert equipment.operating_pressure is None
    assert equipment.operating_temperature is None
    assert equipment.material is None
    assert equipment.inspection_interval_months is None
    assert equipment.p_and_id is None
    assert equipment.data_sheet_path is None

def test_equipment_tag_indexing(session):
    """Test that TAG field is properly indexed for fast lookups"""
    # Create multiple equipment items
    equipment_list = []
    for i in range(5):
        equipment = Equipment(
            tag=f"P-INDEX-00{i+1}",
            description=f"Pump {i+1}",
            unit="Unit 1",
            equipment_type="Pump"
        )
        equipment_list.append(equipment)
    
    session.add_all(equipment_list)
    session.commit()
    
    # Test lookup by TAG
    found_equipment = session.query(Equipment).filter(Equipment.tag == "P-INDEX-003").first()
    assert found_equipment is not None
    assert found_equipment.description == "Pump 3"

def test_equipment_timestamps_auto_generated(session):
    """Test that timestamps are automatically generated"""
    before_creation = datetime.utcnow()
    
    equipment = Equipment(
        tag="T-001",
        unit="Unit 1",
        equipment_type="Tank"
    )
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    after_creation = datetime.utcnow()
    
    assert before_creation <= equipment.created_at <= after_creation
    assert before_creation <= equipment.updated_at <= after_creation
    assert equipment.created_at == equipment.updated_at  # Should be same on creation

def test_equipment_different_types(session):
    """Test creating equipment of different types"""
    equipment_types = [
        ("P-TYPE-001", "Pump"),
        ("HX-TYPE-001", "Heat Exchanger"),
        ("V-TYPE-001", "Vessel"),
        ("C-TYPE-001", "Compressor"),
        ("T-TYPE-001", "Tank")
    ]
    
    for tag, eq_type in equipment_types:
        equipment = Equipment(
            tag=tag,
            unit="Unit 1",
            equipment_type=eq_type
        )
        session.add(equipment)
    
    session.commit()
    
    # Verify all equipment was created
    all_equipment = session.query(Equipment).all()
    assert len(all_equipment) == 5
    
    # Verify each type
    for tag, eq_type in equipment_types:
        found = session.query(Equipment).filter(Equipment.tag == tag).first()
        assert found.equipment_type == eq_type
def te
st_equipment_properties_json_field(session):
    """Test that equipment can store additional properties in JSON field"""
    equipment = Equipment(
        tag="C-PROPS-001",
        unit="Unit 1",
        equipment_type="Compressor"
    )
    
    # Properties field should default to empty dict
    assert equipment.properties == {}
    
    # Add custom properties
    equipment.properties = {
        "manufacturer": "ABC Corp",
        "model": "XYZ-123",
        "serial_number": "SN123456",
        "custom_field": "custom_value"
    }
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    assert equipment.properties["manufacturer"] == "ABC Corp"
    assert equipment.properties["model"] == "XYZ-123"
    assert equipment.properties["serial_number"] == "SN123456"
    assert equipment.properties["custom_field"] == "custom_value"

def test_equipment_train_field(session):
    """Test equipment train field for multi-train units"""
    # Equipment with train
    equipment_with_train = Equipment(
        tag="GT-TRAIN-001A",
        unit="Unit 1",
        train="Train A",
        equipment_type="Gas Turbine"
    )
    
    # Equipment without train
    equipment_without_train = Equipment(
        tag="V-SINGLE-001",
        unit="Unit 1",
        equipment_type="Vessel"
    )
    
    session.add_all([equipment_with_train, equipment_without_train])
    session.commit()
    session.refresh(equipment_with_train)
    session.refresh(equipment_without_train)
    
    assert equipment_with_train.train == "Train A"
    assert equipment_without_train.train is None

def test_equipment_operating_parameters(session):
    """Test equipment operating parameters"""
    equipment = Equipment(
        tag="R-PARAMS-001",
        unit="Unit 1",
        equipment_type="Reactor",
        operating_pressure=50.5,
        operating_temperature=275.0,
        material="Hastelloy C-276"
    )
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    assert equipment.operating_pressure == 50.5
    assert equipment.operating_temperature == 275.0
    assert equipment.material == "Hastelloy C-276"

def test_equipment_inspection_interval(session):
    """Test equipment inspection interval field"""
    equipment = Equipment(
        tag="F-INTERVAL-001",
        unit="Unit 1",
        equipment_type="Furnace",
        inspection_interval_months=24
    )
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    assert equipment.inspection_interval_months == 24

def test_equipment_documentation_references(session):
    """Test equipment documentation reference fields"""
    equipment = Equipment(
        tag="E-DOCS-001",
        unit="Unit 1",
        equipment_type="Exchanger",
        p_and_id="P&ID-001-E-001-Rev-B",
        data_sheet_path="/docs/equipment/E-DOCS-001-datasheet.pdf"
    )
    
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    
    assert equipment.p_and_id == "P&ID-001-E-001-Rev-B"
    assert equipment.data_sheet_path == "/docs/equipment/E-DOCS-001-datasheet.pdf"