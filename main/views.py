from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import ChangeUsernameForm, ChangePasswordForm, AddEmailForm, ContactForm
from django.contrib.auth import authenticate, update_session_auth_hash, logout
from register.send_emails import send_verification_email
from .helpers import determine_email_level
from .models import TransactionCategory, Transaction
from django.http import JsonResponse
from register.send_emails import send_custom_email
from my_finance.settings import EMAIL_HOST_USER
import json

def home(request):
    return render(request, "main/home.html", {'is_logged_in': request.user.is_authenticated, 'user': request.user if request.user.is_authenticated else None})

@login_required(login_url='/')
def settings(request):
    return render(request, "main/settings.html", {"email_level": determine_email_level(request.user)})

@login_required(login_url='/')
def change_username(request):
    if request.method == 'POST':
        form = ChangeUsernameForm(request.POST)
        if form.is_valid():
            new_username = form.cleaned_data['new_username']
            password = form.cleaned_data['password']
            
            # Authenticate the user with the provided password
            user = authenticate(username=request.user.username, password=password)
            if user is not None:
                # If password is correct, update the username
                request.user.username = new_username
                request.user.save()
                return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Username changed successfully!"})
            else:
                form.add_error('password', 'Incorrect password')
    else:
        form = ChangeUsernameForm()

    return render(request, 'main/change_username.html', {'form': form})

@login_required(login_url='/')
def change_password(request):
    if request.method == 'POST':
        form = ChangePasswordForm(request.POST)
        if form.is_valid():
            current_password = form.cleaned_data['current_password']
            new_password = form.cleaned_data['new_password']
            confirm_new_password = form.cleaned_data["confirm_new_password"]
            if new_password != confirm_new_password:
                return render(request, 'main/change_password.html', {'form': form, "success_message": "Passwords do not match", "is_error": True})
            
            # Authenticate user with current password
            user = authenticate(username=request.user.username, password=current_password)
            if user is not None:
                # Update the user's password
                user.set_password(new_password)
                user.save()

                # Re-authenticate the user to update session authentication
                update_session_auth_hash(request, user)

                return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Password changed successfully!"})
            else:
                form.add_error('current_password', 'Incorrect current password')
    else:
        form = ChangePasswordForm()

    return render(request, 'main/change_password.html', {'form': form})

@login_required(login_url='/')
def add_email(request):
    form = AddEmailForm(request.POST or None)
    
    if form.is_valid():
        email = form.cleaned_data['email']
        request.user.email = email
        request.user.save()
        send_verification_email(request.user, request)
        return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Email added succesfully. Please verify it by checking your inbox."})
    
    return render(request, 'main/add_email.html', {"form": form})

@login_required(login_url='/')
def resend_verification_email(request):
    send_verification_email(request.user, request)
    return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Check your inbox for a link to verify your email"})
    

@login_required(login_url='/')
def logout_view(request):
    logout(request)
    return redirect("home")

@login_required(login_url='/')
def delete_account(request):
    request.user.delete()
    return redirect("home")

@login_required(login_url='/')
def finance_tracker(request):
    income_categories = TransactionCategory.objects.filter(user=request.user, transaction_type='income_source')
    expense_categories = TransactionCategory.objects.filter(user=request.user, transaction_type='expense')
    initial_balance = request.user.profile.initial_balance 

    income_category_names = [category.category_name for category in income_categories]
    expense_category_names = [category.category_name for category in expense_categories]

    all_transactions = Transaction.objects.filter(user=request.user)

    return render(request, 'main/finance_tracker.html', {"income_categories": income_categories, "expense_categories": expense_categories, "all_transactions": all_transactions,
                                                         "income_category_names": income_category_names, "expense_category_names": expense_category_names, "initial_balance": initial_balance})

@login_required(login_url='/')
def add_category(request):
    """Handle adding multiple categories dynamically."""
    if request.method == 'POST':
        category_name = request.POST.get("category_name")
        transaction_type = request.POST.get("transaction_type")
        
        # Create the new category
        
        new_category = TransactionCategory.objects.create(
            user=request.user,
            category_name=category_name,
            transaction_type=transaction_type
        )
        
        # Respond with new category details
        return JsonResponse({
            "id": new_category.id,
            "category_name": new_category.category_name,
            "transaction_type": new_category.transaction_type,
        })

    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required(login_url='/')
