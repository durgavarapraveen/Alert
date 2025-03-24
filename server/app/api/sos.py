

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from app.utils.dependencies import get_current_user, get_user_or_none
from Model import SOS
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
from sqlalchemy import asc, desc


router = APIRouter()

@router.post("/sos")
def get_sos(
    persons: int = Query(..., description="Number of persons affected"),
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user), 
):
    """
    Send SOS request with user's latitude and longitude.
    Accepts both authenticated and unauthenticated users.
    """

    # Set userId to None if not provided
    

    sos_request = SOS(
        userId=current_user.id if current_user else None,
        createdAt=datetime.utcnow(),
        issue_rectified=False,
        latitude=latitude,
        longitude=longitude,
        persons=persons if persons else 1,
    )

    # Save to database
    db.add(sos_request)
    db.commit()
    db.refresh(sos_request)

    return {
        "message": "🚨 SOS request sent successfully!",
        "latitude": latitude,
        "longitude": longitude,
        "persons": persons
    }
    
    
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate the Haversine distance between two points on Earth."""
    R = 6371  # Radius of Earth in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return round(R * c, 2)  # Distance in km

@router.get("/all")
def get_sos_alerts(
    db: Session = Depends(get_db),
    admin_latitude: float = Query(None, description="Admin latitude"),
    admin_longitude: float = Query(None, description="Admin longitude"),
    radius: int = Query(10, description="Radius in km (5, 10, 15, 20)"),
    start_date: str = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(None, description="End date in YYYY-MM-DD format"),
):
    """Fetch SOS alerts sorted and filtered by distance, latitude, longitude, and date."""
    
    # Default date range (last 2 days)
    if not start_date or not end_date:
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=2)
    else:
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    # Fetch all alerts within the date range
    alerts = db.query(SOS).filter(
        SOS.createdAt >= start_date,
        SOS.createdAt <= end_date
    ).all()

    # Compute distances and filter by radius
    filtered_alerts = []
    for alert in alerts:
        if admin_latitude is not None and admin_longitude is not None:
            alert_distance = calculate_distance(
                admin_latitude, admin_longitude, alert.latitude, alert.longitude
            )
            if alert_distance <= radius:
                alert.distance = alert_distance  # Attach distance to alert
                filtered_alerts.append(alert)
        else:
            # If no admin location, just return all alerts
            filtered_alerts.append(alert)

    # only not resolved alerts
    filtered_alerts = [alert for alert in filtered_alerts if not alert.resolved]
    

    return {"sos_alerts": filtered_alerts}

@router.put("/resolve/{sosId}")
def get_sos_by_id(
    sosId: int,
    db: Session = Depends(get_db),
):
    """Fetch SOS alert by ID."""
    
    sos_alert = db.query(SOS).filter(SOS.id == sosId).first()
    
    if not sos_alert:
        raise HTTPException(status_code=404, detail="SOS alert not found")
  
        
    # Check if the SOS alert is resolved
    if sos_alert.resolved:
        raise HTTPException(status_code=400, detail="SOS alert already resolved")
    
    # Update the SOS alert to resolved
    sos_alert.resolved = True
    
    db.commit()
    db.refresh(sos_alert)
    
    
    
    return {
        "message": "SOS alert resolved successfully",
    }
    

#resolved alerts
@router.get("/resolved")

def get_resolved_sos_alerts(
    db: Session = Depends(get_db),
):
    """Fetch SOS alerts sorted and filtered by distance, latitude, longitude, and date."""
    # Fetch all alerts
    alerts = db.query(SOS).filter(
        SOS.resolved == True
    ).all()

    return {"sos_alerts": alerts}