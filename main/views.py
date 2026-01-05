# this file manages all the views for the "main" app

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import ChangeUsernameForm, ChangePasswordForm, AddEmailForm, ContactForm
from django.contrib.auth import authenticate, update_session_auth_hash, logout
from register.send_emails import send_verification_email
from .determine_email_level import determine_email_level
from .models import TransactionCategory, Transaction
from .models import New_Goal as Goal
from django.http import JsonResponse
from register.send_emails import send_custom_email
from my_finance.settings import EMAIL_HOST_USER
import json

def home(request):
    # home page, what the user sees when they first sign on
    # is_logged_in is needed to show what info to display (createaccount/login or link to finance tracker)
    return render(request, "main/home.html", {'is_logged_in': request.user.is_authenticated})

# this decorator will redirect users to the home page if they are not logged in, so they can't access most features without an account
@login_required(login_url='/')
def settings(request):
    # settings menu. Information shown is based on the email level
    return render(request, "main/settings.html", {"email_level": determine_email_level(request.user)})

@login_required(login_url='/')
def change_username(request):
    # allows the user to change their username, found in the settings menu
    if request.method == 'POST':  # if the form was submitted
        form = ChangeUsernameForm(request.POST)  # has the username and password
        if form.is_valid():
            new_username = form.cleaned_data['new_username']
            password = form.cleaned_data['password']  # they enter the password to verify their idenity
            
            # ensure that the password is accurate by seeing if the user exists
            user = authenticate(username=request.user.username, password=password)
            if user is not None:
                request.user.username = new_username  # update the name
                request.user.save()
                # render the settings menu with a message
                return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Username changed successfully!"})
            else:  # they will get an error on the screen
                form.add_error('password', 'Incorrect password')
    else:  # generate the form by default, if not a POST request
        form = ChangeUsernameForm()

    # the form must be passed into the HTML template
    return render(request, 'main/change_username.html', {'form': form})

@login_required(login_url='/')
def change_password(request):
    # allows users to change their password
    if request.method == 'POST':  # if the form is submitted
        form = ChangePasswordForm(request.POST)
        if form.is_valid():
            # get all the information
            current_password = form.cleaned_data['current_password']
            new_password = form.cleaned_data['new_password']
            confirm_new_password = form.cleaned_data["confirm_new_password"]

            
            user = authenticate(username=request.user.username, password=current_password)
            if user and new_password == current_password:  # if the password is valid and the new passwords match
                user.set_password(new_password)  # Update the password
                user.save()

                # Reauthenticate the user to update session authentication, needed for security reasons
                update_session_auth_hash(request, user)

                # success message
                return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Password changed successfully!"})
            else:
                if user is None:  # if the password is wrong
                    form.add_error('current_password', 'Incorrect current password')
                if new_password != confirm_new_password:  # if the passwords don't match
                    form.add_error('confirm_new_password', 'Passwords do not match!')            
    else:  # default form
        form = ChangePasswordForm()

    return render(request, 'main/change_password.html', {'form': form})

@login_required(login_url='/')
def add_email(request):    
    if request.method == "POST":
        form = AddEmailForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']  # get the email and save it. It's unverified for now
            request.user.email = email
            request.user.save()
            send_verification_email(request.user, request)  # send the verification email 
            # the email level will change
            return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Email added succesfully. Please verify it by checking your inbox."})
    else:
        form = AddEmailForm()    

    return render(request, 'main/add_email.html', {"form": form})

@login_required(login_url='/')
def resend_verification_email(request):
    # resends the verifcation email if the user clicks that button in the settings
    send_verification_email(request.user, request)
    return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Check your inbox for a link to verify your email"})
    

@login_required(login_url='/')
def logout_view(request):
    # logs the user out after a confirmation modal with the settings
    logout(request)
    return redirect("home")

@login_required(login_url='/')
def delete_account(request):
    # deletes the user after a confirmation modal
    request.user.delete()
    return redirect("home")

@login_required(login_url='/')
def finance_tracker(request):
    # the finance_tracker page, which is the main one

    # get the income categories, expense categories, and initial balance
    income_categories = TransactionCategory.objects.filter(user=request.user, transaction_type='income_source')
    expense_categories = TransactionCategory.objects.filter(user=request.user, transaction_type='expense')
    initial_balance = request.user.profile.initial_balance 

    # when making the dropdown for adding transactions, we need a list with the names of the categories 
    # normally, it would be a list of modal instancs
    income_category_names = [category.category_name for category in income_categories]
    expense_category_names = [category.category_name for category in expense_categories]

    # get the transactions to display them
    all_transactions = Transaction.objects.filter(user=request.user)

    # this is all the intial information. It is needed at first, but later, the JS will update is dynamically
    return render(request, 'main/finance_tracker.html', {"income_categories": income_categories, "expense_categories": expense_categories, "all_transactions": all_transactions,
                                                         "income_category_names": income_category_names, "expense_category_names": expense_category_names, "initial_balance": initial_balance})

@login_required(login_url='/')
def add_category(request):
    # adds a category. This is dynamic and would be down with an AJAX request
    if request.method == 'POST':
        category_name = request.POST.get("category_name")  # get the info from the html
        transaction_type = request.POST.get("transaction_type")
        
        # make the category
        new_category = TransactionCategory.objects.create(user=request.user, category_name=category_name, transaction_type=transaction_type)
        
        # send the information back to JS after the ajax request. This info, mainly the ID, is needed to make the actual category
        return JsonResponse({"id": new_category.id, "category_name": new_category.category_name, "transaction_type": new_category.transaction_type})


