from app import config

from fastapi import Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from starlette.exceptions import HTTPException as StarletteHTTPException

settings = config.get_settings()
templates = Jinja2Templates(directory=str(settings.templates_dir))



def is_htmx(request:Request):
    return request.headers.get("hx-request") == 'true'


async def get_object_or_404(KlassName, **kwargs):
    """Get object or raise 404 - updated for MongoDB"""
    from app.db import get_database
    
    try:
        # Get the collection name from the model class
        collection_name = KlassName.__name__.lower() + 's'  # e.g., Video -> videos
        
        # Get database connection
        db = get_database()
        collection = getattr(db, collection_name)
        
        # Find the document
        document = await collection.find_one(kwargs)
        
        if document is None:
            raise StarletteHTTPException(status_code=404)
        
        # Convert ObjectId to string for Pydantic model
        document['id'] = str(document['_id'])
        del document['_id']
        
        # Create model instance from document
        return KlassName(**document)
        
    except StarletteHTTPException:
        raise
    except Exception as e:
        print(f"Error in get_object_or_404: {e}")
        raise StarletteHTTPException(status_code=500)

def redirect(path, cookies:dict={}, remove_session=False):
    response = RedirectResponse(path, status_code=302)
    for k, v in cookies.items():
        response.set_cookie(key=k, value=v, httponly=True)
    if remove_session:
        response.set_cookie(key='session_ended', value=1, httponly=True)
        response.delete_cookie('session_id')
    return response



def render(request, template_name, context={}, status_code:int=200, cookies:dict={}):
    ctx = context.copy()
    ctx.update({"request": request})
    t = templates.get_template(template_name)
    html_str = t.render(ctx)
    response = HTMLResponse(html_str, status_code=status_code)
    # print(request.cookies)
    response.set_cookie(key='darkmode', value=1)
    if len(cookies.keys()) > 0:
        
        # set httponly cookies
        for k, v in cookies.items():
            response.set_cookie(key=k, value=v, httponly=True)
    # delete coookies
    # for key in request.cookies.keys():
    #     response.delete_cookie(key)
    return response