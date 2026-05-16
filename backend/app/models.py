from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class LocalTip(Base):
    __tablename__ = "local_tips"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    city: Mapped[str] = mapped_column(String(120), index=True)
    category: Mapped[str] = mapped_column(String(60), default="general")
    content: Mapped[str] = mapped_column(Text)
    author_handle: Mapped[str] = mapped_column(String(60), default="anonymous")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
