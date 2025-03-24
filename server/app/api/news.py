from fastapi import APIRouter, Depends, HTTPException, Query, status, Form
from sqlalchemy.orm import Session
from database import get_db
from Model import News
from math import radians, sin, cos, sqrt, atan2
from fastapi import File, UploadFile
from datetime import datetime
from app.utils.dependencies import get_current_user
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


@router.get("/news")
def get_news(
    latitude: float = Query(..., description="Latitude of the user"),
    longitude: float = Query(..., description="Longitude of the user"),
    distance: float = Query(5, description="Search radius in km"),
    db: Session = Depends(get_db),
):

    """
    Get all news within a specified distance from the user's location.
    """
    # Fetch all news from the database
    all_news = db.query(News).all()
    
    # Filter news based on distance
    filtered_news = []
    for news in all_news:
        dist = haversine(latitude, longitude, news.latitude, news.longitude)
        if dist <= distance:
            news.distance = dist
            
            filtered_news.append(news)
            
    # Sort news by distance
    filtered_news.sort(key=lambda x: x.distance)
    
    # only past 3 days news
    filtered_news = [news for news in filtered_news if (datetime.now() - news.createdAt).days <= 3]
    
    #Limit to 100 results
    filtered_news = filtered_news[:100]
    
    if not filtered_news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No news found within the specified distance.")
    
    return {
        "news": filtered_news,
        "count": len(filtered_news),
    }
    
    


UPLOAD_FOLDER = "images"
# add news
@router.post("/add")
async def add_news(
     title: str = Form(...), 
    description: str = Form(...), 
    image: UploadFile = File(None), 
    latitude: float = Form(...),  
    longitude: float = Form(...),  
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
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
        
    
        

    # ✅ Use "images" instead of "image" (as per DB model)
    new_news = News(
        title=title,
        description=description,
        images=image_path,  # ✅ Fix column name
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        userId=current_user.id,
        latitude=latitude,
        longitude=longitude,
        distance=0,  # Placeholder for distance
    )
    
    db.add(new_news)
    db.commit()
    db.refresh(new_news)
    
    return {"message": "News added successfully", "news": new_news}

# get upload news by user
@router.get("/mynews")
def get_my_news(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """
    Get all news uploaded by the current user.
    """
    my_news = db.query(News).filter(News.userId == current_user.id).order_by(News.createdAt.desc()).all()
    
    if not my_news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No news found for this user.")
    
    return {
        "news": my_news,
        "count": len(my_news),
    }
    
# delete news
@router.delete("/delete/{news_id}")
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """
    Delete a news item by its ID.
    """
    news_to_delete = db.query(News).filter(News.id == news_id, News.userId == current_user.id).first()
    
    if not news_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News not found or not authorized to delete.")
    
    db.delete(news_to_delete)
    db.commit()
    
    return {"message": "News deleted successfully"}

# update news
@router.put("/update/{news_id}")
def update_news(
    news_id: int,
    title: str = Form(...), 
    description: str = Form(...), 
    image: UploadFile = File(None), 
    latitude: float = Form(...),  
    longitude: float = Form(...),  
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    """
    Update a news item by its ID.
    """
    news_to_update = db.query(News).filter(News.id == news_id, News.userId == current_user.id).first()
    
    if not news_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News not found or not authorized to update.")
    
    if image:
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        image_path = f"{UPLOAD_FOLDER}/{image.filename}"
        with open(image_path, "wb") as buffer:
            buffer.write(image.file.read())
            
        news_to_update.images = image_path
    news_to_update.title = title
    news_to_update.description = description
    news_to_update.latitude = latitude
    news_to_update.longitude = longitude
    news_to_update.updatedAt = datetime.now()
    db.commit()
    
    db.refresh(news_to_update)
    return {"message": "News updated successfully", "news": news_to_update}