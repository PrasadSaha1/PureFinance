from . import views
from django.urls import path

urlpatterns = [
    path("", views.home, name="home"),
    path("settings/", views.settings, name="settings"),
    path("change_username/", views.change_username, name="change_username"),
    path("change_password/", views.change_password, name="change_password"),
    path("add_email/", views.add_email, name="add_email"),
    path("resend_verification_email", views.resend_verification_email, name="resend_verification_email"),
    path("logout_view", views.logout_view, name="logout_view"),
    path("delete_account", views.delete_account, name="delete_account"),
    path("finance_tracker/", views.finance_tracker, name="finance_tracker"),
    path('add_category/', views.add_category, name='add_category'),
    path('delete_category/<int:category_id>/', views.delete_category, name='delete_category'),
    path('rename_category/<int:category_id>/', views.rename_category, name='rename_category'),
    # path('check_category_unique/', views.check_category_unique, name='check_category_unique'),
    path('add_transaction/', views.add_transaction, name='add_transaction'),
    path('delete_transaction/<int:transaction_id>/', views.delete_transaction, name='delete_transaction'),
    path('delete_mass_transactions/', views.delete_mass_transactions, name='delete_mass_transactions'),
    path('update_transaction/<int:transaction_id>/', views.update_transaction, name='update_transaction'),
    path('FAQ', views.FAQ, name='FAQ'),
    path('contact_us', views.contact_us, name='contact_us'),
    path('help', views.help, name='help'),
    path('add_initial_balance/', views.add_initial_balance, name='add_initial_balance'),
]
