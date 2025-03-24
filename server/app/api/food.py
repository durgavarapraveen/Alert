from fastapi import APIRouter, Depends, HTTPException, Query, status, Form, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from Model import FoodProvidingRegions
from math import radians, sin, cos, sqrt, atan2
from app.utils.dependencies import get_current_user
from datetime import datetime   
from app.utils.amazon import s3_upload

router = APIRouter()

def haversine(lat1, lon1, lat2, lon2):
    """
    Haversine formula to calculate the distance (in km) between two latitude-longitude points.
    """
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c  # Distance in km

@router.get("/food") 
def getFood(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    dist: int = Query(10, description="Distance in km to search for shelters"),
    db: Session = Depends(get_db),
):
    """
    Fetch Regions within a 10 km radius of the user's location.
    """

    food = db.query(FoodProvidingRegions).all()
    
    nearby_food = []
    
    for food_region in food:
        if food_region.latitude is None or food_region.longitude is None:
            continue
        
        distance = haversine(latitude, longitude, food_region.latitude, food_region.longitude)
        
        if distance <= dist:
            nearby_food.append(food_region)
            
    if not nearby_food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No food providing regions found within {dist}  km radius",
        )
        
    return {"food": nearby_food}
        
    
@router.post("/add") 
async def addFood(
    address: str = Form(..., description="Address of the food providing region"),
    pincode: str = Form(..., description="Pincode of the food providing region"),
    description: str = Form(..., description="Description of the food providing region"),
    latitude: float = Form(..., description="Latitude of the food providing region"),
    longitude: float = Form(..., description="Longitude of the food providing region"),
    userLatitude: float = Form(None, description="User's latitude"),
    userLongitude: float = Form(None, description="User's longitude"),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """
    Add a new food providing region.
    """
    
    image_path = None
    
    if image is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image is required.")
    
    photo = image.file.read()
    
    # check if the image is empty
    if not photo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image file.")
    
    
    if image:
        timeStamp = datetime.now().strftime("%Y%m%d%H%M%S")
        image_path = await s3_upload(contents=photo, key=f"news/{timeStamp}_{image.filename}")
        
        if not image_path:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload image.")
        
    dist = haversine(latitude, longitude, userLatitude, userLongitude)
    
    food_region = FoodProvidingRegions(
        address=address,
        pincode=pincode,
        description=description,
        latitude=latitude,
        longitude=longitude,
        images=image_path,
        createdAt=datetime.now(),
        userId=current_user.id,
        distance=dist,
    )
    
    db.add(food_region)
    db.commit()
    db.refresh(food_region)
    
    return {"message": "Food providing region added successfully", "food": food_region}

# get food by user id
@router.get("/get-food-regions")
def get_food_by_user_id(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch food providing regions by user ID.
    """
    food = db.query(FoodProvidingRegions).filter(FoodProvidingRegions.userId == current_user.id).order_by(FoodProvidingRegions.createdAt.desc()).all()
    
    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No food providing regions found for this user",
        )
        
    return {"food": food}

# update food region by id
@router.put("/update/{food_id}")
def update_food_region(
    food_id: int,
    address: str = Form(..., description="Address of the food providing region"),
    pincode: str = Form(..., description="Pincode of the food providing region"),
    description: str = Form(..., description="Description of the food providing region"),
    latitude: float = Form(..., description="Latitude of the food providing region"),
    longitude: float = Form(..., description="Longitude of the food providing region"),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """
    Update a food providing region by ID.
    """
    
    food_region = db.query(FoodProvidingRegions).filter(FoodProvidingRegions.id == food_id).first()
    
    if not food_region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food providing region not found",
        )
    
    if image:
        image_path = f"images/{image.filename}"
        with open(image_path, "wb") as buffer:
            buffer.write(image.file.read())
        food_region.images = image_path
        
    food_region.address = address
    food_region.pincode = pincode
    food_region.description = description
    food_region.latitude = latitude
    food_region.longitude = longitude
    
    db.commit()
    
    return {"message": "Food providing region updated successfully", "food": food_region}

# delete food region by id
@router.delete("/delete/{food_id}")
def delete_food_region(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """
    Delete a food providing region by ID.
    """
    
    food_region = db.query(FoodProvidingRegions).filter(FoodProvidingRegions.id == food_id).first()
    
    if not food_region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food providing region not found",
        )
    
    db.delete(food_region)
    db.commit()
    
    return {"message": "Food providing region deleted successfully"}