from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Float
from sqlalchemy.dialects.postgresql import JSON
from database import Base

coord = {"", ""}

class Users(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    fullName = Column(String, index=True)
    password = Column(String)
    email = Column(String, unique=True, index=True)
    phoneNumber = Column(String, nullable=True, index=True, unique=True)
    is_verified = Column(Boolean, default=False)
    createdAt = Column(DateTime, nullable=False)
    address = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    admin = Column(Boolean, default=False)
    

class Shelters(Base):
    
    __tablename__ = 'shelters'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    images = Column(String, nullable=True)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    userId = Column(Integer, ForeignKey("users.id"), nullable=True)
    distance = Column(Float, nullable=True)  # Distance in km
    
class SOS(Base):
    __tablename__ = 'sos'
    id = Column(Integer, primary_key=True, index=True)
    createdAt = Column(DateTime, nullable=False)
    issue_rectified = Column(Boolean, default=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    persons = Column(Integer, nullable=True)
    userId = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved = Column(Boolean, default=False)
    
class FoodProvidingRegions(Base):
    __tablename__ = 'food'
    id = Column(Integer, primary_key=True, index=True)
    createdAt = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    description = Column(String, nullable=True)
    images = Column(String, nullable=True)
    userId = Column(Integer, ForeignKey("users.id"), nullable=True)
    distance = Column(Float, nullable=True) 
    
class News(Base):
    __tablename__ = 'news'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)
    images = Column(String, nullable=True)
    userId = Column(Integer, ForeignKey("users.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    distance = Column(Float, nullable=True)
