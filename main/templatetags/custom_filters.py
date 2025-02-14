from django import template
from datetime import datetime

register = template.Library()

@register.filter
def format_email(email, email_level):
    if not email:
        return "None"

    # Split the email into local part and domain
    local, domain = email.split('@')
    
    # Keep the first 3 characters of the local part and mask the rest
    censored_local = local[:3] + '*****'
    
    # Return the censored email
    return f"{censored_local}@{domain} ({email_level})"

@register.filter
def format_money(value):
    value = float(value)
    return "{:,.2f}".format(value)

@register.filter
def format_date(value):
    date_obj = datetime.strptime(str(value), "%Y-%m-%d")
    # Format the date with custom logic for the day suffix
    day = date_obj.day
    suffix = "th" if 11 <= day <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    formatted_date = date_obj.strftime(f"%B {day}{suffix}, %Y")
    return formatted_date