"""
Date conversion service for handling dual Gregorian/Jalali date inputs and outputs.
"""
from typing import Optional
import datetime
import re
from app.common.utils import jalali_calendar


class DateConversionError(Exception):
    """Base exception for date conversion errors"""
    pass


class InvalidJalaliDateError(DateConversionError):
    """Raised when Jalali date format is invalid"""
    pass


class DateConversionService:
    """Service for converting between Gregorian and Jalali dates"""
    
    # Regex pattern for Jalali date format (YYYY-MM-DD)
    JALALI_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    
    @staticmethod
    def resolve_date_input(date: Optional[datetime.date], jalali_date: Optional[str]) -> datetime.date:
        """
        Convert input date (either format) to datetime.date.
        
        Args:
            date: Gregorian date object
            jalali_date: Jalali date string in YYYY-MM-DD format
            
        Returns:
            datetime.date: Resolved Gregorian date
            
        Raises:
            ValueError: If neither date is provided or both are provided
            InvalidJalaliDateError: If Jalali date format is invalid
            DateConversionError: If date conversion fails
        """
        if date and jalali_date:
            raise ValueError("Provide either date or jalali_date, not both")
        
        if not date and not jalali_date:
            raise ValueError("Either date or jalali_date must be provided")
        
        if date:
            return date
        
        if jalali_date:
            return DateConversionService._convert_jalali_string_to_date(jalali_date)
    
    @staticmethod
    def _convert_jalali_string_to_date(jalali_date: str) -> datetime.date:
        """
        Convert Jalali date string to datetime.date.
        
        Args:
            jalali_date: Jalali date string in YYYY-MM-DD format
            
        Returns:
            datetime.date: Converted Gregorian date
            
        Raises:
            InvalidJalaliDateError: If format or values are invalid
            DateConversionError: If conversion fails
        """
        if not DateConversionService.JALALI_DATE_PATTERN.match(jalali_date):
            raise InvalidJalaliDateError(
                f"Jalali date must be in YYYY-MM-DD format, got: {jalali_date}"
            )
        
        try:
            jy, jm, jd = map(int, jalali_date.split("-"))
            
            # Validate Jalali date components
            if not (1 <= jm <= 12):
                raise InvalidJalaliDateError(f"Invalid Jalali month: {jm} (must be 1-12)")
            
            if not (1 <= jd <= 31):
                raise InvalidJalaliDateError(f"Invalid Jalali day: {jd} (must be 1-31)")
            
            # Additional validation for month-specific day limits
            if jm <= 6 and jd > 31:
                raise InvalidJalaliDateError(f"Invalid day {jd} for month {jm} (max 31)")
            elif 7 <= jm <= 11 and jd > 30:
                raise InvalidJalaliDateError(f"Invalid day {jd} for month {jm} (max 30)")
            elif jm == 12 and jd > 30:
                # For Esfand, we need to check leap year
                max_days = 30 if jalali_calendar.get_jalali_month_days(jy, jm) == 30 else 29
                if jd > max_days:
                    raise InvalidJalaliDateError(f"Invalid day {jd} for Esfand in year {jy} (max {max_days})")
            
            return jalali_calendar.jalali_to_gregorian(jy, jm, jd)
            
        except InvalidJalaliDateError:
            raise  # Re-raise our custom validation errors
        except ValueError as e:
            raise InvalidJalaliDateError(f"Invalid Jalali date format: {jalali_date}")
        except Exception as e:
            raise DateConversionError(f"Failed to convert Jalali date {jalali_date}: {str(e)}")
    
    @staticmethod
    def add_jalali_date_to_response(obj: dict, date_field: str = "date") -> dict:
        """
        Add jalali_date field to response object.
        
        Args:
            obj: Dictionary object to modify
            date_field: Name of the date field to convert
            
        Returns:
            dict: Modified object with jalali_date field added
        """
        if date_field in obj and obj[date_field]:
            try:
                if isinstance(obj[date_field], datetime.date):
                    obj["jalali_date"] = jalali_calendar.gregorian_to_jalali_str(obj[date_field])
                elif isinstance(obj[date_field], str):
                    # If it's already a string, try to parse it as date first
                    date_obj = datetime.datetime.strptime(obj[date_field], "%Y-%m-%d").date()
                    obj["jalali_date"] = jalali_calendar.gregorian_to_jalali_str(date_obj)
            except Exception:
                # If conversion fails, don't add jalali_date field
                pass
        
        return obj
    
    @staticmethod
    def validate_jalali_date_string(jalali_date: str) -> bool:
        """
        Validate Jalali date string format and values.
        
        Args:
            jalali_date: Jalali date string to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            DateConversionService._convert_jalali_string_to_date(jalali_date)
            return True
        except (InvalidJalaliDateError, DateConversionError):
            return False