from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    current_version_number = Column(Integer, nullable=False, default=1)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all,delete")
    tags = relationship("Tag", secondary="document_tags", back_populates="documents")
    permissions = relationship("DocumentPermission", back_populates="document", cascade="all,delete")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    file_path = Column(Text, nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_by_name = Column(String(150), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="versions")

    __table_args__ = (
        # Ensure uniqueness per document
        {"sqlite_autoincrement": True},
    )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    documents = relationship("Document", secondary="document_tags", back_populates="tags")


class DocumentTag(Base):
    __tablename__ = "document_tags"

    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)


class DocumentPermission(Base):
    __tablename__ = "document_permissions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    can_view = Column(Integer, nullable=False, default=1)      # booleans as ints portable
    can_download = Column(Integer, nullable=False, default=1)

    document = relationship("Document", back_populates="permissions")