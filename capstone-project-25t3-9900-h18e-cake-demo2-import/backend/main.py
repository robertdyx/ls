# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path, PurePosixPath
import json, os, shutil, logging
import models, schemas, crud
from database import SessionLocal, engine, Base
import re

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Posts Backend", version="1.0.0")

allow_origins=[
        "https://robertdyx.github.io",   # 你的 GitHub Pages 域
        "http://localhost:5173",         # 本地vite调试（可选）
        "http://127.0.0.1:5173",
        "*"                              # 临时放开，若想更严谨可去掉这一行
    ]

# ALLOW_ORIGIN_REGEX = r"https://([a-z0-9-]+\.)*ngrok-free\.dev$"
ALLOW_ORIGIN_REGEX = r"https://([a-z0-9-]+\.)*(github\.io|ngrok-free\.dev)$""

# CORS：gh-pages / ngrok / 本地都能请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=ALLOW_ORIGIN_REGEX,  # 可选：放宽到任意 *.github.io
    allow_credentials=False,  # 你没用 cookie/凭证就设 False，便于使用通配
    allow_methods=["*"],      # 允许所有方法（含预检需要的 OPTIONS）
    allow_headers=["*", "ngrok-skip-browser-warning", "x-requested-with"],      # 允许所有头
    expose_headers=["content-type"],             # 可选：前端若需读取自定义响应头
    max_age=86400, 
)

# --- end CORS ---


backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== 健康检查 / 兼容 story.json / 友好根提示 ==========
@app.get("/healthz")
def health():
    return {"ok": True}

@app.get("/")
def root():
    return {"service": "Posts Backend", "hint": "Use /story, /story.json, /sections, /posts ..."}

# ========== story（读） ==========
def _build_story_payload(story: models.Story) -> dict:
    payload = {
        "id": story.id,
        "version": story.version or "1.0",
        "title": story.title or "Story",
        "standfirst": story.standfirst or "",
        "theme": {
            "font": story.theme_font or "Montserrat",
            "primaryColor": story.theme_primary_color or "#00007a",
        },
        "sections": [],
    }
    for sec in story.sections:
        try:
            payload["sections"].append(json.loads(sec.data or "{}"))
        except json.JSONDecodeError:
            payload["sections"].append({"type": sec.type})
    return payload

@app.get("/story")
def get_story(db: Session = Depends(get_db)):
    story = crud.get_latest_story(db)
    if not story:
        raise HTTPException(status_code=404, detail="No story found")
    return _build_story_payload(story)

@app.get("/story.json")
def get_story_json(db: Session = Depends(get_db)):
    # 和 /story 返回完全一致，方便静态页面兜底读取
    return get_story(db)

# ========== sections（增删改查） ==========
@app.get("/sections", response_model=List[schemas.SectionRead])
def list_sections(story_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_sections(db, story_id=story_id, skip=skip, limit=limit)

@app.post("/sections", response_model=schemas.SectionRead)
def create_section(section: schemas.SectionCreate, story_id: int, db: Session = Depends(get_db)):
    created = crud.create_section(db, section, story_id)
    return created

@app.patch("/sections/{section_id}", response_model=schemas.SectionRead)
def update_section(section_id: int, payload: dict, db: Session = Depends(get_db)):
    updated = crud.update_section(
        db, section_id,
        section_type=payload.get("type"),
        data=payload.get("data"),
        sort_order=payload.get("sort_order"),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Section not found")
    return updated

@app.delete("/sections/{section_id}")
def delete_section(section_id: int, db: Session = Depends(get_db)):
    story_id = crud.delete_section(db, section_id)
    if story_id is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"deleted": True, "id": section_id}

# ========== posts（按需保留） ==========
@app.get("/posts", response_model=List[schemas.PostRead])
def list_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_posts(db, skip=skip, limit=limit)

@app.post("/posts", response_model=schemas.PostRead)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    return crud.create_post(db, post)

@app.get("/posts/{post_id}", response_model=schemas.PostRead)
def read_post(post_id: int, db: Session = Depends(get_db)):
    post = crud.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@app.patch("/posts/{post_id}", response_model=schemas.PostRead)
def update_post(post_id: int, payload: schemas.PostUpdate, db: Session = Depends(get_db)):
    post = crud.update_post(db, post_id, payload)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@app.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_post(db, post_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"deleted": True, "id": post_id}

# ========== 上传（前端管理 public 资源时用，可选） ==========
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), target_path: str = Form(...)):
    public_dir = (project_root / "capstone-frontend" / "public").resolve()
    public_dir.mkdir(parents=True, exist_ok=True)

    pure = PurePosixPath(target_path.lstrip("/"))
    if any(p == ".." for p in pure.parts) or not pure.parts:
        raise HTTPException(status_code=400, detail="非法目标路径")

    full = (public_dir / Path(*pure.parts)).resolve()
    if public_dir not in full.parents and full != public_dir:
        raise HTTPException(status_code=400, detail="目标路径不在允许的 public 目录内")

    with open(full, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    return {"success": True, "url": "/" + str(pure), "filename": full.name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
