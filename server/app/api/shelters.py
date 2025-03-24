from fastapi import APIRouter, Depends, HTTPException, Query, status, Form, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from Model import Shelters
from math import radians, sin, cos, sqrt, atan2
from app.utils.dependencies import get_current_user
from datetime import datetime
from pydantic import BaseModel
import os
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

@router.get("/get-shelters")
async def get_shelters(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    dist: int = Query(..., description="Distance in km to search for shelters"),
    db: Session = Depends(get_db),
):
    """
    Fetch shelters within a  km radius of the user's location.
    """
    
    print(f"Received coordinates: ({latitude}, {longitude}) with distance {dist} km")

    shelters = db.query(Shelters).all()
    nearby_shelters = []

    for shelter in shelters:
        if shelter.latitude is None or shelter.longitude is None:
            continue  # Skip shelters without valid coordinates

        distance = haversine(latitude, longitude, shelter.latitude, shelter.longitude)
        
        if distance <= dist:
            nearby_shelters.append(shelter)

    if not nearby_shelters:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No shelters found within 10 km radius",
        )
        
    print(f"Found {len(nearby_shelters)} shelters within {dist} km of ({latitude}, {longitude})")

    return {"shelters": nearby_shelters}

UPLOAD_FOLDER = "images"

# add new shelters
@router.post("/add")
async def add_shelter(
    name: str = Form(...),
    address: str = Form(...),
    pincode: str = Form(...),
    image: UploadFile = File(...),  # ✅ Accepts a file instead of a string
    latitude: float = Form(...),
    longitude: float = Form(...),
    userLatitude: float = Form(...),
    userLongitude: float = Form(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Add a new shelter to the database.
    """
    
    print(f"Received shelter data: {name}, {address}, {pincode}, {latitude}, {longitude}")
    
    # check latitude and longitude
    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude and Longitude are required",
        )

    # Save the image file
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
        
    print(f"Image uploaded to: {image_path}")

    # Create the shelter entry
    new_shelter = Shelters(
        name=name,
        address=address,
        pincode=pincode,
        images=image_path,  # ✅ Save the image path
        latitude=latitude,
        longitude=longitude,
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        userId=current_user.id,  # Assuming current_user has an id attribute
        distance=haversine(latitude, longitude, userLatitude, userLongitude),  # Placeholder for distance calculation
    )

    db.add(new_shelter)
    db.commit()
    db.refresh(new_shelter)

    return {
        "status": 200,
        "detail": "Shelter added successfully",
    }
    

# get shelters by user id
@router.get("/get-shelters-by-user")
def get_shelters_by_user(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch shelters added by a specific user.
    """
    
    print(f"Fetching shelters for user ID: {current_user.id}")
    
    shelters = db.query(Shelters).filter(Shelters.userId == current_user.id).order_by(Shelters.createdAt.desc()).all()

    if not shelters:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No shelters found for this user",
        )

    return {"shelters": shelters}

# delete shelters by user id
@router.delete("/delete/{shelter_id}")
def delete_shelter(
    shelter_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a shelter by its ID.
    """
    
    print(f"Deleting shelter with ID: {shelter_id} for user ID: {current_user.id}")
    
    shelter = db.query(Shelters).filter(Shelters.id == shelter_id, Shelters.userId == current_user.id).first()

    if not shelter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found or you do not have permission to delete it",
        )

    # Delete the image file if it exists
    if shelter.images and os.path.exists(shelter.images):
        os.remove(shelter.images)

    db.delete(shelter)
    db.commit()

    return {"status": 200, "detail": "Shelter deleted successfully"}


# update shelters by user id
@router.put("/update/{shelter_id}")
def update_shelter(
    shelter_id: int,
    name: str = Form(...),
    address: str = Form(...),
    pincode: str = Form(...),
    image: UploadFile = File(None),  # Optional image
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Update a shelter's details.
    """
    
    print(f"Updating shelter with ID: {shelter_id} for user ID: {current_user.id}")
    
    shelter = db.query(Shelters).filter(Shelters.id == shelter_id, Shelters.userId == current_user.id).first()

    if not shelter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found or you do not have permission to update it",
        )

    # Update the shelter's details
    shelter.name = name
    shelter.address = address
    shelter.pincode = pincode
    shelter.latitude = latitude
    shelter.longitude = longitude
    shelter.description = description
    shelter.pincode = pincode
    shelter.updatedAt = datetime.now()

    # Save the new image if provided
    if image:
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        image_path = f"{UPLOAD_FOLDER}/{image.filename}"
        
        with open(image_path, "wb") as buffer:
            buffer.write(image.file.read())
        # Delete the old image file if it exists
        if shelter.images and os.path.exists(shelter.images):
            os.remove(shelter.images)
            
        shelter.images = image_path
    else:
        shelter.images = shelter.images
    # Update the distance
    shelter.distance = haversine(latitude, longitude, shelter.latitude, shelter.longitude)
    shelter.updatedAt = datetime.now()
    db.commit()
    db.refresh(shelter)
    
    return {
        "status": 200,
        "detail": "Shelter updated successfully",
    }