from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float = Field(gt=0)
    quantity_in_stock : int = Field(ge=0)

class ProductUpdate(BaseModel):
    name: str
    sku: str
    price: float = Field(gt=0)
    quantity_in_stock: int = Field(ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    quantity_in_stock: int

    class Config:
        from_attributes = True