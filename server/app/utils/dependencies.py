from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
from dotenv import load_dotenv
from database import get_db
from sqlalchemy.orm import Session
from Model import Users as User
from typing import Optional

load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY", "Alert")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    
    print(token)
    
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token is required")

    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")  # Extract email from token
        
        if not email:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        # Query the user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user  # You can return a dict or Pydantic model instead

    except:  
        print(token)
        raise HTTPException(status_code=401, detail="Invalid token")


def get_user_or_none(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Returns user if a valid token is provided, otherwise returns "No token provided".
    """
    
    print(token)
    if not token:
        return {"message": "No token provided"}

    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")  # Extract email from token

        if not email:
            return {"message": "Invalid token"}

        # Query the user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return {"message": "User not found"}

        return user  # Return the user object if everything is valid

    except jwt.ExpiredSignatureError:
        return {"message": "Token has expired"}

    except jwt.InvalidTokenError:
        return {"message": "Invalid token"}

    except Exception as e:
        return {"message": f"An error occurred: {str(e)}"}
