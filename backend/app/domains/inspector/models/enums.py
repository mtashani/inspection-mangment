from enum import Enum

class InspectorType(str, Enum):
    """Enumeration for inspector types"""
    Mechanical = "mechanical"
    Corrosion = "corrosion"
    NDT = "ndt"
    Electrical = "electrical"
    Instrumentation = "instrumentation"
    Civil = "civil"
    General = "general"
    PSVOperator = "psv_operator"
    LiftingEquipmentOperator = "lifting_equipment_operator"

class InspectorCertification(str, Enum):
    """Enumeration for inspector certifications"""
    API510 = "API510"        # Pressure Vessel Inspector
    API570 = "API570"        # Piping Inspector
    API653 = "API653"        # Above Ground Storage Tank Inspector
    API580 = "API580"        # Risk-Based Inspection
    API571 = "API571"        # Corrosion and Materials
    CSWIP = "CSWIP"          # Welding Inspector
    NACE = "NACE"            # Corrosion Engineer
    ASNT = "ASNT"            # Non-Destructive Testing
    IWI = "IWI"              # International Welding Inspector
    LEEA = "LEEA"            # Lifting Equipment Engineer
    OTHER = "OTHER"

class CertificationLevel(str, Enum):
    """Enumeration for certification levels"""
    Level1 = "level_1"
    Level2 = "level_2"
    Level3 = "level_3"
    Senior = "senior"
    Expert = "expert"

# New enums for attendance and payroll system
class WorkScheduleType(str, Enum):
    """Enumeration for work schedule types"""
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    fourteen_fourteen = "fourteen_fourteen"
    seven_seven = "seven_seven"
    office = "office"
    guest = "guest"

class AttendanceStatus(str, Enum):
    """Enumeration for attendance status"""
    WORKING = "WORKING"
    OVERTIME = "OVERTIME"
    RESTING = "RESTING"
    LEAVE = "LEAVE"
    SICK_LEAVE = "SICK_LEAVE"
    EMERGENCY = "EMERGENCY"
    UNAVAILABLE = "UNAVAILABLE"
    MISSION = "MISSION"

class LeaveType(str, Enum):
    """Enumeration for leave types"""
    Vacation = "vacation"
    Sick = "sick"
    Personal = "personal"
    Bereavement = "bereavement"
    JuryDuty = "jury_duty"

class LeaveRequestStatus(str, Enum):
    """Enumeration for leave request status"""
    Pending = "pending"
    Approved = "approved"
    Denied = "denied"
    Cancelled = "cancelled"

class PayrollItemType(str, Enum):
    """Enumeration for payroll item types"""
    Salary = "salary"
    Bonus = "bonus"
    Commission = "commission"
    Overtime = "overtime"
    Deduction = "deduction"

class PayrollStatus(str, Enum):
    """Enumeration for payroll record status"""
    Draft = "draft"
    Finalized = "finalized"
    Paid = "paid"