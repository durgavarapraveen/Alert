from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    phoneNumber: str
    address: str
    pincode: str
    coordinates: dict[str, float]  # Assuming coordinates is a dict with 'latitude' and 'longitude' keys
    is_verified: bool = False


class RegisterResponse(BaseModel):
    status: int
    detail: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    coordinates: dict[str, float]  # Assuming coordinates is a dict with 'latitude' and 'longitude' keys
    
class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    username: str
    user_id: int
    department: str
    status: int

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    status: int
    
class RefreshToken(BaseModel):
    refresh_token: str
    
class EmailSchema(BaseModel):
    email: EmailStr
    
class ResetPassword(BaseModel):
    token: str
    new_password: str