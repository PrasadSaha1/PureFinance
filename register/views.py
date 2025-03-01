from django.shortcuts import render
from .forms import SignUpForm
from .send_emails import send_verification_email
from django.contrib.auth import get_user_model, login, authenticate
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from .models import UserProfile
from django.http import HttpResponseRedirect
from django.contrib.auth.models import User
from django.core.mail import send_mail
from my_finance.settings import EMAIL_HOST_USER
from .forms import PasswordResetForm, UsernameRetrievalForm, NewPasswordForm, SignInForm
from django.contrib.auth import login, authenticate, get_user_model, update_session_auth_hash
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.sites.shortcuts import get_current_site
from .send_emails import send_custom_email
from .custom_decorators import redirect_if_authenticated 
from main.determine_email_level import determine_email_level
from django.contrib.auth.models import User

@redirect_if_authenticated
def create_account(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)  # make the user. They will not have a verified email at first
            user.save()  
            login(request, user)  # log them in
            user_profile = UserProfile.objects.create(user=user)  # create a user profile. This model will store if they have a verified email and their initial balance
            if form.cleaned_data['email'] != "":  # send the verification email if an email was entered
                send_verification_email(user, request)
            return render(request, 'main/home.html')
    else:
        form = SignUpForm()

    return render(request, 'register/create_account.html', {'form': form})

# note that this doesn't have redirect_if_authenicated
def email_verified(request, uidb64, token):
    # this will verify the email from the user's email 
    try:
        uid = urlsafe_base64_decode(uidb64).decode()  # decode the user id
        user = get_user_model().objects.get(pk=uid)  # retrieve the user
    except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):  # if an error, stop
        user = None
    if user and default_token_generator.check_token(user, token):
        user.profile.email_verified = True  # now, the email is verified
        user.profile.save()
    # to the settings menu as that is where this information is
    return render(request, "main/settings.html", {"email_level": determine_email_level(request.user), "message": "Email verified successfully!"})


@redirect_if_authenticated
def login_view(request):
    if request.method == "POST":
        form = SignInForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')

            # check if the user exists. If not, yield an error
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist: 
                return render(request, 'register/login.html', {'form': form, 'message': "Invalid username, please try again", 'is_error': True})

            # verify the password
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return HttpResponseRedirect('/')  # redirect to homepage
            else:
                # Incorrect password
                return render(request, 'register/login.html', {'form': form, 'message': "Invalid password, please try again", 'is_error': True})

    else:
        form = SignInForm()

    return render(request, 'register/login.html', {'form': form})


@redirect_if_authenticated
def forgot_username(request):
    # send an email with their username(s)
    if request.method == 'POST':
        form = UsernameRetrievalForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            # get all the users with that email
            users = User.objects.filter(email=email)

            if users.exists():
                # format the information
                usernames = [user.username for user in users]
                message = f"The username(s) associated with your email are:\n\n" + "\n".join(usernames)
                subject = "Your Username(s) for PureFinance"
                
                # send the email. We don't need an html template, so we can use send_mail instead of send_custom_mail
                send_mail(
                    subject,
                    message,
                    EMAIL_HOST_USER, 
                    [email],  # the user's email
                )
                message = "Check your email for your username(s)"
                is_error = False
            else:
                message = "No users were found with this email address"
                is_error = True

            # reload with the correct message
            return render(request, "register/forgot_username.html", {'form': form, "message": message, "is_error": is_error})
    else:
        form = UsernameRetrievalForm()

    return render(request, "register/forgot_username.html", {'form': form})

@redirect_if_authenticated
def forgot_password(request):
    # send an email with a link to reset the password. This isn't the acutal password reset
    if request.method == 'POST':
        form = PasswordResetForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            User = get_user_model()
            try:
                user = User.objects.get(username=username)  # get the user, with unique unsernames
                
                # information for the password reset email
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                current_site = get_current_site(request)

                context = {
                    'username': user.username,
                    'domain': current_site.domain,
                    'uid': uid,
                    'token': token,
                }

                # sending the mail with an html template
                send_custom_email(
                    subject='Reset Password for PureFinance',
                    template_name='register/password_reset_email.html',
                    context=context,
                    to_email=user.email
                )
                if user.email == "":  # the email would not send
                    message = "There is no email associated with that account."
                    is_error = True
                else:
                    message = "Check the email registered with this account to reset your password."
                    is_error = False
            except User.DoesNotExist:  # wrong link
                message = "Invalid username. Click on the second link to retrieve it if you forgot it." 
                is_error = True
            
            return render(request, "register/forgot_password.html", {'form': form, "message": message, "is_error": is_error})
    else:
        form = PasswordResetForm()

    return render(request, 'register/forgot_password.html', {'form': form})

@redirect_if_authenticated
def change_password_from_email(request):
    # this is the page where the user would change their password from the forget password email
    uidb64 = request.GET.get('uidb64')  

    # get the information about the form
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = get_user_model().objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
        user = None

    if user:  # if the user was succesful
        if request.method == 'POST':
            form = NewPasswordForm(request.POST)
            if form.is_valid():
                new_password = form.cleaned_data['new_password']
                confirm_password = form.cleaned_data['confirm_password']

                if new_password == confirm_password:  # if the passwords matched
                    user.set_password(new_password)
                    user.save()
                    update_session_auth_hash(request, user)  # keep the user logged in after password change
                    return render(request, "register/login.html", {'form': form, "message": "Password changed successfully!"})
                else:
                    return render(request, "register/change_password_from_email.html", {'form': form, "message": "The passwords did not match, please try again.", "is_error": True})
        else:
            form = NewPasswordForm()

        return render(request, 'register/change_password_from_email.html', {'form': form})

   
