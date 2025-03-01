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
