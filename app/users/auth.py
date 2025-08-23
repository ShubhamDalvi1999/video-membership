import datetime
from jose import jwt, ExpiredSignatureError
from app import config

from .models import User

settings = config.get_settings()

async def authenticate(email, password):
    # step 1
    try:
        user_obj = await User.by_email(email)
    except Exception as e:
        user_obj = None
    if user_obj is None or not user_obj.verify_password(password):
        return None
    return user_obj

def login(user_obj, expires=settings.session_duration):
    # step 2
    raw_data = {
        "user_id": f"{user_obj.user_id}",
        "role": "admin",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires)
    }
    return jwt.encode(raw_data, settings.secret_key, algorithm=settings.jwt_algorithm)


def verify_user_id(token):
    # step 3
    data = {}
    try:
        data = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except ExpiredSignatureError as e:
        print(e, "log out user")
    except:
        pass
    if 'user_id' not in data:
        return None
    # if 'user_id' not in data.keys():
    #     return None
    return data