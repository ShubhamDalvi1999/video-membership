from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .models import User

# Create a security scheme for authentication
security = HTTPBearer(auto_error=False)

def get_authenticated_user(request: Request):
    """
    FastAPI dependency that requires authentication and will show the lock icon in docs.
    This works with the existing request.user system.
    """
    if not request.user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return request.user

# Create a dependency that can be used with Depends()
def require_auth():
    """
    Returns a dependency function that requires authentication.
    This will show the lock icon in FastAPI docs.
    """
    def auth_dependency(request: Request):
        if not request.user.is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return request.user
    
    return auth_dependency
