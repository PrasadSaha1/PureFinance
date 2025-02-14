from django.contrib import admin
from .models import Transaction, TransactionCategory

# Register your models here.
admin.site.register(Transaction)
admin.site.register(TransactionCategory)
