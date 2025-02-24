from datetime import datetime, date, timedelta
from sqlmodel import Session
import random
from app.database import engine
from app.models import Equipment, Inspector, Inspection, DailyReport, DailyReportInspector
from app.models import RiskLevel, InspectorType, InspectionStatus

def create_test_data():
    with Session(engine) as session:
        # Create 10 Equipment records
        equipment_types = ["Pump", "Vessel", "Pipeline", "Heat Exchanger", "Tank"]
        materials = ["Carbon Steel", "Stainless Steel", "Alloy Steel", "Duplex"]
        mechanisms = ["Corrosion", "Erosion", "Fatigue", "Cracking"]
        
        equipments = []
        for i in range(10):
            equipment = Equipment(
                equipment_code=f"EQ-{2024}-{i+1:03d}",
                location=f"Area {random.randint(1, 5)}",
                type=random.choice(equipment_types),
                installation_date=date(2020, random.randint(1, 12), random.randint(1, 28)),
                operating_pressure=random.uniform(1.0, 10.0),
                operating_temperature=random.uniform(50.0, 300.0),
                material=random.choice(materials),
                degradation_mechanism=random.choice(mechanisms),
                initial_thickness=random.uniform(10.0, 20.0),
                min_thickness=random.uniform(5.0, 8.0),
                safety_factor=random.uniform(0.1, 0.3),
                max_inspection_interval=random.randint(1, 5),
                risk_level=random.choice([e.value for e in RiskLevel])
            )
            session.add(equipment)
            equipments.append(equipment)
        
        # Commit to get equipment IDs
        session.commit()
        
        # Create 10 Inspectors
        inspectors = []
        inspector_names = ["Ali", "Mohammad", "Reza", "Hassan", "Ahmad", "Mehdi", "Amir", "Hamid", "Saeed", "Javad"]
        
        for i in range(10):
            inspector = Inspector(
                name=inspector_names[i],
                inspector_type=random.choice([e.value for e in InspectorType])
            )
            session.add(inspector)
            inspectors.append(inspector)
        
        # Commit to get inspector IDs
        session.commit()
        
        # Create 10 Inspections with valid equipment_ids
        inspections = []
        for i in range(10):
            start_date = datetime.now() - timedelta(days=random.randint(1, 60))
            inspection = Inspection(
                equipment_id=random.choice(equipments).id,  # Now we have valid equipment IDs
                start_date=start_date,
                end_date=start_date + timedelta(days=random.randint(1, 30)) if random.choice([True, False]) else None,
                status=random.choice([e.value for e in InspectionStatus]),
                final_description="Inspection completed successfully" if random.choice([True, False]) else None,
                measured_thickness=random.uniform(8.0, 15.0) if random.choice([True, False]) else None
            )
            session.add(inspection)
            inspections.append(inspection)
        
        # Commit to get inspection IDs
        session.commit()
        
        # Create 10 Daily Reports with random inspectors
        for i in range(10):
            daily_report = DailyReport(
                inspection_id=random.choice(inspections).id,  # Now we have valid inspection IDs
                report_date=datetime.now() - timedelta(days=random.randint(0, 30)),
                description=f"Daily inspection activities performed on day {i+1}. Found {random.choice(['no', 'minor', 'major'])} issues."
            )
            session.add(daily_report)
            session.flush()  # This ensures we have the daily_report.id for the many-to-many relationship
            
            # Assign 1-3 random inspectors to each daily report
            num_inspectors = random.randint(1, 3)
            selected_inspectors = random.sample(inspectors, num_inspectors)
            for inspector in selected_inspectors:
                daily_report_inspector = DailyReportInspector(
                    daily_report_id=daily_report.id,
                    inspector_id=inspector.id
                )
                session.add(daily_report_inspector)
        
        # Final commit for all remaining changes
        session.commit()

if __name__ == "__main__":
    create_test_data()
    print("Test data has been successfully created!")