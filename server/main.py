from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from typing import Annotated
from database import SessionLocal, engine
import Model
from pydantic import BaseModel
from app.api import auth, shelters, sos,food, news
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow only specified origins
    allow_credentials=True,  # Allow cookies/authentication
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Allow all headers
)

# Create tables in the database
Model.Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

class user(BaseModel):
    username: str
    password: str
    email: str

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.get("/users")
async def get_users(db: db_dependency):
    users = db.query(Model.Users).all()
    return users



app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(shelters.router, prefix="/shelter", tags=["shelters"])
app.include_router(sos.router, prefix="/sos", tags=["sos"])
app.include_router(food.router, prefix="/food", tags=["food"])
app.include_router(news.router, prefix="/news", tags=["news"])