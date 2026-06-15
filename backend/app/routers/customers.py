from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate

router = APIRouter(
    prefix="/customer",
    tags=["Customers"]
)

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db)
):
    existing = (
        db.query(Customer)
        .filter(Customer.email == payload.email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            details="Email already exists",
        )
    
    customer = Customer(**payload.model_dump())

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer

@router.get("/")
def get_customer(
    db: Session = Depends(get_db)
): return db.query(Customer).all()

@router.get("/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )
    return customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    db.delete(customer)
    db.commit()

    return {
        "message": "Customer deleted"
    }