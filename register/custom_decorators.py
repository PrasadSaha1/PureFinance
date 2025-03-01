from django.shortcuts import redirect
from functools import wraps

def redirect_if_authenticated(view_func):
    # this decorator will redirect users to the home page if they enter a sign in page while being logged in 
    @wraps(view_func)  # preserves data of the originial function
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated:  # if logged in, go to home
            return redirect('home')  
        return view_func(request, *args, **kwargs)  # else do nothing
    return _wrapped_view