def delete_category(request, category_id):
    if request.method == 'POST':
        category = TransactionCategory.objects.get(id=category_id)
        category.delete()
        return JsonResponse({"success": True})

def rename_category(request, category_id):
    if request.method == "POST":
        data = json.loads(request.body)  # Parse the incoming JSON data
        new_category_name = data.get('category_name')

        # Find the category by ID and update its name
        category = TransactionCategory.objects.get(id=category_id)
        category.category_name = new_category_name
        category.save()

        # Respond with a success message
        return JsonResponse({'success': True})
  
@login_required(login_url="/")
def add_transaction(request):
    if request.method == 'POST':
        transaction_type = request.POST.get('transaction_type')
        transaction_name = request.POST.get('transaction_name')
        transaction_date = request.POST.get('transaction_date')
        transaction_amount = request.POST.get('transaction_amount')

        if transaction_type == 'income_source':
            category_name = request.POST.get('income_category')
            category = TransactionCategory.objects.get(user=request.user, category_name=category_name, transaction_type="income_source")
        elif transaction_type == 'expense':
            category_name = request.POST.get('expense_category')
            category = TransactionCategory.objects.get(user=request.user, category_name=category_name, transaction_type="expense")

        # Create the transaction
        transaction = Transaction(
            user=request.user,
            transaction_type=transaction_type,
            transaction_name=transaction_name,
            transaction_date=transaction_date,
            transaction_amount=transaction_amount,
            transaction_category=category,
        )
        transaction.save()

        # Return a success response as JSON
        return JsonResponse({
            "transactionId": transaction.id
        })
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

@login_required(login_url="/")
def delete_transaction(request, transaction_id):
    if request.method == 'DELETE':
        transaction = get_object_or_404(Transaction, id=transaction_id)
        transaction.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required(login_url="/")
def delete_mass_transactions(request):
    if request.method == 'POST':
        # Get the list of transaction IDs from the POST data
        data = json.loads(request.body)
        transaction_ids = data.get('transaction_ids', [])
        transactions = Transaction.objects.filter(id__in=transaction_ids)
        deleted_count, _ = transactions.delete()

        return JsonResponse({'success': True, 'message': f'{deleted_count} transactions deleted successfully'})
        
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


def update_transaction(request, transaction_id):
    if request.method == 'POST':
        data = json.loads(request.body)
        transaction = Transaction.objects.get(id=transaction_id)

        if data.get('category') != "No Category":
            category = TransactionCategory.objects.get(user=request.user, category_name=data.get('category'), transaction_type=transaction.transaction_type)
            transaction.transaction_category = category
        transaction.transaction_date = data.get('date')
        transaction.transaction_name = data.get('name')
        transaction.transaction_amount = data.get('amount')

        transaction.save()
        return JsonResponse({'success': True})

def FAQ(request):
    return render(request, "main/FAQ.html")

@login_required
def contact_us(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']
            
            # Prepare the context for the email template
            context = {
                'name': name,
                'email': email,
                'message': message,
            }
            
            template_name = 'main/contact_us_email.html'  # Your email template

            # Send the email using your custom function
            send_custom_email(subject, template_name, context, EMAIL_HOST_USER)

            # Redirect to a thank you page
            return render(request, 'main/contact_us.html', {'form': form, "message": "Message sent successfully!"})
            # return render(request, 'contact/thank_you.html') 
    else:
        form = ContactForm()

    return render(request, 'main/contact_us.html', {'form': form})

def help(request):
    return render(request, "main/help.html")

@login_required
def add_initial_balance(request):
    if request.method == "POST":
        data = json.loads(request.body)
        amount = float(data.get("amount", 0))

        user_profile = request.user.profile  # Access the UserProfile
        user_profile.initial_balance = amount
        user_profile.save()

        return JsonResponse({"success": True})
    
