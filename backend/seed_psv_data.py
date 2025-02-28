from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.database import engine
from app.psv_models import (
    PSV, 
    Calibration, 
    RBIConfiguration, 
    ServiceRiskCategory,
    PSVStatus,
    TestMedium,
    WorkMaintenance
)

def seed_service_risk_categories():
    with Session(engine) as session:
        if session.exec(select(ServiceRiskCategory)).first():
            print("Service risk categories already exist")
            return

        categories = [
            ServiceRiskCategory(
                service_type="Flammable Gas",
                cof_score=5,
                description="Highly flammable gases under high pressure",
                notes="Requires special handling and frequent inspection"
            ),
            ServiceRiskCategory(
                service_type="Steam",
                cof_score=3,
                description="High temperature steam service",
                notes="Regular inspection required"
            ),
            ServiceRiskCategory(
                service_type="Water",
                cof_score=1,
                description="Non-hazardous water service",
                notes="Standard inspection protocol"
            ),
            ServiceRiskCategory(
                service_type="Toxic Gas",
                cof_score=4,
                description="Hazardous toxic gas service",
                notes="Special safety measures required"
            )
        ]

        for category in categories:
            session.add(category)
        session.commit()
        print("Service risk categories seeded successfully")

def seed_rbi_configurations():
    with Session(engine) as session:
        if session.exec(select(RBIConfiguration)).first():
            print("RBI configurations already exist")
            return

        configs = [
            RBIConfiguration(
                level=1,
                name="Basic Fixed Interval",
                description="Simple time-based inspection regime",
                active=True,
                settings={
                    "fixed_interval": 24  # months
                }
            ),
            RBIConfiguration(
                level=2,
                name="Test Based Assessment",
                description="Assessment based on test results",
                active=True,
                settings={
                    "pop_test_thresholds": {
                        "min": -5,
                        "max": 5
                    },
                    "leak_test_thresholds": {
                        "min": -10,
                        "max": 10
                    },
                    "parameter_weights": {
                        "pop_test": 0.6,
                        "leak_test": 0.4
                    }
                }
            ),
            RBIConfiguration(
                level=3,
                name="Condition Based",
                description="Assessment based on component condition",
                active=True,
                settings={
                    "parameter_weights": {
                        "body_condition": 0.4,
                        "internal_parts": 0.3,
                        "seat_plug": 0.3
                    }
                }
            ),
            RBIConfiguration(
                level=4,
                name="Risk Based API 581",
                description="Full risk-based assessment using API 581",
                active=True,
                settings={
                    "parameter_weights": {
                        "condition": 0.4,
                        "service": 0.3,
                        "history": 0.3
                    },
                    "service_risk_multipliers": {
                        "toxic": 1.5,
                        "flammable": 1.3,
                        "high_pressure": 1.2
                    }
                }
            )
        ]

        for config in configs:
            session.add(config)
        session.commit()
        print("RBI configurations seeded successfully")