@login_required(login_url='/')
def delete_category(request, category_id: int):
    # deletes a category dynamically with an AJAX request
    if request.method == 'POST':
        category = TransactionCategory.objects.get(id=category_id)  # based on the given ID
        category.delete()
        return JsonResponse({"success": True})  # a default message is required

@login_required(login_url='/')
def rename_category(request, category_id):
    # rename the category dynamically with AJAX
    if request.method == "POST":
        data = json.loads(request.body)  # parse the JSON data
        new_category_name = data.get('category_name')

        # get the category by ID and update it
        category = TransactionCategory.objects.get(id=category_id)
        category.category_name = new_category_name
        category.save()

        return JsonResponse({'success': True})
  
@login_required(login_url="/")
def add_transaction(request):
    """Adding a transaction dynamically with an AJAX""" 
    if request.method == 'POST':
        transaction_type = request.POST.get('transaction_type')  # income_source or expense
        transaction_name = request.POST.get('transaction_name')
        transaction_date = request.POST.get('transaction_date')
        transaction_amount = request.POST.get('transaction_amount')

        # Fetch different data based on the transaction type
        if transaction_type == 'income_source':
            category_name = request.POST.get('income_category')  # The name from the options
            # Get the category from the name. 
            # Category names must be unique within their transaction type, so there shouldn't be issues with the name
            category = TransactionCategory.objects.get(user=request.user, category_name=category_name, transaction_type="income_source")
        elif transaction_type == 'expense': 
            category_name = request.POST.get('expense_category')
            category = TransactionCategory.objects.get(user=request.user, category_name=category_name, transaction_type="expense")

        # make the transaction
        transaction = Transaction(
            user=request.user,
            transaction_type=transaction_type,
            transaction_name=transaction_name,
            transaction_date=transaction_date,
            transaction_amount=transaction_amount,
            transaction_category=category,
        )
        transaction.save()

        # return the ID for JS
        return JsonResponse({"transactionId": transaction.id})

@login_required(login_url="/")
def delete_transaction(request, transaction_id):
    # deletes a transaction dynamically
    if request.method == 'DELETE':
        transaction = get_object_or_404(Transaction, id=transaction_id)
        transaction.delete()
        return JsonResponse({'success': True})

@login_required(login_url="/")
def update_transaction(request, transaction_id):
    # update a transaction dynamically
    if request.method == 'POST':
        data = json.loads(request.body)  # parse the JSON data
        transaction = Transaction.objects.get(id=transaction_id)

        if data.get('category') != "No Category":  # if it's no category, don't change the category (it remains to not have a category)
            category = TransactionCategory.objects.get(user=request.user, category_name=data.get('category'), transaction_type=transaction.transaction_type)
            transaction.transaction_category = category
        transaction.transaction_date = data.get('date')
        transaction.transaction_name = data.get('name')
        transaction.transaction_amount = data.get('amount')

        transaction.save()  # save the changes
        return JsonResponse({'success': True})

# notice that this has no login required decorater - you don't need to be signed in
def FAQ(request):
    return render(request, "main/FAQ.html")

# still no login decorater - it comes from the FAQ menu, which also doesn't need it
def contact_us(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']  # get the info
            email = form.cleaned_data['email']
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']
            
            # context for the email
            context = {'name': name,'email': email, 'message': message}
            
            template_name = 'main/contact_us_email.html'  # the html email

            # sending an email that uses an HTML template rather than just text. The host user is from the settings
            send_custom_email(subject, template_name, context, EMAIL_HOST_USER)

            # send a success message
            return render(request, 'main/contact_us.html', {'form': form, "message": "Message sent successfully!"})
    else:
        form = ContactForm()

    return render(request, 'main/contact_us.html', {'form': form})

def help(request):
    return render(request, "main/help.html")

@login_required
def add_initial_balance(request):
    # edits the inital balance at the top of the finance tracker
    if request.method == "POST":
        data = json.loads(request.body)
        amount = float(data.get("amount", 0))  # default to 0 if needed

        user_profile = request.user.profile  # the intial balance is saved in the user profile as each user will have it
        user_profile.initial_balance = amount  # update and save it
        user_profile.save()

        return JsonResponse({"success": True})
    
@login_required(login_url="/")
def goal_tracker(request):
    categories = TransactionCategory.objects.filter(user=request.user)
    income_categories = categories.filter(transaction_type='income_source')
    expense_categories = categories.filter(transaction_type='expense')

    goals = Goal.objects.filter(user=request.user) 

    return render(request, "main/goal_tracker.html", {"income_categories": income_categories, "expense_categories": expense_categories, "goals": goals})


@login_required(login_url="/")
def add_goal(request):
    if request.method == 'POST':
        data = json.loads(request.body)  

        goal_name = data.get('name')
        goal_amount = data.get('amount')
        goal_start_date = data.get('start_date')
        goal_end_date = data.get('end_date')
        goal_income_categories = data.get('income_categories')
        goal_expense_categories = data.get('expense_categories')
        goal_type = data.get('type')
        goal_description = data.get('description')


        new_goal = Goal.objects.create(
            user=request.user,
            goal_name=goal_name,
            goal_amount=goal_amount,
            goal_start_date=goal_start_date,
            goal_end_date=goal_end_date,
            goal_income_categories=goal_income_categories,
            goal_expense_categories=goal_expense_categories,
            goal_type=goal_type,
            goal_description=goal_description,
        )

        return JsonResponse({"goalId": new_goal.id})



