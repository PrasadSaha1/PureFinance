from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

class SignUpForm(UserCreationForm):
    # this is the form to make an account

    # customize the information
    username = forms.CharField(
        label="Username",
        help_text="Must be unique with at least 8 characters and no spaces", 
        widget=forms.TextInput(attrs={'placeholder': 'Choose a username', 'class': 'form-control mb-3'}), 
    )

    email = forms.EmailField(
        required=False,
        label="Email (optional)", 
        help_text="Recommended to secure your account. If entered, you'll receive a verification email.",
        widget=forms.EmailInput(attrs={'placeholder': 'Enter your email address', 'class': 'form-control mb-3'}), 
    )

    password1 = forms.CharField(
        label="Password",  
        help_text="Your password must contain at least 8 characters and cannot be entirely numeric or commonly used.",
        widget=forms.PasswordInput(attrs={'placeholder': 'Enter your password', 'class': 'form-control mb-3'}), 
    )
    
    password2 = forms.CharField(
        label="Confirm Password", 
        help_text="Enter the same password as above for verification.",
        widget=forms.PasswordInput(attrs={'placeholder': 'Confirm your password', 'class': 'form-control mb-3'}), 
    )

    class Meta:  # explains how the form is related to the user 
        model = User
        fields = ('username', 'email', 'password1', 'password2')

class SignInForm(forms.Form):
    # login form

    username = forms.CharField(
        label="Username",
        widget=forms.TextInput(attrs={'placeholder': 'Enter your username', 'class': 'form-control mb-3'}), 
    )

    password = forms.CharField(
        label="Password",  
        widget=forms.PasswordInput(attrs={'placeholder': 'Enter your password', 'class': 'form-control mb-3'}), 
    )

class PasswordResetForm(forms.Form):
    # from the forgot password screen
    username = forms.CharField(label="Username", required=True)

class UsernameRetrievalForm(forms.Form):
    # from the forgot username screen
    email = forms.EmailField(label="Email", required=True)
    
class NewPasswordForm(forms.Form):
    # from the reset password screen from the user's email

    new_password = forms.CharField(
        widget=forms.PasswordInput(),
        label="New Password",
        required=True,
        help_text="Your password must contain at least 8 characters and cannot be entirely numeric or commonly used."
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(),
        label="Confirm Password",
        required=True
    )

    def clean_new_password(self):
        # ensures that the password meet's Django's guidelines
        new_password = self.cleaned_data.get('new_password')
        try:
            validate_password(new_password)
        except ValidationError as e:
            raise forms.ValidationError(e.messages)
        return new_password