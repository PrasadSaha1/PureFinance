# forms for submitting information such as changing a username, contacting the developer, etc

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator

# note - the clean functions within the forms are mainly for input validation

class ChangeUsernameForm(forms.Form):
    # for change_username, in settings

    # make the information custom
    new_username = forms.CharField(
        label="New Username",
        max_length=150,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter new username'}),
        help_text="Must be unique with at least 8 characters and no spaces"
    )
    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Enter your password'}),
        help_text="Enter your password for confirmation."
    )

    # the clean functions will automatically be run everytime the form is submitted
    def clean_new_username(self):
        # parse the username and ensure that it's accurate
        new_username = self.cleaned_data['new_username']
        
        # if an error, it will not go through

        # See if it already exists
        if User.objects.filter(username=new_username).exists():
            raise forms.ValidationError("This username is already taken.")
        
        # Make sure that the username isn't too long or short
        if len(new_username) < 8:
            raise forms.ValidationError("Username must be at least 8 characters long.")
        if len(new_username) > 150:
            raise forms.ValidationError("Username cannot exceed 150 characters.")
        
        return new_username

    def clean_password(self):
        # parse the password
        password = self.cleaned_data['password']
        return password
    
class ChangePasswordForm(forms.Form):
    # changing the password from the settings

    current_password = forms.CharField(
        label="Current Password",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Enter current password'}),
        help_text="Enter your current password to authenticate."
    )
    new_password = forms.CharField(
        label="New Password",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Enter new password'}),
        help_text="Your new password must be at least 8 characters and not be commonly-used."
    )
    confirm_new_password = forms.CharField(
        label="Confirm New Password",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Confirm new password'}),
        help_text="Re-enter your new password."
    )

    def clean_new_password(self):
        # parse the password
        password = self.cleaned_data['new_password']

        # if an error, show it and don't continue
        try:
            password_validation.validate_password(password)
        except ValidationError as e:
            raise forms.ValidationError(e.messages)

        return password

class AddEmailForm(forms.Form):
    email = forms.EmailField(
        label="Email Address",
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Enter your email'}),
        help_text="Enter a valid email address."
    )

    def clean_email(self):
        email = self.cleaned_data['email']  # parse the email
        try:  # ensures that the email is valid
            EmailValidator()(email)
        except ValidationError:
            raise forms.ValidationError("Enter a valid email address.")
        
        return email


class ContactForm(forms.Form):
    name = forms.CharField(max_length=100, required=True)
    email = forms.EmailField(required=True)  # input validation is handled automatically
    subject = forms.CharField(required=False)
    message = forms.CharField(widget=forms.Textarea, required=True)