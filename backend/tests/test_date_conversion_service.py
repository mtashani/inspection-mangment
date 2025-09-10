"""
Unit tests for DateConversionService
"""
import pytest
import datetime
from app.common.services.date_conversion_service import (
    DateConversionService, 
    DateConversionError, 
    InvalidJalaliDateError
)


class TestDateConversionService:
    """Test cases for DateConversionService"""
    
    def test_resolve_date_input_with_gregorian_date(self):
        """Test resolving input when Gregorian date is provided"""
        test_date = datetime.date(2024, 6, 15)
        result = DateConversionService.resolve_date_input(date=test_date, jalali_date=None)
        assert result == test_date
    
    def test_resolve_date_input_with_jalali_date(self):
        """Test resolving input when Jalali date is provided"""
        jalali_date = "1403-03-26"  # Should convert to 2024-06-15
        result = DateConversionService.resolve_date_input(date=None, jalali_date=jalali_date)
        # We expect this to be converted to Gregorian date
        assert isinstance(result, datetime.date)
    
    def test_resolve_date_input_with_both_dates_raises_error(self):
        """Test that providing both dates raises ValueError"""
        test_date = datetime.date(2024, 6, 15)
        jalali_date = "1403-03-26"
        
        with pytest.raises(ValueError, match="Provide either date or jalali_date, not both"):
            DateConversionService.resolve_date_input(date=test_date, jalali_date=jalali_date)
    
    def test_resolve_date_input_with_no_dates_raises_error(self):
        """Test that providing no dates raises ValueError"""
        with pytest.raises(ValueError, match="Either date or jalali_date must be provided"):
            DateConversionService.resolve_date_input(date=None, jalali_date=None)
    
    def test_validate_jalali_date_string_valid_formats(self):
        """Test validation of valid Jalali date strings"""
        valid_dates = [
            "1403-01-01",  # First day of year
            "1403-06-31",  # Last day of first half
            "1403-07-01",  # First day of second half
            "1403-11-30",  # Last day of 11th month
            "1403-12-29",  # Valid day in Esfand
        ]
        
        for date_str in valid_dates:
            assert DateConversionService.validate_jalali_date_string(date_str), f"Should be valid: {date_str}"
    
    def test_validate_jalali_date_string_invalid_formats(self):
        """Test validation of invalid Jalali date strings"""
        invalid_dates = [
            "1403-1-1",     # Missing leading zeros
            "1403/01/01",   # Wrong separator
            "03-01-01",     # Short year
            "1403-13-01",   # Invalid month
            "1403-01-32",   # Invalid day
            "1403-07-31",   # Invalid day for 7th month (max 30)
            "1403-12-31",   # Invalid day for Esfand (max 29/30)
            "invalid",      # Completely invalid
            "",             # Empty string
        ]
        
        for date_str in invalid_dates:
            assert not DateConversionService.validate_jalali_date_string(date_str), f"Should be invalid: {date_str}"
    
    def test_convert_jalali_string_to_date_invalid_format(self):
        """Test conversion with invalid format raises InvalidJalaliDateError"""
        with pytest.raises(InvalidJalaliDateError, match="must be in YYYY-MM-DD format"):
            DateConversionService._convert_jalali_string_to_date("1403/01/01")
    
    def test_convert_jalali_string_to_date_invalid_month(self):
        """Test conversion with invalid month raises InvalidJalaliDateError"""
        with pytest.raises(InvalidJalaliDateError, match="Invalid Jalali month: 13"):
            DateConversionService._convert_jalali_string_to_date("1403-13-01")
    
    def test_convert_jalali_string_to_date_invalid_day(self):
        """Test conversion with invalid day raises InvalidJalaliDateError"""
        with pytest.raises(InvalidJalaliDateError, match="Invalid Jalali day: 32"):
            DateConversionService._convert_jalali_string_to_date("1403-01-32")
    
    def test_convert_jalali_string_to_date_invalid_day_for_month(self):
        """Test conversion with invalid day for specific month"""
        # 7th month (Mehr) has max 30 days
        with pytest.raises(InvalidJalaliDateError, match="Invalid day 31 for month 7"):
            DateConversionService._convert_jalali_string_to_date("1403-07-31")
    
    def test_add_jalali_date_to_response_with_date_object(self):
        """Test adding Jalali date to response object with datetime.date"""
        test_date = datetime.date(2024, 6, 15)
        obj = {"date": test_date, "other_field": "value"}
        
        result = DateConversionService.add_jalali_date_to_response(obj)
        
        assert "jalali_date" in result
        assert isinstance(result["jalali_date"], str)
        assert result["other_field"] == "value"  # Other fields preserved
    
    def test_add_jalali_date_to_response_with_date_string(self):
        """Test adding Jalali date to response object with date string"""
        obj = {"date": "2024-06-15", "other_field": "value"}
        
        result = DateConversionService.add_jalali_date_to_response(obj)
        
        assert "jalali_date" in result
        assert isinstance(result["jalali_date"], str)
    
    def test_add_jalali_date_to_response_with_no_date_field(self):
        """Test adding Jalali date when no date field exists"""
        obj = {"other_field": "value"}
        
        result = DateConversionService.add_jalali_date_to_response(obj)
        
        assert "jalali_date" not in result
        assert result["other_field"] == "value"
    
    def test_add_jalali_date_to_response_with_none_date(self):
        """Test adding Jalali date when date field is None"""
        obj = {"date": None, "other_field": "value"}
        
        result = DateConversionService.add_jalali_date_to_response(obj)
        
        assert "jalali_date" not in result
        assert result["other_field"] == "value"
    
    def test_add_jalali_date_to_response_with_custom_field_name(self):
        """Test adding Jalali date with custom date field name"""
        test_date = datetime.date(2024, 6, 15)
        obj = {"start_date": test_date, "other_field": "value"}
        
        result = DateConversionService.add_jalali_date_to_response(obj, date_field="start_date")
        
        assert "jalali_date" in result
        assert isinstance(result["jalali_date"], str)
    
    def test_add_jalali_date_to_response_handles_conversion_errors(self):
        """Test that conversion errors are handled gracefully"""
        obj = {"date": "invalid-date", "other_field": "value"}
        
        result = DateConversionService.add_jalali_date_to_response(obj)
        
        # Should not add jalali_date field if conversion fails
        assert "jalali_date" not in result
        assert result["other_field"] == "value"


class TestDateConversionEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_leap_year_esfand_validation(self):
        """Test Esfand day validation for leap and non-leap years"""
        # This would need actual leap year data to test properly
        # For now, we test that the validation logic exists
        
        # Test day 30 in Esfand (should be valid in most years)
        assert DateConversionService.validate_jalali_date_string("1403-12-30")
        
        # Test day 31 in Esfand (should be invalid)
        assert not DateConversionService.validate_jalali_date_string("1403-12-31")
    
    def test_first_and_last_days_of_months(self):
        """Test first and last valid days of each month"""
        # First 6 months have 31 days
        for month in range(1, 7):
            assert DateConversionService.validate_jalali_date_string(f"1403-{month:02d}-01")
            assert DateConversionService.validate_jalali_date_string(f"1403-{month:02d}-31")
        
        # Next 5 months have 30 days
        for month in range(7, 12):
            assert DateConversionService.validate_jalali_date_string(f"1403-{month:02d}-01")
            assert DateConversionService.validate_jalali_date_string(f"1403-{month:02d}-30")
            assert not DateConversionService.validate_jalali_date_string(f"1403-{month:02d}-31")
        
        # Esfand (12th month) has 29 or 30 days
        assert DateConversionService.validate_jalali_date_string("1403-12-01")
        assert DateConversionService.validate_jalali_date_string("1403-12-29")