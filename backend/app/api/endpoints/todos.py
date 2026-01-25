from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import TodoItem

DbDependency = Annotated[Session, Depends(get_db)]

router = APIRouter()


class TodoItemCreate(BaseModel):
    """Request model for creating a todo item."""

    title: str = Field(..., min_length=1, max_length=200)


class TodoItemResponse(BaseModel):
    """Response model for a todo item."""

    id: int
    title: str
    is_done: bool
    created_at: str

    model_config = {"from_attributes": True}


@router.get("/todos")
def get_todos(db: DbDependency) -> list[TodoItemResponse]:
    """Get all todo items."""
    stmt = select(TodoItem).order_by(TodoItem.created_at.desc())
    todos = db.execute(stmt).scalars().all()
    return [
        TodoItemResponse(
            id=todo.id,
            title=todo.title,
            is_done=todo.is_done,
            created_at=todo.created_at.isoformat(),
        )
        for todo in todos
    ]


@router.post("/todos", status_code=201)
def create_todo(
    todo: TodoItemCreate,
    db: DbDependency,
) -> TodoItemResponse:
    """Create a new todo item."""
    db_todo = TodoItem(title=todo.title, is_done=False)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return TodoItemResponse(
        id=db_todo.id,
        title=db_todo.title,
        is_done=db_todo.is_done,
        created_at=db_todo.created_at.isoformat(),
    )


@router.patch("/todos/{todo_id}/done")
def mark_todo_done(todo_id: int, db: DbDependency) -> TodoItemResponse:
    """Mark a todo item as done."""
    stmt = select(TodoItem).where(TodoItem.id == todo_id)
    todo = db.execute(stmt).scalar_one_or_none()

    if not todo:
        raise HTTPException(status_code=404, detail="Todo item not found")

    todo.is_done = True
    db.commit()
    db.refresh(todo)
    return TodoItemResponse(
        id=todo.id,
        title=todo.title,
        is_done=todo.is_done,
        created_at=todo.created_at.isoformat(),
    )


@router.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: DbDependency) -> None:
    """Delete a todo item."""
    stmt = select(TodoItem).where(TodoItem.id == todo_id)
    todo = db.execute(stmt).scalar_one_or_none()

    if not todo:
        raise HTTPException(status_code=404, detail="Todo item not found")

    db.delete(todo)
    db.commit()
