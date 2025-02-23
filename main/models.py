from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class TransactionCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transaction_category')
    category_name = models.CharField(max_length=25)  # max length before it starts to distort the interface
    transaction_type = models.CharField(max_length=20)  # either income_source or expense

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transaction')
    transaction_category = models.ForeignKey(TransactionCategory, on_delete=models.SET_NULL, related_name='category', null=True, blank=True)
    transaction_type = models.CharField(max_length=20)  # either income_source or expense
    transaction_name = models.CharField(max_length=50)
    transaction_date = models.DateField()
    transaction_amount = models.FloatField()

