def determine_email_level(user):
    # determines the email level. This will be displayed on the settings page and used to determine which buttons to display
    email_level = "None" 

    if user.email and not user.profile.email_verified:  
        email_level = "Unverified"
    elif user.email and user.profile.email_verified:
        email_level = "Verified"
    return email_level