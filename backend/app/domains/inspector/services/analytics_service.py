# Analytics Service for Attendance Analysis and Insights
from typing import Dict, List, Optional, Tuple
from sqlmodel import Session, select, func, text
from datetime import datetime, date, timedelta
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.attendance import AttendanceRecord, MonthlyAttendance
from app.domains.inspector.models.enums import AttendanceStatus
from app.common.utils import jalali_calendar
import statistics


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_attendance_overview(self, timeframe: str = "current_month") -> Dict:
        """Get comprehensive attendance overview analytics"""
        
        if timeframe == "current_month":
            jalali_today = jalali_calendar.gregorian_to_jalali_str(date.today())
            jalali_year, jalali_month, _ = map(int, jalali_today.split('-'))
            start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
            days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
            end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
            period_name = f"{jalali_calendar.get_jalali_month_name(jalali_month)} {jalali_year}"
        elif timeframe == "last_30_days":
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
            period_name = "Last 30 Days"
        else:  # current_week
            today = date.today()
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
            period_name = "Current Week"

        # Get total inspectors with attendance tracking
        total_inspectors = self.db.exec(
            select(func.count(Inspector.id)).where(
                Inspector.active == True,
                Inspector.attendance_tracking_enabled == True
            )
        ).first() or 0

        # Get attendance records for the period
        records = self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.date >= start_date,
                AttendanceRecord.date <= end_date
            )
        ).all()

        # Calculate status distribution
        status_counts = {}
        for status in AttendanceStatus:
            status_counts[status.value] = 0
        
        total_hours = 0
        total_overtime = 0
        
        for record in records:
            status_counts[record.status.value] += 1
            total_hours += record.regular_hours
            total_overtime += record.overtime_hours

        total_records = len(records)
        working_days = status_counts.get('WORKING', 0)
        attendance_rate = (working_days / max(total_records, 1)) * 100 if total_records > 0 else 0

        return {
            "period": period_name,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_inspectors": total_inspectors,
            "total_records": total_records,
            "status_distribution": status_counts,
            "attendance_rate": round(attendance_rate, 1),
            "total_working_hours": total_hours,
            "total_overtime_hours": total_overtime,
            "average_daily_attendance": round(working_days / max((end_date - start_date).days + 1, 1), 1)
        }

    def calculate_attendance_trends(self, jalali_year: int, jalali_month: int) -> Dict:
        """Calculate attendance trends for a specific Jalali month"""
        
        # Get current month data
        current_data = self._get_month_attendance_data(jalali_year, jalali_month)
        
        # Get previous month data for comparison
        prev_month = jalali_month - 1
        prev_year = jalali_year
        if prev_month < 1:
            prev_month = 12
            prev_year -= 1
        
        previous_data = self._get_month_attendance_data(prev_year, prev_month)
        
        # Calculate trends
        attendance_trend = self._calculate_trend(
            previous_data.get('attendance_rate', 0),
            current_data.get('attendance_rate', 0)
        )
        
        overtime_trend = self._calculate_trend(
            previous_data.get('total_overtime_hours', 0),
            current_data.get('total_overtime_hours', 0)
        )
        
        # Daily trends within the month
        daily_trends = self._calculate_daily_trends(jalali_year, jalali_month)
        
        return {
            "current_month": current_data,
            "previous_month": previous_data,
            "trends": {
                "attendance_rate": attendance_trend,
                "overtime_hours": overtime_trend
            },
            "daily_trends": daily_trends,
            "insights": self._generate_trend_insights(current_data, previous_data, daily_trends)
        }

    def get_inspector_performance_metrics(self, inspector_ids: Optional[List[int]] = None, timeframe: str = "current_month") -> Dict:
        """Get performance metrics for inspectors"""
        
        # Determine date range
        if timeframe == "current_month":
            jalali_today = jalali_calendar.gregorian_to_jalali_str(date.today())
            jalali_year, jalali_month, _ = map(int, jalali_today.split('-'))
            start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
            days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
            end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        else:  # last_30_days
            end_date = date.today()
            start_date = end_date - timedelta(days=30)

        # Get inspectors to analyze
        query = select(Inspector).where(
            Inspector.active == True,
            Inspector.attendance_tracking_enabled == True
        )
        if inspector_ids:
            query = query.where(Inspector.id.in_(inspector_ids))
        
        inspectors = self.db.exec(query).all()
        
        performance_metrics = []
        
        for inspector in inspectors:
            # Get attendance records for this inspector
            records = self.db.exec(
                select(AttendanceRecord).where(
                    AttendanceRecord.inspector_id == inspector.id,
                    AttendanceRecord.date >= start_date,
                    AttendanceRecord.date <= end_date
                )
            ).all()
            
            if not records:
                continue
            
            # Calculate metrics
            working_days = len([r for r in records if r.status == AttendanceStatus.WORKING])
            total_days = len(records)
            attendance_rate = (working_days / total_days) * 100 if total_days > 0 else 0
            
            total_regular_hours = sum(r.regular_hours for r in records)
            total_overtime_hours = sum(r.overtime_hours for r in records)
            avg_daily_hours = total_regular_hours / max(working_days, 1) if working_days > 0 else 0
            
            leave_days = len([r for r in records if r.status == AttendanceStatus.LEAVE])
            absent_days = len([r for r in records if r.status == AttendanceStatus.ABSENT])
            
            performance_metrics.append({
                "inspector_id": inspector.id,
                "inspector_name": f"{inspector.first_name} {inspector.last_name}",
                "employee_id": inspector.employee_id,
                "attendance_rate": round(attendance_rate, 1),
                "working_days": working_days,
                "total_days": total_days,
                "total_regular_hours": total_regular_hours,
                "total_overtime_hours": total_overtime_hours,
                "average_daily_hours": round(avg_daily_hours, 1),
                "leave_days": leave_days,
                "absent_days": absent_days,
                "punctuality_score": self._calculate_punctuality_score(records),
                "consistency_score": self._calculate_consistency_score(records)
            })
        
        # Sort by attendance rate descending
        performance_metrics.sort(key=lambda x: x['attendance_rate'], reverse=True)
        
        # Identify top performers
        top_performers = performance_metrics[:5] if len(performance_metrics) > 5 else performance_metrics
        
        return {
            "timeframe": timeframe,
            "total_inspectors": len(performance_metrics),
            "performance_metrics": performance_metrics,
            "top_performers": top_performers,
            "average_attendance_rate": round(
                statistics.mean([m['attendance_rate'] for m in performance_metrics]) if performance_metrics else 0,
                1
            ),
            "median_attendance_rate": round(
                statistics.median([m['attendance_rate'] for m in performance_metrics]) if performance_metrics else 0,
                1
            )
        }

    def generate_automated_insights(self, timeframe: str = "current_month") -> Dict:
        """Generate AI-like insights and recommendations"""
        
        overview = self.get_attendance_overview(timeframe)
        
        jalali_today = jalali_calendar.gregorian_to_jalali_str(date.today())
        jalali_year, jalali_month, _ = map(int, jalali_today.split('-'))
        trends = self.calculate_attendance_trends(jalali_year, jalali_month)
        performance = self.get_inspector_performance_metrics(timeframe=timeframe)
        
        insights = []
        recommendations = []
        alerts = []
        
        # Attendance rate insights
        attendance_rate = overview.get('attendance_rate', 0)
        if attendance_rate < 80:
            insights.append(f"Overall attendance rate is low at {attendance_rate}%. This may indicate systemic issues.")
            recommendations.append("Review work schedules and identify barriers to attendance.")
            alerts.append({
                "type": "warning",
                "message": f"Low attendance rate: {attendance_rate}%",
                "priority": "high"
            })
        elif attendance_rate > 95:
            insights.append(f"Excellent attendance rate of {attendance_rate}%. Team is highly committed.")
        
        # Overtime insights
        total_overtime = overview.get('total_overtime_hours', 0)
        if total_overtime > 200:  # Example threshold
            insights.append(f"High overtime hours detected: {total_overtime} hours. This may indicate understaffing or workload issues.")
            recommendations.append("Consider workload distribution and staffing levels.")
            alerts.append({
                "type": "warning",
                "message": f"High overtime hours: {total_overtime}",
                "priority": "medium"
            })
        
        # Performance distribution insights
        performance_metrics = performance.get('performance_metrics', [])
        if performance_metrics:
            low_performers = [p for p in performance_metrics if p['attendance_rate'] < 80]
            if len(low_performers) > len(performance_metrics) * 0.2:  # More than 20% are low performers
                insights.append(f"{len(low_performers)} inspectors have attendance rates below 80%.")
                recommendations.append("Implement targeted support for low-performing inspectors.")
                alerts.append({
                    "type": "attention",
                    "message": f"{len(low_performers)} low-performing inspectors identified",
                    "priority": "medium"
                })
        
        # Trend-based insights
        trend_data = trends.get('trends', {})
        attendance_trend = trend_data.get('attendance_rate', {})
        
        if attendance_trend.get('direction') == 'decreasing' and attendance_trend.get('percentage_change', 0) < -5:
            insights.append("Attendance rate is declining compared to last month.")
            recommendations.append("Investigate causes of declining attendance and implement corrective measures.")
            alerts.append({
                "type": "warning",
                "message": "Declining attendance trend detected",
                "priority": "high"
            })
        elif attendance_trend.get('direction') == 'increasing':
            insights.append("Positive trend: Attendance rate is improving compared to last month.")
        
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "insights": insights,
            "recommendations": recommendations,
            "alerts": alerts,
            "summary": {
                "total_insights": len(insights),
                "total_recommendations": len(recommendations),
                "high_priority_alerts": len([a for a in alerts if a['priority'] == 'high']),
                "overall_health_score": self._calculate_overall_health_score(overview, trends, performance)
            }
        }

    def _get_month_attendance_data(self, jalali_year: int, jalali_month: int) -> Dict:
        """Get attendance data for a specific Jalali month"""
        
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        records = self.db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.date >= start_date,
                AttendanceRecord.date <= end_date
            )
        ).all()
        
        working_days = len([r for r in records if r.status == AttendanceStatus.WORKING])
        total_records = len(records)
        attendance_rate = (working_days / max(total_records, 1)) * 100 if total_records > 0 else 0
        
        return {
            "year": jalali_year,
            "month": jalali_month,
            "month_name": jalali_calendar.get_jalali_month_name(jalali_month),
            "total_records": total_records,
            "working_days": working_days,
            "attendance_rate": round(attendance_rate, 1),
            "total_overtime_hours": sum(r.overtime_hours for r in records)
        }

    def _calculate_trend(self, previous_value: float, current_value: float) -> Dict:
        """Calculate trend between two values"""
        if previous_value == 0:
            return {
                "direction": "no_data",
                "percentage_change": 0.0,
                "absolute_change": current_value
            }
        
        percentage_change = ((current_value - previous_value) / previous_value) * 100
        direction = "increasing" if percentage_change > 0 else "decreasing" if percentage_change < 0 else "stable"
        
        return {
            "direction": direction,
            "percentage_change": round(percentage_change, 1),
            "absolute_change": round(current_value - previous_value, 1)
        }

    def _calculate_daily_trends(self, jalali_year: int, jalali_month: int) -> List[Dict]:
        """Calculate daily trends within a month"""
        
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        
        daily_data = []
        
        for day in range(1, days_in_month + 1):
            current_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, day)
            
            # Count attendance by status for this day
            records = self.db.exec(
                select(AttendanceRecord).where(AttendanceRecord.date == current_date)
            ).all()
            
            working_count = len([r for r in records if r.status == AttendanceStatus.WORKING])
            total_count = len(records)
            
            daily_data.append({
                "day": day,
                "date": current_date.isoformat(),
                "jalali_date": jalali_calendar.gregorian_to_jalali_str(current_date),
                "working_count": working_count,
                "total_count": total_count,
                "attendance_rate": round((working_count / max(total_count, 1)) * 100, 1) if total_count > 0 else 0
            })
        
        return daily_data

    def _calculate_punctuality_score(self, records: List[AttendanceRecord]) -> float:
        """Calculate punctuality score based on override patterns"""
        if not records:
            return 0.0
        
        override_count = len([r for r in records if r.is_override])
        total_count = len(records)
        
        # Higher score means better punctuality (fewer overrides)
        punctuality_score = ((total_count - override_count) / total_count) * 100
        return round(punctuality_score, 1)

    def _calculate_consistency_score(self, records: List[AttendanceRecord]) -> float:
        """Calculate consistency score based on attendance patterns"""
        if not records:
            return 0.0
        
        # Calculate based on regular working pattern
        working_days = [r for r in records if r.status == AttendanceStatus.WORKING]
        if not working_days:
            return 0.0
        
        # Check consistency in working hours
        hours_variance = statistics.variance([r.regular_hours for r in working_days]) if len(working_days) > 1 else 0
        
        # Lower variance means higher consistency
        max_variance = 4.0  # Assume max acceptable variance is 4 hours
        consistency_score = max(0, (1 - (hours_variance / max_variance)) * 100)
        
        return round(consistency_score, 1)

    def _generate_trend_insights(self, current_data: Dict, previous_data: Dict, daily_trends: List[Dict]) -> List[str]:
        """Generate insights based on trend analysis"""
        insights = []
        
        # Compare current vs previous month
        current_rate = current_data.get('attendance_rate', 0)
        previous_rate = previous_data.get('attendance_rate', 0)
        
        if current_rate > previous_rate + 5:
            insights.append(f"Attendance improved by {current_rate - previous_rate:.1f}% compared to last month.")
        elif current_rate < previous_rate - 5:
            insights.append(f"Attendance declined by {previous_rate - current_rate:.1f}% compared to last month.")
        
        # Analyze daily patterns
        if daily_trends:
            weekend_performance = [d for d in daily_trends if self._is_weekend_equivalent(d['jalali_date'])]
            weekday_performance = [d for d in daily_trends if not self._is_weekend_equivalent(d['jalali_date'])]
            
            if weekend_performance and weekday_performance:
                avg_weekend = statistics.mean([d['attendance_rate'] for d in weekend_performance])
                avg_weekday = statistics.mean([d['attendance_rate'] for d in weekday_performance])
                
                if avg_weekend < avg_weekday - 10:
                    insights.append("Weekend attendance is significantly lower than weekdays.")
        
        return insights

    def _is_weekend_equivalent(self, jalali_date_str: str) -> bool:
        """Check if a Jalali date is equivalent to weekend (Friday in Iran)"""
        # Convert to Gregorian and check if it's Friday
        year, month, day = map(int, jalali_date_str.split('-'))
        gregorian_date = jalali_calendar.jalali_to_gregorian(year, month, day)
        return gregorian_date.weekday() == 4  # Friday is weekend in Iran

    def _calculate_overall_health_score(self, overview: Dict, trends: Dict, performance: Dict) -> int:
        """Calculate overall attendance health score (0-100)"""
        
        # Base score from attendance rate
        attendance_rate = overview.get('attendance_rate', 0)
        base_score = min(attendance_rate, 100)
        
        # Adjust for trends
        trend_adjustment = 0
        attendance_trend = trends.get('trends', {}).get('attendance_rate', {})
        if attendance_trend.get('direction') == 'increasing':
            trend_adjustment = 5
        elif attendance_trend.get('direction') == 'decreasing':
            trend_adjustment = -5
        
        # Adjust for performance distribution
        performance_adjustment = 0
        avg_performance = performance.get('average_attendance_rate', 0)
        if avg_performance > 90:
            performance_adjustment = 5
        elif avg_performance < 70:
            performance_adjustment = -10
        
        final_score = max(0, min(100, base_score + trend_adjustment + performance_adjustment))
        return int(final_score)