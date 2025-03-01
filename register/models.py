from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')  # make the profile
    email_verified = models.BooleanField(default=False)

    # these two variables are a Work in Progress - they aren't acutally used anywhere
    # they would these determine whether or not modals should show when deleting stuff
    # they are defined here as each user would have these attributes
    show_confirmation_delete_category = models.BooleanField(default=True)
    show_confirmation_delete_transaction = models.BooleanField(default=True)

    initial_balance = models.FloatField(default=0)  # defined here as every user will have it
