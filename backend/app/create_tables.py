from sqlmodel import SQLModel
from app.database import engine

if __name__ == "__main__":
    SQLModel.metadata.create_all(engine)
    print("All tables created.") 