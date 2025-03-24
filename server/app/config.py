from fastapi_mail import ConnectionConfig
from pydantic import BaseModel

class MailSettings(BaseModel):
    MAIL_USERNAME: str = "geda.1@iitj.ac.in"
    MAIL_PASSWORD: str = "vhut qzmt ubdd eerh"
    MAIL_FROM: str = "geda.1@iitj.ac.in"
    MAIL_PORT: int = 587  # Use 465 for SSL
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True  # Correct field for TLS
    MAIL_SSL_TLS: bool = False  # Correct field for SSL/TLS

mail_settings = MailSettings()

conf = ConnectionConfig(
    MAIL_USERNAME=mail_settings.MAIL_USERNAME,
    MAIL_PASSWORD=mail_settings.MAIL_PASSWORD,
    MAIL_FROM=mail_settings.MAIL_FROM,
    MAIL_PORT=mail_settings.MAIL_PORT,
    MAIL_SERVER=mail_settings.MAIL_SERVER,
    MAIL_STARTTLS=mail_settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=mail_settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True
)
