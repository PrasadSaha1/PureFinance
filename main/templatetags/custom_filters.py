from django import template

register = template.Library()

# we need custom filters in some cases, the behavior wouldn't work with js functions

@register.filter
def format_email(email, email_level):
    if not email:  # if the user has no email
        return "None"

    # split the actual address and domain
    local, domain = email.split('@')
    
    # keep the first three and hide the rest
    censored_local = local[:3] + '*****'
    
    return f"{censored_local}@{domain} ({email_level})"

@register.filter
def format_money(value):
    # shows 2 decimal places
    value = float(value)
    return "{:,.2f}".format(value)
