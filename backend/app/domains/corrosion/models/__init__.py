# Import models to make them accessible from the package
from app.domains.corrosion.models.location import CorrosionLocation
from app.domains.corrosion.models.coupon import (
    CorrosionCoupon, CouponStatus, CouponType, 
    CouponOrientation, MonitoringLevel
)
from app.domains.corrosion.models.analysis import CorrosionAnalysisReport, CorrosionType
