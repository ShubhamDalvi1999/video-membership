from pydantic import (
    BaseModel, 
    EmailStr, 
    SecretStr, 
    validator,
    model_validator
)

from . import auth
from .models import User

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: SecretStr
    session_id: str = None

    @model_validator(mode='after')
    def validate_user(self):
        err_msg = "Incorrect credentials, please try again."
        email = self.email
        password = self.password
        
        if email is None or password is None:
            raise ValueError(err_msg)
        
        # Note: This validation will need to be done in the route handler
        # since auth.authenticate is now async and we can't call async methods
        # in a validator. The actual validation will happen in the route.
        
        return self




class UserSignupSchema(BaseModel):
    email: EmailStr
    password: SecretStr
    password_confirm: SecretStr
        
    
    @validator("email")
    def email_available(cls, v, values, **kwargs):
        # Note: This validation will need to be done in the route handler
        # since User operations are now async and we can't call async methods
        # in a validator. The actual validation will happen in the route.
        return v
        
    @validator("password_confirm")
    def passwords_match(cls, v, values, **kwargs):
        password = values.get('password')
        password_confirm = v
        if password != password_confirm:
            raise ValueError("Passwords do not match")
        return v