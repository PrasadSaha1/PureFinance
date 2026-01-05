from django.contrib import admin
from .models import Transaction, TransactionCategory, New_Goal

# Register your models here.
admin.site.register(Transaction)
admin.site.register(TransactionCategory)
admin.site.register(New_Goal)
