from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from Model import Users as User
from app.schemas.auth import UserRegister, UserLogin, Token, RefreshToken, RegisterResponse, LoginResponse, EmailSchema, ResetPassword
from app.utils.auth import hash_password, verify_password, create_access_token, create_refresh_token, verify_refresh_token, create_verification_email, verify_verification_email, create_reset_token
from datetime import timedelta
from database import get_db
from app.utils.dependencies import get_current_user
from fastapi_mail import FastMail, MessageSchema, MessageType
from app.config import conf
from datetime import datetime
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
import jwt

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "Alert")
ALGORITHM = "HS256"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


# Register User
@router.post("/register")
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_users = db.query(User).filter(User.phoneNumber == user_data.phoneNumber).first()
    print(existing_users)
    if existing_users:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    
    # Hash the password
    hashed_password = hash_password(user_data.password)
    
    # ✅ Step 1: Create user (but set is_verified=False)
    new_user = User(
        fullName=user_data.fullName,
        email=user_data.email,
        password=hashed_password,
        phoneNumber=user_data.phoneNumber,
        address=user_data.address,
        pincode=user_data.pincode,
        latitude=user_data.coordinates['latitude'],
        longitude=user_data.coordinates['longitude'],
        is_verified=False,  # Set to False initially
        createdAt=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ✅ Step 2: Generate verification token
    token = create_verification_email(new_user.email)
    verification_link = f"{BACKEND_URL}/auth/verify-email?token={token}"

    # ✅ Step 3: Send verification email
    message = MessageSchema(
        subject="Verify your email",
        recipients=[new_user.email],
        body=f"Click the link to verify your email: <a href='{verification_link}'>Verify Now</a>",
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)

    return {"status": status.HTTP_201_CREATED, "detail": "Verification email sent. Please verify your email to login."}


# Login User
@router.post("/login")
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    
    '''Check if user is verified'''
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified. Please verify your email.")
    
    # update user coordinates
    user.latitude = user_data.coordinates['latitude']
    user.longitude = user_data.coordinates['longitude']
    
    db.commit()
    db.refresh(user)

    # Generate JWT token
    access_token = create_access_token({"sub": user.email}, timedelta(minutes=30))
    refresh_token = create_refresh_token({"sub": user.email}, timedelta(days=15))
    return {
        "status": status.HTTP_200_OK,
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "username": user.fullName,
        "id": user.id,
    }

#delete User
@router.delete("/delete")
def delete_user(current_user: User = Depends(get_current_user) , db: Session = Depends(get_db)):
    
    if not isinstance(current_user, User):
        raise HTTPException(status_code=400, detail="Invalid user instance")

    db.delete(current_user)  
    db.commit()

    return {"message": "User deleted successfully"}

# get Access Token
@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: RefreshToken, db: Session = Depends(get_db)):
    
    user = verify_refresh_token(refresh_token, db)
  
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    access_token = create_access_token({"sub": user.email}, timedelta(minutes=15))
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token.refresh_token, status: 200}

#verify email
@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    try:
        verify = verify_verification_email(token, db)
        if not verify:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        user = db.query(User).filter(User.email == verify).first()
        user.is_verified = True
        
        db.commit()
        
        return {"status": "success", "message": "Email verified successfully. You can now log in."}
        
    except:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        
# Get User Profile
@router.get("/profile")
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/send-email")
async def send_email( payload: EmailSchema, db: Session = Depends(get_db)):
    
    email = payload.email
    
    current_user = db.query(User).filter(User.email == email).first()
    
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reset_token = create_reset_token(current_user.email)
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    print(reset_link)
    
    message = MessageSchema(
    subject="🔒 Reset Your Password - Secure Your Account",
    recipients=[current_user.email],
    body=f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; 
                border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        
        <h2 style="text-align: center; color: #333;">🔑 Password Reset Request</h2>

        <p style="font-size: 16px; color: #555;">
            Hello <strong>{current_user.email}</strong>,
        </p>

        <p style="font-size: 16px; color: #555;">
            We received a request to reset your password. If you made this request, please click the button below to reset your password.
        </p>

        <div style="text-align: center; margin: 20px 0;">
            <!-- ✅ Clickable <a> Button with Styling -->
            <a href="{reset_link}" target="_blank"
               style="display: inline-block; font-size: 16px; font-weight: bold; 
                      color: white; text-decoration: none; padding: 12px 24px; 
                      border-radius: 5px; background-color: #007BFF;">
                🔄 Reset Password
            </a>
        </div>

        <p style="font-size: 14px; color: #777; text-align: center;">
            If you didn't request this, you can safely ignore this email.
        </p>

        <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">

        <p style="font-size: 14px; color: #777; text-align: center;">
            Need help? <a href="{FRONTEND_URL}/support" style="color: #007BFF;">Contact Support</a>
        </p>

    </div>
    """,
    subtype=MessageType.html
)
    
    fm = FastMail(conf)
    await fm.send_message(message)
    
    return {"message": "Password reset email sent successfully"}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



@router.post("/reset-password")
async def reset_password(payload: ResetPassword, db: Session = Depends(get_db)):
    """Reset the user's password after verifying the reset token."""
    try:

        token = payload.token
        new_password = payload.new_password
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Hash and update the new password
        user.password = pwd_context.hash(new_password)
        db.commit()

        return {"message": "Password reset successfully"}

    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    