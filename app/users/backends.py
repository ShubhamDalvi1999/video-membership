from starlette.authentication import (
    AuthenticationBackend,
    SimpleUser,
    UnauthenticatedUser,
    AuthCredentials
)

from . import auth
from .models import User

class AuthenticatedUser:
    def __init__(self, user_id: str, email: str, username: str):
        self.user_id = user_id
        self.email = email
        self.username = username
        self.is_authenticated = True

class JWTCookieBackend(AuthenticationBackend):
    async def authenticate(self, request):
        session_id = request.cookies.get("session_id")
        user_data = auth.verify_user_id(session_id)
        if user_data is None:
            # anon user
            roles = ["anon"]
            return AuthCredentials(roles), UnauthenticatedUser()
        
        user_id = user_data.get("user_id")
        if not user_id:
            roles = ["anon"]
            return AuthCredentials(roles), UnauthenticatedUser()
        
        # Get full user data from database
        try:
            user_obj = await User.by_user_id(user_id)
            if user_obj:
                roles = ['authenticated']
                return AuthCredentials(roles), AuthenticatedUser(
                    user_id=user_obj.user_id,
                    email=user_obj.email,
                    username=user_obj.username
                )
        except Exception as e:
            print(f"Error fetching user data: {e}")
        
        # Fallback to anonymous user
        roles = ["anon"]
        return AuthCredentials(roles), UnauthenticatedUser()