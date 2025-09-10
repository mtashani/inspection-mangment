# NEW: Jalali calendar utilities
import datetime
import os
import json
try:
    import jdatetime
except ImportError:
    jdatetime = None

# Convert Gregorian date to Jalali (year, month, day)
def gregorian_to_jalali(gregorian_date: datetime.date):
    if jdatetime:
        j = jdatetime.date.fromgregorian(date=gregorian_date)
        return j.year, j.month, j.day
    else:
        # TODO: Implement fallback conversion
        raise NotImplementedError("jdatetime not installed")

# Convert Jalali (year, month, day) to Gregorian date
def jalali_to_gregorian(jy: int, jm: int, jd: int) -> datetime.date:
    if jdatetime:
        g = jdatetime.date(jy, jm, jd).togregorian()
        return g
    else:
        # TODO: Implement fallback conversion
        raise NotImplementedError("jdatetime not installed")

# Get number of days in a Jalali month
def get_jalali_month_days(year: int, month: int) -> int:
    if month <= 6:
        return 31
    elif month <= 11:
        return 30
    else:
        # اسفند: 29 یا 30 روز بسته به کبیسه بودن
        if jdatetime:
            return 30 if jdatetime.date(year, 12, 1).isleap() else 29
        else:
            return 29  # TODO: Improve leap year detection

# Get Jalali month name
def get_jalali_month_name(month: int) -> str:
    names = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ]
    return names[month - 1] if 1 <= month <= 12 else ""

# Get Jalali weekday name
def get_jalali_weekday_name(weekday: int) -> str:
    names = ["دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه", "یکشنبه"]
    return names[weekday % 7]

# Convert Gregorian date to Jalali string (YYYY-MM-DD)
def gregorian_to_jalali_str(gregorian_date: datetime.date) -> str:
    y, m, d = gregorian_to_jalali(gregorian_date)
    return f"{y}-{m:02d}-{d:02d}"

_holiday_cache = None

def is_iran_holiday(jalali_date_str: str) -> bool:
    """Check if a Jalali date (YYYY-MM-DD) is a holiday in Iran (offline, from JSON)."""
    global _holiday_cache
    if _holiday_cache is None:
        holidays_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../holiday.json'))
        with open(holidays_path, encoding='utf-8') as f:
            _holiday_cache = set(item['date'] for item in json.load(f))
    return jalali_date_str in _holiday_cache 