from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import send_mail
from my_finance.settings import EMAIL_HOST_USER


def send_custom_email(subject: str, template_name: str, context: dict, to_email: str):
    # to_email is the user's email

    # allows for both HTML and plain text
    html_message = render_to_string(template_name, context)
    plain_message = strip_tags(html_message)
    from_email = EMAIL_HOST_USER  # from the settings

    send_mail(subject, plain_message, from_email, [to_email], html_message=html_message)

def send_verification_email(user, request):
    # the verification email also includes security information

    token = default_token_generator.make_token(user)  # ensures uniqueness and security
    uid = urlsafe_base64_encode(force_bytes(user.pk))  # get a unique id in base 64
    current_site = get_current_site(request)  # get the site domain

    context = {
        'user': user,
        'domain': current_site.domain,
        'uid': uid,
        'token': token,
    }

    send_custom_email(
        subject='Verify your Email for PureFinance',
        template_name='register/verification_email.html',
        context=context,
        to_email=user.email
    )

