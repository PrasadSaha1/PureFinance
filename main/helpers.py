from decimal import Decimal

def determine_email_level(user):
    email_level = "None" 

    if user.email and not user.profile.email_verified:  
        email_level = "Unverified"
    elif user.email and user.profile.email_verified:
        email_level = "Verified"
    return email_level

def format_money(amount):
    return Decimal(amount).quantize(Decimal('0.00'))