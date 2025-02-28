from datetime import datetime, timedelta, date
from sqlmodel import Session, select
from app.database import engine
from app.models import (
    Equipment, 
    Inspector, 
    Inspection,
    DailyReport, 
    DailyReportInspector,
    InspectionStatus,
    InspectorType
)

def seed_equipment():
    with Session(engine) as session:
        if session.exec(select(Equipment)).first():
            print("Equipment data already exists")
            return

        equipment_list = [
            Equipment(
                equipment_code="EQ001",
                location="Unit 100",
                type="Vessel",
                installation_date=date(2020, 1, 1),
                operating_pressure=10.5,
                operating_temperature=350.0,
                material="Carbon Steel",
                degradation_mechanism="Corrosion",
                initial_thickness=12.0,
                min_thickness=6.0,
                safety_factor=0.2,
                max_inspection_interval=5,
                risk_level="medium"
            ),
            Equipment(
                equipment_code="EQ002",
                location="Unit 101",
                type="Pipeline",
                installation_date=date(2019, 6, 1),
                operating_pressure=15.0,
                operating_temperature=250.0,
                material="Stainless Steel",
                degradation_mechanism="Erosion",
                initial_thickness=8.0,
                min_thickness=4.0,
                safety_factor=0.25,
                max_inspection_interval=3,
                risk_level="high"
            ),
            Equipment(
                equipment_code="EQ003",
                location="Unit 102",
                type="Heat Exchanger",
                installation_date=date(2021, 3, 15),
                operating_pressure=8.0,
                operating_temperature=400.0,
                material="Carbon Steel",
                degradation_mechanism="Thermal Fatigue",
                initial_thickness=10.0,
                min_thickness=5.0,
                safety_factor=0.3,
                max_inspection_interval=4,
                risk_level="low"
            )
        ]
        
        for equipment in equipment_list:
            session.add(equipment)
        session.commit()
        print("Equipment data seeded successfully")

def seed_inspectors():
    with Session(engine) as session:
        if session.exec(select(Inspector)).first():
            print("Inspector data already exists")
            return

        inspectors = [
            Inspector(name="John Doe", inspector_type=InspectorType.MECHANICAL),
            Inspector(name="Jane Smith", inspector_type=InspectorType.CORROSION),
            Inspector(name="Bob Wilson", inspector_type=InspectorType.NDT),
            Inspector(name="Alice Brown", inspector_type=InspectorType.MECHANICAL),
            Inspector(name="Charlie Davis", inspector_type=InspectorType.CORROSION)
        ]
        
        for inspector in inspectors:
            session.add(inspector)
        session.commit()
        print("Inspector data seeded successfully")

def seed_inspections_and_reports():
    with Session(engine) as session:
        if session.exec(select(Inspection)).first():
            print("Inspection data already exists")
            return

        # Create inspections for each equipment
        inspections = [
            # Equipment 1 Inspections
            Inspection(
                equipment_id=1,
                start_date=datetime.now() - timedelta(days=90),
                end_date=datetime.now() - timedelta(days=88),
                status=InspectionStatus.COMPLETED,
                final_description="Annual thickness measurement completed",
                measured_thickness=11.2,
                report_file_path="/reports/EQ001/2024/inspection_01.pdf"
            ),
            # Equipment 2 Inspections
            Inspection(
                equipment_id=2,
                start_date=datetime.now() - timedelta(days=45),
                end_date=datetime.now() - timedelta(days=43),
                status=InspectionStatus.COMPLETED,
                final_description="Erosion monitoring inspection completed",
                measured_thickness=7.5,
                report_file_path="/reports/EQ002/2024/inspection_01.pdf"
            ),
            # Equipment 3 Inspections - In Progress
            Inspection(
                equipment_id=3,
                start_date=datetime.now() - timedelta(days=2),
                status=InspectionStatus.IN_PROGRESS,
                final_description="Ongoing thermal fatigue inspection"
            )
        ]

        for inspection in inspections:
            session.add(inspection)
        session.commit()

        # Create daily reports for completed inspections
        daily_reports = [
            # Reports for Equipment 1 Inspection
            DailyReport(
                inspection_id=1,
                report_date=datetime.now() - timedelta(days=90),
                description="Started thickness measurement at critical points"
            ),
            DailyReport(
                inspection_id=1,
                report_date=datetime.now() - timedelta(days=89),
                description="Completed measurements, identified minor wall loss"
            ),
            DailyReport(
                inspection_id=1,
                report_date=datetime.now() - timedelta(days=88),
                description="Final report preparation and documentation"
            ),
            # Reports for Equipment 2 Inspection
            DailyReport(
                inspection_id=2,
                report_date=datetime.now() - timedelta(days=45),
                description="Initial erosion assessment started"
            ),
            DailyReport(
                inspection_id=2,
                report_date=datetime.now() - timedelta(days=44),
                description="Identified high erosion areas, additional measurements taken"
            ),
            DailyReport(
                inspection_id=2,
                report_date=datetime.now() - timedelta(days=43),
                description="Completed inspection and recommendations provided"
            ),
            # Reports for Equipment 3 Inspection (In Progress)
            DailyReport(
                inspection_id=3,
                report_date=datetime.now() - timedelta(days=2),
                description="Started thermal imaging inspection"
            ),
            DailyReport(
                inspection_id=3,
                report_date=datetime.now() - timedelta(days=1),
                description="Continued inspection of critical areas"
            )
        ]

        for report in daily_reports:
            session.add(report)
        session.commit()

        # Assign inspectors to daily reports
        daily_report_inspectors = [
            # Equipment 1 Inspection
            DailyReportInspector(daily_report_id=1, inspector_id=1),  # John Doe
            DailyReportInspector(daily_report_id=1, inspector_id=2),  # Jane Smith
            DailyReportInspector(daily_report_id=2, inspector_id=1),
            DailyReportInspector(daily_report_id=3, inspector_id=1),
            # Equipment 2 Inspection
            DailyReportInspector(daily_report_id=4, inspector_id=2),
            DailyReportInspector(daily_report_id=4, inspector_id=3),  # Bob Wilson
            DailyReportInspector(daily_report_id=5, inspector_id=2),
            DailyReportInspector(daily_report_id=6, inspector_id=2),
            # Equipment 3 Inspection
            DailyReportInspector(daily_report_id=7, inspector_id=4),  # Alice Brown
            DailyReportInspector(daily_report_id=7, inspector_id=5),  # Charlie Davis
            DailyReportInspector(daily_report_id=8, inspector_id=4),
            DailyReportInspector(daily_report_id=8, inspector_id=5)
        ]

        for assignment in daily_report_inspectors:
            session.add(assignment)
        session.commit()
        print("Inspections and daily reports seeded successfully")

def main():
    print("Starting inspection data seeding...")
    seed_equipment()
    seed_inspectors()
    seed_inspections_and_reports()
    print("Inspection data seeding completed!")

if __name__ == "__main__":
    main()