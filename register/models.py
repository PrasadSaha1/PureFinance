from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    email_verified = models.BooleanField(default=False)

    # these determine whether or not modals should show when deleting stuff
    # they are defined here as each user would have these attributes
    show_confirmation_delete_category = models.BooleanField(default=True)
    show_confirmation_delete_transaction = models.BooleanField(default=True)
