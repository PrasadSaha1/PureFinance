# models, which is how django stores data

from django.db import models
from django.contrib.auth.models import User

class TransactionCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transaction_category')
    category_name = models.CharField(max_length=25)  # max length before it starts to distort the interface
    transaction_type = models.CharField(max_length=20)  # either income_source or expense

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transaction')

    # if the category is deleted, the category will be NULL, which will be shown as No Category
    transaction_category = models.ForeignKey(TransactionCategory, on_delete=models.SET_NULL, related_name='category', null=True, blank=True)
    transaction_type = models.CharField(max_length=20)  # either income_source or expense
    transaction_name = models.CharField(max_length=50)
    transaction_date = models.DateField()
    transaction_amount = models.FloatField()