def seed_psv_data():
    with Session(engine) as session:
        if session.exec(select(PSV)).first():
            print("PSV data already exists")
            return

        # PSV Data
        psv_list = [
            PSV(
                tag_number="PSV-100",
                unique_no="UN100",
                status=PSVStatus.Main.value,
                frequency=24,
                last_calibration_date=datetime.now() - timedelta(days=365),
                expire_date=datetime.now() + timedelta(days=365),
                unit="Unit 100",
                train="Train A",
                type="Spring Loaded",
                serial_no="SN001",
                set_pressure=10.0,
                cdtp=12.0,
                back_pressure=1.0,
                nps="2\"",
                inlet_size="2\"",
                inlet_rating="300#",
                outlet_size="3\"",
                outlet_rating="150#",
                p_and_id="P&ID-100",
                line_number="L100",
                service="Gas",
                data_sheet_no="DS100",
                manufacturer="Crosby"
            ),
            PSV(
                tag_number="PSV-101",
                unique_no="UN101",
                status=PSVStatus.Spare.value,
                frequency=36,
                last_calibration_date=datetime.now() - timedelta(days=180),
                expire_date=datetime.now() + timedelta(days=900),
                unit="Unit 100",
                train="Train B",
                type="Pilot Operated",
                serial_no="SN002",
                set_pressure=15.0,
                cdtp=18.0,
                back_pressure=2.0,
                nps="1\"",
                inlet_size="1\"",
                inlet_rating="600#",
                outlet_size="2\"",
                outlet_rating="300#",
                p_and_id="P&ID-101",
                line_number="L101",
                service="Steam",
                data_sheet_no="DS101",
                manufacturer="Leser"
            ),
            PSV(
                tag_number="PSV-102",
                unique_no="UN102",
                status=PSVStatus.Main.value,
                frequency=12,
                last_calibration_date=datetime.now() - timedelta(days=90),
                expire_date=datetime.now() + timedelta(days=275),
                unit="Unit 101",
                train="Train A",
                type="Spring Loaded",
                serial_no="SN003",
                set_pressure=20.0,
                cdtp=24.0,
                back_pressure=3.0,
                nps="3\"",
                inlet_size="3\"",
                inlet_rating="900#",
                outlet_size="4\"",
                outlet_rating="600#",
                p_and_id="P&ID-102",
                line_number="L102",
                service="Toxic Gas",
                data_sheet_no="DS102",
                manufacturer="Tyco"
            )
        ]
        
        for psv in psv_list:
            session.add(psv)
        session.commit()

        # Calibration Data
        calibration_list = [
            Calibration(
                tag_number="PSV-100",
                calibration_date=datetime.now() - timedelta(days=365),
                work_maintenance=WorkMaintenance.Adjust.value,
                test_medium=TestMedium.Air.value,
                inspector="John Doe",
                test_operator="Bob Smith",
                general_condition="Good condition",
                approved_by="Jane Wilson",
                work_no="W001",
                post_repair_pop_test=10.2,
                post_repair_leak_test=8.5
            ),
            Calibration(
                tag_number="PSV-101",
                calibration_date=datetime.now() - timedelta(days=180),
                work_maintenance=WorkMaintenance.Lapping.value,
                test_medium=TestMedium.Nitrogen.value,
                inspector="Jane Smith",
                test_operator="Alice Brown",
                general_condition="Minor repairs needed",
                approved_by="John Wilson",
                work_no="W002",
                pre_repair_pop_test=15.5,
                pre_repair_leak_test=13.2,
                post_repair_pop_test=15.1,
                post_repair_leak_test=12.8,
                body_condition_score=4,
                body_condition_notes="Good overall condition",
                internal_parts_score=3,
                internal_parts_notes="Some wear on internals",
                seat_plug_condition_score=3,
                seat_plug_notes="Minor scratches"
            ),
            Calibration(
                tag_number="PSV-102",
                calibration_date=datetime.now() - timedelta(days=90),
                work_maintenance=WorkMaintenance.Cleaning.value,
                test_medium=TestMedium.Nitrogen.value,
                inspector="Bob Wilson",
                test_operator="Charlie Davis",
                general_condition="Excellent",
                approved_by="Jane Wilson",
                work_no="W003",
                pre_repair_pop_test=20.2,
                pre_repair_leak_test=18.5,
                post_repair_pop_test=20.0,
                post_repair_leak_test=18.0,
                body_condition_score=5,
                body_condition_notes="Excellent condition",
                internal_parts_score=4,
                internal_parts_notes="Minor normal wear",
                seat_plug_condition_score=4,
                seat_plug_notes="Good seating surface"
            )
        ]

        for calibration in calibration_list:
            session.add(calibration)
        session.commit()
        print("PSV and calibration data seeded successfully")

def main():
    print("Starting PSV data seeding...")
    seed_service_risk_categories()
    seed_rbi_configurations()
    seed_psv_data()
    print("PSV data seeding completed!")

if __name__ == "__main__":
    main()